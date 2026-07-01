import "./loadEnv.js"; // Must be first — loads .env into process.env
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { db, parseRow, stringifyRow, FK_MAP } from "./db.js";
import { signToken, verifyToken, extractToken } from "./auth.js";
import { CARRIERS } from "./scrapers/carriers.js";
import { scrapeCarrier } from "./scrapers/runner.js";
import { fetchAdzunaJobs } from "./scrapers/adzuna.js";
import { fetchJobicyJobs } from "./scrapers/jobicy.js";
import { fetchUSAJobsJobs } from "./scrapers/usajobs.js";
import { registerScheduledTask } from "./scheduler.js";
import { fetchCareerjetJobs } from "./scrapers/careerjet.js";
import { fetchJSearchJobs } from "./scrapers/jsearch.js";
import { fetchIndeedJobs } from "./scrapers/indeed-rss.js";
import type { ScrapedJob } from "./scrapers/types.js";
import {
  sendAdminLeadAlert,
  sendDriverConfirmation,
  sendQuickApplyAlert,
  sendDailyDigest,
} from "./email.js";
import { seedBlogPosts } from "./seeds/blog-posts.js";

// Auto-seed blog posts on every startup (INSERT OR IGNORE — never overwrites admin edits)
try { seedBlogPosts(); } catch (e) { console.warn("Blog seed skipped:", e); }

const app = new Hono();

// ── CORS ────────────────────────────────────────────────────────────────
app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"] }));

// ── Auth middleware (optional — sets c.var.user if valid token) ─────────
app.use("/api/*", async (c, next) => {
  const token = extractToken(c.req.header("authorization"));
  if (token) {
    const payload = verifyToken(token);
    if (payload) (c as any).user = payload;
  }
  await next();
});

function requireAuth(c: any) {
  if (!(c as any).user) return c.json({ message: "Unauthorized" }, 401);
  return null;
}
function requireAdmin(c: any) {
  const user = (c as any).user;
  if (!user) return c.json({ message: "Unauthorized" }, 401);
  if (!user.is_admin) return c.json({ message: "Forbidden" }, 403);
  return null;
}

// ────────────────────────────────────────────────────────────────────────
// AUTH ROUTES
// ────────────────────────────────────────────────────────────────────────

app.post("/api/auth/register", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.email || !body?.password) return c.json({ message: "email and password required" }, 400);

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(body.email.toLowerCase().trim());
  if (existing) return c.json({ message: "Email already registered" }, 409);

  const id = randomUUID();
  const password_hash = await bcrypt.hash(body.password, 10);

  try {
    db.prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)").run(id, body.email.toLowerCase(), password_hash);
  } catch (e: any) {
    return c.json({ message: "Failed to create account: " + (e?.message ?? "unknown error") }, 500);
  }

  // SQLite only accepts null | number | bigint | string | Buffer — convert everything else
  const toSqlite = (v: unknown): null | number | string => {
    if (v === null || v === undefined) return null;
    if (typeof v === "boolean") return v ? 1 : 0;
    if (typeof v === "number" || typeof v === "string") return v;
    return String(v);
  };

  try {
    db.prepare(`
      INSERT INTO profiles
        (id, is_admin, has_cdl, full_name, phone, cdl_state, experience,
         endorsement_type, driver_type, preferred_route, preferred_equipment,
         home_time_preference, min_pay_expectation)
      VALUES (?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      toSqlite(body.has_cdl !== false ? 1 : 0),
      toSqlite(body.full_name ?? null),
      toSqlite(body.phone ?? null),
      toSqlite(body.cdl_state ?? null),
      toSqlite(body.experience ?? null),
      toSqlite(body.endorsement_type ?? null),
      toSqlite(body.driver_type ?? "company_driver"),
      toSqlite(body.preferred_route ?? null),
      toSqlite(body.preferred_equipment ?? null),
      toSqlite(body.home_time_preference ?? null),
      toSqlite(body.min_pay_expectation ?? null),
    );
  } catch (e: any) {
    // Profile insert failed — still return success since user account was created
    console.error("[register] Profile insert failed:", e?.message);
  }

  const token = signToken({ sub: id, email: body.email, is_admin: false });
  const user = { id, email: body.email, created_at: new Date().toISOString(), is_admin: false };
  return c.json({ token, user });
});

app.post("/api/auth/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.email || !body?.password) return c.json({ message: "email and password required" }, 400);

  const row = db.prepare("SELECT u.*, p.is_admin FROM users u LEFT JOIN profiles p ON p.id = u.id WHERE u.email = ?").get(body.email.toLowerCase()) as any;
  if (!row) return c.json({ message: "Invalid email or password" }, 401);

  const valid = await bcrypt.compare(body.password, row.password_hash);
  if (!valid) return c.json({ message: "Invalid email or password" }, 401);

  const token = signToken({ sub: row.id, email: row.email, is_admin: !!row.is_admin });
  const user = { id: row.id, email: row.email, created_at: row.created_at, is_admin: !!row.is_admin };
  return c.json({ token, user });
});

app.get("/api/auth/me", (c) => {
  const denied = requireAuth(c); if (denied) return denied;
  const u = (c as any).user;
  const row = db.prepare("SELECT u.id, u.email, u.created_at FROM users u WHERE u.id = ?").get(u.sub) as any;
  if (!row) return c.json({ message: "Not found" }, 404);
  return c.json(row);
});

// ────────────────────────────────────────────────────────────────────────
// RPC: AI content generation
// ────────────────────────────────────────────────────────────────────────
app.post("/api/rpc/generate-content", async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;

  const { campaign, count = 3 } = await c.req.json().catch(() => ({}));
  if (!campaign) return c.json({ message: "campaign required" }, 400);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return c.json({ message: "ANTHROPIC_API_KEY not set in .env" }, 500);

  const jobType = campaign.job_type ?? "CDL Class A";
  const benefits = (campaign.benefits ?? []).join(", ") || "competitive pay, great benefits";
  const cta = campaign.cta ?? "Comment INTERESTED or DM to apply";
  const locations = (campaign.locations ?? []).slice(0, 5).join(", ") || "nationwide";

  const systemPrompt = `You are a copywriter for TruckDriverJobs.co. Write direct, credible Facebook posts that attract CDL drivers. No corporate fluff. Max 3 hashtags per post.`;
  const userPrompt = `Generate ${count} Facebook posts recruiting ${jobType} drivers.\nLocations: ${locations}\nBenefits: ${benefits}\nCTA: ${cta}\n${campaign.description ? `Details: ${campaign.description}` : ""}\n\nWrite ${count} distinct variants. Separate them with ---POST---\nEach post: 150-300 words. Different angles: pay/lifestyle, urgency, pain-point, Q&A style, social proof.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-opus-4-5", max_tokens: 4096, system: systemPrompt, messages: [{ role: "user", content: userPrompt }] }),
  });

  const json = await res.json() as any;
  if (!res.ok) return c.json({ message: json.error?.message ?? "Anthropic error" }, 500);

  const rawText = json.content?.[0]?.text ?? "";
  const posts = rawText.includes("---POST---")
    ? rawText.split("---POST---").map((s: string) => s.trim()).filter((s: string) => s.length > 50).slice(0, count)
    : [rawText.trim()];

  return c.json({ posts, raw: rawText });
});

// ────────────────────────────────────────────────────────────────────────
// GENERIC REST HANDLER
// ────────────────────────────────────────────────────────────────────────

const PUBLIC_TABLES = new Set(["jobs", "blog_posts", "recruitment_groups"]);
const ALLOWED_TABLES = new Set([
  "jobs", "profiles", "saved_jobs", "applications",
  "campaigns", "content_templates", "recruitment_groups",
  "queued_posts", "published_posts", "blog_posts", "analytics_events",
]);

// Parse PostgREST-style select: "*, campaigns(name), recruitment_groups(name, url)"
function parseSelectParam(selectStr: string, mainTable: string): {
  mainCols: string; // e.g. "qp.*"
  joins: Array<{ alias: string; table: string; fkCol: string; cols: string[] }>;
} {
  if (!selectStr || selectStr === "*") return { mainCols: `${mainTable}.*`, joins: [] };

  const parts: string[] = [];
  const joins: Array<{ alias: string; table: string; fkCol: string; cols: string[] }> = [];
  let depth = 0;
  let current = "";
  for (const ch of selectStr) {
    if (ch === "(" ) depth++;
    if (ch === ")" ) depth--;
    if (ch === "," && depth === 0) { parts.push(current.trim()); current = ""; }
    else current += ch;
  }
  if (current.trim()) parts.push(current.trim());

  const mainColParts: string[] = [];
  const fkMap = FK_MAP[mainTable] ?? {};

  for (const part of parts) {
    const joinMatch = part.match(/^(\w+)\((.+)\)$/);
    if (joinMatch) {
      const alias = joinMatch[1];  // e.g. "campaigns"
      const colsStr = joinMatch[2]; // e.g. "name, url"
      const cols = colsStr.split(",").map((s) => s.trim());
      // Find FK column
      const fkCol = Object.entries(fkMap).find(([, refTable]) => refTable === alias)?.[0] ?? `${alias}_id`;
      joins.push({ alias, table: alias, fkCol, cols });
    } else if (part === "*") {
      mainColParts.push(`${mainTable}.*`);
    } else {
      mainColParts.push(`${mainTable}.${part}`);
    }
  }

  return {
    mainCols: mainColParts.length ? mainColParts.join(", ") : `${mainTable}.*`,
    joins,
  };
}

function buildSelect(table: string, query: Record<string, string | string[]>): { sql: string; cols: string[] } {
  const selectParam = typeof query.select === "string" ? query.select : "*";
  const { mainCols, joins } = parseSelectParam(selectParam, table);

  let selectCols = mainCols;
  const joinClauses: string[] = [];

  for (const j of joins) {
    const jCols = j.cols.map((col) => `${j.table}.${col} AS "__join_${j.alias}_${col}"`).join(", ");
    if (jCols) selectCols += `, ${jCols}`;
    joinClauses.push(`LEFT JOIN ${j.table} ON ${j.table}.id = ${table}.${j.fkCol}`);
  }

  let sql = `SELECT ${selectCols} FROM ${table}`;
  if (joinClauses.length) sql += " " + joinClauses.join(" ");

  return { sql, cols: joins.map((j) => j.alias) };
}

function buildWhere(table: string, query: Record<string, string | string[]>): { clause: string; params: any[] } {
  const skip = new Set(["select", "order", "limit", "offset", "count", "head"]);
  const conditions: string[] = [];
  const params: any[] = [];

  for (const [key, rawVal] of Object.entries(query)) {
    if (skip.has(key)) continue;
    const val = Array.isArray(rawVal) ? rawVal[0] : rawVal;
    if (typeof val !== "string") continue;
    if (val.startsWith("eq.")) { conditions.push(`${table}.${key} = ?`); params.push(val.slice(3)); }
    else if (val.startsWith("neq.")) { conditions.push(`${table}.${key} != ?`); params.push(val.slice(4)); }
    else if (val.startsWith("is.")) {
      const v = val.slice(3);
      conditions.push(`${table}.${key} IS ${v === "null" ? "NULL" : "NOT NULL"}`);
    }
    else if (val.startsWith("in.(")) {
      const items = val.slice(4, -1).split(",").map((s) => s.trim());
      conditions.push(`${table}.${key} IN (${items.map(() => "?").join(",")})`);
      params.push(...items);
    }
    else if (val.startsWith("gte.")) { conditions.push(`${table}.${key} >= ?`); params.push(val.slice(4)); }
    else if (val.startsWith("lte.")) { conditions.push(`${table}.${key} <= ?`); params.push(val.slice(4)); }
    else if (val.startsWith("like.")) { conditions.push(`${table}.${key} LIKE ?`); params.push(val.slice(5)); }
  }

  return { clause: conditions.length ? " WHERE " + conditions.join(" AND ") : "", params };
}

function buildOrder(table: string, query: Record<string, string | string[]>): string {
  const orderParam = query.order;
  if (!orderParam) return "";
  const orders = Array.isArray(orderParam) ? orderParam : [orderParam];
  const clauses = orders.map((o) => {
    const [col, dir] = o.split(".");
    return `${table}.${col} ${dir === "desc" ? "DESC" : "ASC"}`;
  });
  return " ORDER BY " + clauses.join(", ");
}

// Reconstruct nested join objects from flat "__join_alias_col" columns
function nestJoinCols(row: Record<string, any>, joinAliases: string[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    const joinMatch = k.match(/^__join_(\w+)_(.+)$/);
    if (joinMatch) {
      const alias = joinMatch[1];
      const col = joinMatch[2];
      if (!out[alias]) out[alias] = {};
      out[alias][col] = v;
    } else {
      out[k] = v;
    }
  }
  return out;
}

// Health check — must be before generic /api/:table handlers
app.get("/api/health", (c) => c.json({ ok: true, db: "sqlite", version: "1.0.0" }));

/** POST /api/track — public, unauthenticated site-wide analytics event capture (pageviews, clicks, etc.) */
app.post("/api/track", async (c) => {
  const body = await c.req.json().catch(() => ({} as any));
  const {
    event_type = "pageview",
    session_id = null,
    path = null,
    referrer = null,
    utm_source = null,
    utm_medium = null,
    utm_campaign = null,
    metadata = {},
  } = body || {};

  if (!event_type) return c.json({ message: "event_type required" }, 400);

  let referrer_domain: string | null = null;
  if (referrer) {
    try { referrer_domain = new URL(referrer).hostname.replace(/^www\./, ""); } catch { /* not a valid URL, ignore */ }
  }

  const user_agent = c.req.header("user-agent") ?? null;

  db.prepare(
    `INSERT INTO analytics_events (event_type, session_id, path, referrer, referrer_domain, utm_source, utm_medium, utm_campaign, user_agent, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    event_type, session_id, path, referrer, referrer_domain,
    utm_source, utm_medium, utm_campaign, user_agent, JSON.stringify(metadata ?? {})
  );

  return c.json({ ok: true });
});

/** GET /api/admin/analytics/site — admin-only aggregated site analytics (visitors, top pages, referrers, UTM sources) */
app.get("/api/admin/analytics/site", (c) => {
  const denied = requireAdmin(c); if (denied) return denied;

  const daysParam = parseInt(c.req.query("days") ?? "30", 10);
  const days = Number.isFinite(daysParam) && daysParam > 0 ? daysParam : 30;
  const since = `datetime('now', '-${days} days')`;

  const totals = db.prepare(
    `SELECT
       COUNT(*) as pageviews,
       COUNT(DISTINCT session_id) as visitors
     FROM analytics_events
     WHERE event_type = 'pageview' AND created_at >= ${since}`
  ).get() as { pageviews: number; visitors: number };

  const byDay = db.prepare(
    `SELECT date(created_at) as day,
            COUNT(*) as pageviews,
            COUNT(DISTINCT session_id) as visitors
     FROM analytics_events
     WHERE event_type = 'pageview' AND created_at >= ${since}
     GROUP BY day ORDER BY day ASC`
  ).all();

  const topPages = db.prepare(
    `SELECT path, COUNT(*) as views, COUNT(DISTINCT session_id) as visitors
     FROM analytics_events
     WHERE event_type = 'pageview' AND created_at >= ${since} AND path IS NOT NULL
     GROUP BY path ORDER BY views DESC LIMIT 15`
  ).all();

  const topReferrers = db.prepare(
    `SELECT referrer_domain, COUNT(*) as visits
     FROM analytics_events
     WHERE event_type = 'pageview' AND created_at >= ${since}
       AND referrer_domain IS NOT NULL AND referrer_domain != ''
     GROUP BY referrer_domain ORDER BY visits DESC LIMIT 15`
  ).all();

  const directCount = db.prepare(
    `SELECT COUNT(*) as c FROM analytics_events
     WHERE event_type = 'pageview' AND created_at >= ${since}
       AND (referrer IS NULL OR referrer = '')`
  ).get() as { c: number };

  const utmSources = db.prepare(
    `SELECT utm_source, COUNT(*) as visits
     FROM analytics_events
     WHERE event_type = 'pageview' AND created_at >= ${since}
       AND utm_source IS NOT NULL AND utm_source != ''
     GROUP BY utm_source ORDER BY visits DESC LIMIT 10`
  ).all();

  return c.json({
    days,
    pageviews: totals.pageviews ?? 0,
    visitors: totals.visitors ?? 0,
    directVisits: directCount.c ?? 0,
    byDay,
    topPages,
    topReferrers,
    utmSources,
  });
});

/** POST /api/quick-apply — Quick Apply from job detail page, saves application + notifies admin */
app.post("/api/quick-apply", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { fullName, email, phone, hasCdl, experience, jobId, jobTitle, jobCompany } = body as any;

  if (!fullName || !phone) return c.json({ message: "Name and phone required" }, 400);

  const now = new Date().toISOString();

  // Save to applications table
  try {
    db.prepare(`
      INSERT INTO applications (job_id, status, applicant_name, applicant_email, applicant_phone, consent_given, created_at, updated_at)
      VALUES (?, 'submitted', ?, ?, ?, 1, ?, ?)
    `).run(jobId ?? null, fullName, email ?? null, phone, now, now);
  } catch (e) {
    console.error("[QuickApply] DB insert failed:", e);
  }

  // Fire admin notification in background
  sendQuickApplyAlert({
    applicantName: fullName,
    applicantEmail: email ?? "",
    applicantPhone: phone,
    experience: experience ?? "Unknown",
    hasCdl: hasCdl ?? true,
    jobTitle: jobTitle ?? "CDL Driver",
    jobCompany: jobCompany ?? "Unknown",
    jobId: jobId ?? 0,
  }).catch(console.error);

  return c.json({ ok: true });
});

/** POST /api/match — score jobs against driver profile, save lead, return matches with AI reasons */
app.post("/api/match", async (c) => {
  const profile = await c.req.json().catch(() => ({}));

  // Fetch all active jobs (randomised so varied if DB is large)
  const rows = (db.prepare(
    "SELECT * FROM jobs WHERE status = 'active' ORDER BY RANDOM() LIMIT 300"
  ).all()) as any[];

  // Score + filter
  let scored = rows
    .map((row) => ({ job: parseRow("jobs", row), score: scoreJob(row, profile) }))
    .filter((m) => m.score >= 35)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  // Fallback: if very few results, lower threshold
  if (scored.length < 5) {
    scored = rows
      .map((row) => ({ job: parseRow("jobs", row), score: scoreJob(row, profile) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  // Generate AI match reasons
  const reasons = await generateMatchReasons(scored, profile);

  // Save lead to DB
  let leadId: number | null = null;
  try {
    const result = db.prepare(`
      INSERT INTO leads
        (full_name, email, phone, cdl_class, experience, endorsements,
         route_type, equipment, home_time, min_pay, states, matched_job_ids)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      profile.fullName ?? "",
      profile.email ?? "",
      profile.phone ?? "",
      profile.cdlClass ?? "A",
      profile.experience ?? "",
      JSON.stringify(profile.endorsements ?? []),
      profile.routeType ?? null,
      profile.equipment ?? null,
      profile.homeTime ?? null,
      profile.minPay ?? null,
      JSON.stringify(profile.states ?? []),
      JSON.stringify(scored.map((m) => m.job.id))
    );
    leadId = result.lastInsertRowid as number;
  } catch (e) {
    console.error("Failed to save lead:", e);
  }

  return c.json({
    matches: scored.map((m, i) => ({
      job: m.job,
      score: m.score,
      reason: reasons[i] ?? "",
    })),
    leadId,
  });
});

/** PATCH /api/leads/:id/apply — record which jobs the driver applied to + fire emails */
app.patch("/api/leads/:id/apply", async (c) => {
  const id = Number(c.req.param("id"));
  const { jobIds } = await c.req.json().catch(() => ({ jobIds: [] }));
  if (!id) return c.json({ message: "Invalid lead id" }, 400);

  // Fetch lead for email context
  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(id) as any;

  db.prepare(
    `UPDATE leads SET applied_job_ids = ?, applied_at = ?, status = 'applied' WHERE id = ?`
  ).run(JSON.stringify(jobIds ?? []), new Date().toISOString(), id);

  // Fire emails in background (don't block the response)
  if (lead) {
    const appliedJobs = (jobIds as number[]).map((jid) =>
      db.prepare("SELECT * FROM jobs WHERE id = ?").get(jid) as any
    ).filter(Boolean);

    const states = (() => { try { return JSON.parse(lead.states ?? "[]"); } catch { return []; } })();

    // Admin alert
    sendAdminLeadAlert({
      driverName: lead.full_name ?? "Unknown",
      driverEmail: lead.email ?? "",
      driverPhone: lead.phone ?? "",
      cdlClass: lead.cdl_class ?? "A",
      experience: lead.experience ?? "",
      routeType: lead.route_type ?? undefined,
      equipment: lead.equipment ?? undefined,
      homeTime: lead.home_time ?? undefined,
      states,
      matchedJobs: appliedJobs,
      leadId: id,
    }).catch(console.error);

    // Driver confirmation
    if (lead.email) {
      sendDriverConfirmation({
        driverName: lead.full_name ?? "Driver",
        driverEmail: lead.email,
        driverPhone: lead.phone ?? "",
        matchedJobs: appliedJobs,
      }).catch(console.error);
    }
  }

  return c.json({ ok: true });
});

// GET /api/:table
app.get("/api/:table", (c) => {
  const table = c.req.param("table");
  if (!ALLOWED_TABLES.has(table)) return c.json({ message: "Not found" }, 404);

  if (!PUBLIC_TABLES.has(table)) {
    const denied = requireAuth(c); if (denied) return denied;
  }

  const query = c.req.query() as Record<string, string>;

  // Count-only request
  if (query.head === "true" || query.count === "exact") {
    const { clause, params } = buildWhere(table, query);
    const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}${clause}`).get(...params) as any;
    return c.json({ count: row.count });
  }

  const { sql: selectSql, cols: joinAliases } = buildSelect(table, query);
  const { clause, params } = buildWhere(table, query);
  const order = buildOrder(table, query);
  const limitParam = query.limit ? ` LIMIT ${parseInt(query.limit)}` : "";
  const offsetParam = query.offset ? ` OFFSET ${parseInt(query.offset)}` : "";

  const fullSql = selectSql + clause + order + limitParam + offsetParam;
  let rows = db.prepare(fullSql).all(...params) as Record<string, any>[];

  rows = rows.map((row) => parseRow(table, nestJoinCols(row, joinAliases)));

  return c.json(rows);
});

// POST /api/:table
app.post("/api/:table", async (c) => {
  const table = c.req.param("table");
  if (!ALLOWED_TABLES.has(table)) return c.json({ message: "Not found" }, 404);
  const denied = requireAuth(c); if (denied) return denied;

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ message: "Invalid JSON" }, 400);

  const rows = Array.isArray(body) ? body : [body];
  const inserted: any[] = [];

  for (const raw of rows) {
    const row = stringifyRow(table, raw);
    // Remove undefined / null id for autoincrement tables
    if ("id" in row && row.id === undefined) delete row.id;
    const cols = Object.keys(row);
    if (!cols.length) return c.json({ message: "Empty body" }, 400);
    const placeholders = cols.map(() => "?").join(", ");
    const stmt = db.prepare(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`);
    const info = stmt.run(...cols.map((col) => row[col]));
    const newId = info.lastInsertRowid;
    const created = db.prepare(`SELECT * FROM ${table} WHERE rowid = ?`).get(newId) as any;
    inserted.push(parseRow(table, created));
  }

  return c.json(inserted, 201);
});

// PATCH /api/:table
app.patch("/api/:table", async (c) => {
  const table = c.req.param("table");
  if (!ALLOWED_TABLES.has(table)) return c.json({ message: "Not found" }, 404);
  const denied = requireAuth(c); if (denied) return denied;

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ message: "Invalid JSON" }, 400);

  const query = c.req.query() as Record<string, string>;
  const row = stringifyRow(table, body);
  // Add updated_at if column exists
  if (["jobs", "campaigns", "blog_posts"].includes(table)) row.updated_at = new Date().toISOString();

  const setCols = Object.keys(row);
  if (!setCols.length) return c.json({ message: "Empty body" }, 400);

  const setClause = setCols.map((c) => `${c} = ?`).join(", ");
  const { clause, params } = buildWhere(table, query);
  if (!clause) return c.json({ message: "No filter provided — refusing blind update" }, 400);

  db.prepare(`UPDATE ${table} SET ${setClause}${clause}`).run(...setCols.map((col) => row[col]), ...params);

  const updated = db.prepare(`SELECT * FROM ${table}${clause}`).all(...params) as any[];
  return c.json(updated.map((r) => parseRow(table, r)));
});

// DELETE /api/:table
app.delete("/api/:table", (c) => {
  const table = c.req.param("table");
  if (!ALLOWED_TABLES.has(table)) return c.json({ message: "Not found" }, 404);
  const denied = requireAdmin(c); if (denied) return denied;

  const query = c.req.query() as Record<string, string>;
  const { clause, params } = buildWhere(table, query);
  if (!clause) return c.json({ message: "No filter — refusing blind delete" }, 400);

  db.prepare(`DELETE FROM ${table}${clause}`).run(...params);
  return c.json({ ok: true });
});

// ────────────────────────────────────────────────────────────────────────
// SCRAPER ENDPOINTS (admin only)
// ────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────
// ADZUNA API
// ────────────────────────────────────────────────────────────────────────

/** POST /api/admin/scrape/adzuna — fetch CDL jobs from Adzuna, optionally import */
app.post("/api/admin/scrape/adzuna", async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;

  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    return c.json({ message: "ADZUNA_APP_ID and ADZUNA_APP_KEY not set in .env" }, 500);
  }

  const { import: doImport = false } = await c.req.json().catch(() => ({}));

  try {
    const jobs = await fetchAdzunaJobs(appId, appKey);

    if (!doImport) {
      return c.json({ jobs, count: jobs.length });
    }

    let inserted = 0, updated = 0;
    const now = new Date().toISOString();

    for (const job of jobs) {
      const existing = db.prepare(
        "SELECT id FROM jobs WHERE title = ? AND company = ? LIMIT 1"
      ).get(job.title, job.company) as any;

      const row = {
        title: job.title,
        company: job.company,
        location: job.location,
        city: job.city ?? null,
        state: job.state ?? null,
        route_type: job.route_type ?? null,
        equipment: job.equipment ?? "Dry Van",
        home_time: job.home_time ?? null,
        description: job.description ?? null,
        pay_rate: job.pay_rate ?? null,
        pay_period: job.pay_period ?? null,
        benefits: "[]",
        requirements: "[]",
        source_url: job.source_url,
        source_carrier: job.source_carrier,
        external_apply_url: job.external_apply_url ?? null,
        is_aggregated: 1,
        scraped_at: now,
        status: "active",
      };

      if (existing) {
        db.prepare(
          `UPDATE jobs SET route_type=?, equipment=?, home_time=?, description=?,
           pay_rate=?, pay_period=?, source_url=?, scraped_at=?, updated_at=? WHERE id=?`
        ).run(
          row.route_type, row.equipment, row.home_time, row.description,
          row.pay_rate, row.pay_period, row.source_url, now, now, existing.id
        );
        updated++;
      } else {
        const cols = Object.keys(row);
        db.prepare(
          `INSERT INTO jobs (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`
        ).run(...cols.map((k) => (row as any)[k]));
        inserted++;
      }
    }

    return c.json({ ok: true, total: jobs.length, inserted, updated });
  } catch (e: any) {
    return c.json({ message: e?.message ?? "Adzuna fetch failed" }, 500);
  }
});

/** POST /api/admin/scrape/indeed — fetch CDL jobs from Indeed RSS (free, no key) */
app.post("/api/admin/scrape/indeed", async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const { import: doImport = false } = await c.req.json().catch(() => ({}));
  try {
    const jobs = await fetchIndeedJobs();
    if (!doImport) return c.json({ jobs, count: jobs.length });
    const { inserted, updated } = upsertJobs(jobs);
    return c.json({ ok: true, total: jobs.length, inserted, updated });
  } catch (e: any) {
    return c.json({ message: e?.message ?? "Indeed RSS fetch failed" }, 500);
  }
});

/** POST /api/admin/scrape/jsearch — fetch CDL jobs from JSearch (aggregates Indeed, LinkedIn, ZipRecruiter) */
app.post("/api/admin/scrape/jsearch", async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return c.json({ message: "RAPIDAPI_KEY not set in environment variables. Get a free key at rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch" }, 500);
  const { import: doImport = false } = await c.req.json().catch(() => ({}));
  try {
    const jobs = await fetchJSearchJobs(apiKey);
    if (!doImport) return c.json({ jobs, count: jobs.length });
    const { inserted, updated } = upsertJobs(jobs);
    return c.json({ ok: true, total: jobs.length, inserted, updated });
  } catch (e: any) {
    return c.json({ message: e?.message ?? "JSearch fetch failed" }, 500);
  }
});

/** POST /api/admin/scrape/jobicy — fetch CDL jobs from Jobicy (free, no key) */
app.post("/api/admin/scrape/jobicy", async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const { import: doImport = false } = await c.req.json().catch(() => ({}));
  try {
    const jobs = await fetchJobicyJobs();
    if (!doImport) return c.json({ jobs, count: jobs.length });
    const { inserted, updated } = upsertJobs(jobs);
    return c.json({ ok: true, total: jobs.length, inserted, updated });
  } catch (e: any) {
    return c.json({ message: e?.message ?? "Jobicy fetch failed" }, 500);
  }
});

/** POST /api/admin/scrape/usajobs — fetch federal CDL/driving jobs from USAJOBS */
app.post("/api/admin/scrape/usajobs", async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;

  const apiKey = process.env.USAJOBS_API_KEY;
  const userAgent = process.env.USAJOBS_USER_AGENT;
  if (!apiKey || !userAgent) {
    return c.json({ message: "USAJOBS_API_KEY and USAJOBS_USER_AGENT not set in .env" }, 500);
  }

  const { import: doImport = false } = await c.req.json().catch(() => ({}));

  try {
    const jobs = await fetchUSAJobsJobs(apiKey, userAgent);

    if (!doImport) {
      return c.json({ jobs, count: jobs.length });
    }

    let inserted = 0, updated = 0;
    const now = new Date().toISOString();

    for (const job of jobs) {
      const existing = db.prepare(
        "SELECT id FROM jobs WHERE title = ? AND company = ? LIMIT 1"
      ).get(job.title, job.company) as any;

      const row = {
        title: job.title,
        company: job.company,
        location: job.location,
        city: job.city ?? null,
        state: job.state ?? null,
        route_type: job.route_type ?? null,
        equipment: job.equipment ?? "Dry Van",
        home_time: null,
        description: job.description ?? null,
        pay_rate: job.pay_rate ?? null,
        pay_period: job.pay_period ?? null,
        benefits: "[]",
        requirements: "[]",
        source_url: job.source_url,
        source_carrier: job.source_carrier,
        external_apply_url: job.external_apply_url ?? null,
        is_aggregated: 1,
        scraped_at: now,
        status: "active",
      };

      if (existing) {
        db.prepare(
          `UPDATE jobs SET route_type=?, equipment=?, description=?,
           pay_rate=?, pay_period=?, source_url=?, scraped_at=?, updated_at=? WHERE id=?`
        ).run(
          row.route_type, row.equipment, row.description,
          row.pay_rate, row.pay_period, row.source_url, now, now, existing.id
        );
        updated++;
      } else {
        const cols = Object.keys(row);
        db.prepare(
          `INSERT INTO jobs (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`
        ).run(...cols.map((k) => (row as any)[k]));
        inserted++;
      }
    }

    return c.json({ ok: true, total: jobs.length, inserted, updated });
  } catch (e: any) {
    return c.json({ message: e?.message ?? "USAJOBS fetch failed" }, 500);
  }
});

/** GET /api/admin/scrape/debug — raw single-query test for Adzuna, JSearch, Careerjet (no auth — dev only) */
app.get("/api/admin/scrape/debug", async (c) => {

  const results: Record<string, unknown> = {};

  // Adzuna
  try {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (appId && appKey) {
      const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=3&what=CDL+truck+driver&content-type=application/json`;
      const r = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      const raw = await r.json();
      results.adzuna = { status: r.status, count: raw?.results?.length ?? 0, total: raw?.count, first: raw?.results?.[0]?.title ?? null, error: raw?.error ?? null };
    } else {
      results.adzuna = { error: "keys missing", ADZUNA_APP_ID: appId, ADZUNA_APP_KEY: appKey };
    }
  } catch (e: any) { results.adzuna = { error: e.message }; }

  // Jobicy (free, no key)
  try {
    const r = await fetch("https://jobicy.com/api/v2/remote-jobs?count=3&tag=truck+driver&geo=usa", {
      headers: { Accept: "application/json", "User-Agent": "TruckDriverJobs.co/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    const raw = await r.json();
    results.jobicy = { status: r.status, count: raw?.jobs?.length ?? 0, first: raw?.jobs?.[0]?.jobTitle ?? null };
  } catch (e: any) { results.jobicy = { error: e.message }; }

  // Careerjet
  try {
    const affId = process.env.CAREERJET_AFFID;
    if (affId) {
      const url = `http://public.api.careerjet.net/search?keywords=CDL+truck+driver&location=USA&affid=${affId}&user_ip=8.8.8.8&url=https://truckdriverjobs.co&user_agent=Mozilla/5.0&locale_code=en_US&pagesize=3`;
      const r = await fetch(url, { headers: { Referer: "https://truckdriverjobs.co/jobs" }, signal: AbortSignal.timeout(10_000) });
      const raw = await r.json();
      results.careerjet = { status: r.status, type: raw?.type, hits: raw?.hits, count: raw?.jobs?.length ?? 0, first: raw?.jobs?.[0]?.title ?? null, error: raw?.error ?? null };
    } else {
      results.careerjet = { error: "CAREERJET_AFFID missing" };
    }
  } catch (e: any) { results.careerjet = { error: e.message }; }

  return c.json(results);
});

/** POST /api/admin/scrape/careerjet — fetch CDL jobs from Careerjet, optionally import */
app.post("/api/admin/scrape/careerjet", async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;

  const affId = process.env.CAREERJET_AFFID;
  if (!affId) {
    return c.json({ message: "CAREERJET_AFFID not set in .env" }, 500);
  }

  const { import: doImport = false } = await c.req.json().catch(() => ({}));

  try {
    const jobs = await fetchCareerjetJobs(affId);
    if (!doImport) return c.json({ jobs, count: jobs.length });
    const { inserted, updated } = upsertJobs(jobs);
    return c.json({ ok: true, total: jobs.length, inserted, updated });
  } catch (e: any) {
    return c.json({ message: e?.message ?? "Careerjet fetch failed" }, 500);
  }
});

/** List all configured carriers + their last scrape stats */
app.get("/api/admin/scrapers", (c) => {
  const denied = requireAdmin(c); if (denied) return denied;

  const carriers = CARRIERS.map((carrier) => {
    const row = db.prepare(
      `SELECT COUNT(*) as count, MAX(scraped_at) as last_scraped
       FROM jobs WHERE source_carrier = ? AND is_aggregated = 1`
    ).get(carrier.name) as any;
    return {
      name: carrier.name,
      url: carrier.url,
      strategy: carrier.strategy,
      defaultEquipment: carrier.defaultEquipment,
      jobCount: row?.count ?? 0,
      lastScraped: row?.last_scraped ?? null,
    };
  });

  return c.json(carriers);
});

/** Scrape one or all carriers, return preview (does NOT import yet) */
app.post("/api/admin/scrape/preview", async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const { carrier: carrierName } = await c.req.json().catch(() => ({}));

  const targets = carrierName
    ? CARRIERS.filter((cc) => cc.name === carrierName)
    : CARRIERS;

  if (!targets.length) return c.json({ message: "Carrier not found" }, 404);

  // Run scrapes in parallel (cap at 5 concurrent)
  const results = await Promise.all(targets.map((cc) => scrapeCarrier(cc)));
  return c.json(results);
});

/** Import scraped jobs into the database */
app.post("/api/admin/scrape/import", async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const { jobs: incomingJobs } = await c.req.json().catch(() => ({ jobs: [] }));

  if (!Array.isArray(incomingJobs) || !incomingJobs.length) {
    return c.json({ message: "No jobs provided" }, 400);
  }

  let inserted = 0;
  let updated = 0;
  const now = new Date().toISOString();

  for (const job of incomingJobs) {
    // Check for existing job (same title + company + location)
    const existing = db.prepare(
      `SELECT id FROM jobs WHERE title = ? AND company = ? AND location = ? LIMIT 1`
    ).get(job.title, job.company, job.location) as any;

    const row = {
      title: job.title ?? "",
      company: job.company ?? "",
      location: job.location ?? "",
      city: job.city ?? null,
      state: job.state ?? null,
      route_type: job.route_type ?? null,
      equipment: job.equipment ?? "Dry Van",
      experience_required: job.experience_required ?? null,
      pay_rate: job.pay_rate ?? null,
      pay_period: job.pay_period ?? null,
      home_time: job.home_time ?? null,
      description: job.description ?? null,
      benefits: JSON.stringify(job.benefits ?? []),
      requirements: JSON.stringify(job.requirements ?? []),
      source_url: job.source_url ?? null,
      source_carrier: job.source_carrier ?? null,
      external_apply_url: job.external_apply_url ?? null,
      is_aggregated: 1,
      scraped_at: now,
      status: "active",
    };

    if (existing) {
      // Update existing
      db.prepare(`
        UPDATE jobs SET
          route_type=?, equipment=?, pay_rate=?, pay_period=?, description=?,
          benefits=?, requirements=?, source_url=?, external_apply_url=?,
          scraped_at=?, updated_at=?
        WHERE id=?
      `).run(
        row.route_type, row.equipment, row.pay_rate, row.pay_period,
        row.description, row.benefits, row.requirements,
        row.source_url, row.external_apply_url, row.scraped_at, now,
        existing.id
      );
      updated++;
    } else {
      // Insert new
      const cols = Object.keys(row);
      db.prepare(
        `INSERT INTO jobs (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`
      ).run(...cols.map((k) => (row as any)[k]));
      inserted++;
    }
  }

  return c.json({ ok: true, inserted, updated, total: inserted + updated });
});

/** DELETE /api/admin/jobs/all — wipe every job row (admin only) */
app.delete("/api/admin/jobs/all", (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const info = db.prepare("DELETE FROM jobs").run();
  return c.json({ ok: true, deleted: info.changes });
});

/** Delete all aggregated jobs for a specific carrier */
app.delete("/api/admin/scrape/carrier", async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const { carrier } = await c.req.json().catch(() => ({}));
  if (!carrier) return c.json({ message: "carrier required" }, 400);
  const info = db.prepare(`DELETE FROM jobs WHERE source_carrier = ? AND is_aggregated = 1`).run(carrier);
  return c.json({ ok: true, deleted: info.changes });
});

// ────────────────────────────────────────────────────────────────────────
// AI MATCHING (public — no auth required)
// ────────────────────────────────────────────────────────────────────────

function scoreJob(job: any, profile: any): number {
  let pts = 0;

  // Equipment match (30 pts)
  if (!profile.equipment) {
    pts += 18;
  } else {
    const eq = (profile.equipment ?? "").toLowerCase();
    const jobEq = (job.equipment ?? "").toLowerCase();
    if (jobEq === eq) pts += 30;
    else if (jobEq.split(" ")[0] === eq.split(" ")[0]) pts += 18;
    else pts += 5;
  }

  // Route type match (25 pts)
  if (!profile.routeType) {
    pts += 12;
  } else {
    const rt = (profile.routeType ?? "").toLowerCase();
    const jobRt = (job.route_type ?? "").toLowerCase();
    if (jobRt === rt) pts += 25;
    else pts += 3;
  }

  // State match (25 pts)
  if (!profile.states?.length) {
    pts += 15; // open to anywhere
  } else if (job.state && profile.states.includes(job.state)) {
    pts += 25;
  } else {
    pts += 0;
  }

  // Pay match (10 pts)
  if (!profile.minPay) {
    pts += 6;
  } else {
    const jobPayStr = (job.pay_rate ?? "").replace(/[^\d.]/g, "");
    const jobPay = parseFloat(jobPayStr);
    const minPay = parseFloat(String(profile.minPay));
    if (!isNaN(jobPay) && !isNaN(minPay)) {
      if (jobPay >= minPay) pts += 10;
      else if (jobPay >= minPay * 0.9) pts += 5;
    } else {
      pts += 6; // unknown = neutral
    }
  }

  // Base points (10 pts — every job in pool gets this)
  pts += 10;

  return Math.min(pts, 100);
}

function templateReason(job: any, profile: any): string {
  const parts: string[] = [];
  const eq = (job.equipment ?? "").toLowerCase();
  const rt = (job.route_type ?? "").toLowerCase();
  const profileEq = (profile.equipment ?? "").toLowerCase();
  const profileRt = (profile.routeType ?? "").toLowerCase();

  if (profileEq && eq.includes(profileEq)) parts.push(`${job.equipment} matches your equipment`);
  if (profileRt && rt.includes(profileRt)) parts.push(`${job.route_type} route fits your preference`);
  if (profile.states?.length && job.state && profile.states.includes(job.state))
    parts.push(`located in ${job.state}, one of your target states`);
  if (job.pay_rate) parts.push(`pays ${job.pay_rate}`);
  if (job.home_time) parts.push(`${job.home_time} home time`);

  if (parts.length === 0) return `${job.company} is hiring ${job.route_type ?? "OTR"} drivers now`;
  return parts.slice(0, 2).join(" · ") + ".";
}

async function generateMatchReasons(matches: any[], profile: any): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  // Always generate template reasons — AI upgrades them when key is present
  const templates = matches.map((m: any) => templateReason(m.job, profile));
  if (!apiKey || apiKey === "sk-ant-...") return templates;

  const profileStr = [
    `CDL Class ${profile.cdlClass ?? "A"}`,
    profile.experience,
    profile.equipment ? `prefers ${profile.equipment}` : null,
    profile.routeType ? `wants ${profile.routeType} routes` : null,
    profile.homeTime ? `needs ${profile.homeTime.toLowerCase()}` : null,
    profile.minPay ? `minimum $${profile.minPay}/mile` : null,
    profile.states?.length ? `willing to work in ${profile.states.slice(0, 4).join(", ")}` : null,
  ].filter(Boolean).join(", ");

  const jobList = matches.slice(0, 12).map((m: any, i: number) =>
    `${i + 1}. ${m.job.title ?? m.job.title} at ${m.job.company} — ${m.job.location}${m.job.equipment ? `, ${m.job.equipment}` : ""}${m.job.route_type ? `, ${m.job.route_type}` : ""}${m.job.pay_rate ? `, ${m.job.pay_rate}` : ""}`
  ).join("\n");

  const prompt = `Driver profile: ${profileStr}\n\nJobs to explain:\n${jobList}\n\nWrite one short sentence (max 12 words) per job explaining why it matches this driver. Be specific to their profile. Output only the numbered sentences, nothing else.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const json = (await res.json()) as any;
    const text: string = json.content?.[0]?.text ?? "";
    return text
      .split("\n")
      .filter((l: string) => /^\d+\./.test(l.trim()))
      .map((l: string) => l.replace(/^\d+\.\s*/, "").trim());
  } catch {
    return templates;
  }
}

// ── Admin: User Management ───────────────────────────────────────────────────

/** GET /api/admin/users — list all registered users with their role */
app.get("/api/admin/users", (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const rows = db.prepare(`
    SELECT u.id, u.email, u.created_at,
           p.full_name, p.phone, p.is_admin, p.has_cdl,
           p.cdl_state, p.experience, p.driver_type,
           p.preferred_route, p.preferred_equipment
    FROM users u
    LEFT JOIN profiles p ON p.id = u.id
    ORDER BY u.created_at DESC
    LIMIT 500
  `).all() as any[];
  return c.json(rows.map((r) => ({
    ...r,
    is_admin: r.is_admin === 1 || r.is_admin === true,
    has_cdl: r.has_cdl === 1 || r.has_cdl === true,
  })));
});

/** POST /api/admin/users — create a user manually */
app.post("/api/admin/users", async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const body = await c.req.json().catch(() => null);
  if (!body?.email || !body?.password) return c.json({ message: "email and password required" }, 400);

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(body.email.toLowerCase().trim());
  if (existing) return c.json({ message: "Email already registered" }, 409);

  const id = randomUUID();
  const password_hash = await bcrypt.hash(body.password, 10);
  db.prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)").run(id, body.email.toLowerCase().trim(), password_hash);
  db.prepare(`
    INSERT INTO profiles (id, is_admin, has_cdl, full_name, phone, driver_type)
    VALUES (?, ?, 1, ?, ?, 'company_driver')
  `).run(id, body.is_admin ? 1 : 0, body.full_name ?? null, body.phone ?? null);

  return c.json({ ok: true, id, email: body.email.toLowerCase() });
});

/** PATCH /api/admin/users/:id/role — update a user's admin status */
app.patch("/api/admin/users/:id/role", (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const userId = c.req.param("id");
  const body = c.req.json() as any;
  return body.then((b: any) => {
    const isAdmin = b.is_admin ? 1 : 0;
    db.prepare("UPDATE profiles SET is_admin = ?, updated_at = datetime('now') WHERE id = ?").run(isAdmin, userId);
    return c.json({ ok: true });
  });
});

/** DELETE /api/admin/users/:id — delete a user account */
app.delete("/api/admin/users/:id", (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const userId = c.req.param("id");
  // Don't allow deleting yourself
  const token = extractToken(c);
  const payload = token ? verifyToken(token) : null;
  if (payload?.sub === userId) return c.json({ message: "Cannot delete your own account" }, 400);
  db.prepare("DELETE FROM users WHERE id = ?").run(userId);
  return c.json({ ok: true });
});

/** GET /api/admin/leads — list all leads (admin only) */
app.get("/api/admin/leads", (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const rows = (db.prepare(
    "SELECT * FROM leads ORDER BY created_at DESC LIMIT 500"
  ).all()) as any[];
  return c.json(
    rows.map((l) => ({
      ...l,
      endorsements: JSON.parse(l.endorsements ?? "[]"),
      states: JSON.parse(l.states ?? "[]"),
      matched_job_ids: JSON.parse(l.matched_job_ids ?? "[]"),
      applied_job_ids: JSON.parse(l.applied_job_ids ?? "[]"),
    }))
  );
});

/** PATCH /api/admin/leads/:id/status — update lead status (admin only) */
app.patch("/api/admin/leads/:id/status", async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const id = Number(c.req.param("id"));
  const { status } = await c.req.json().catch(() => ({}));
  if (!id || !status) return c.json({ message: "id and status required" }, 400);
  db.prepare("UPDATE leads SET status = ? WHERE id = ?").run(status, id);
  return c.json({ ok: true });
});


// ── Dynamic Sitemap ──────────────────────────────────────────────────────
app.get("/sitemap.xml", (c) => {
  const DOMAIN = "https://truckdriverjobs.co";
  const today = new Date().toISOString().split("T")[0];

  const staticPages = [
    { loc: `${DOMAIN}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${DOMAIN}/jobs`, priority: "0.9", changefreq: "hourly" },
    { loc: `${DOMAIN}/for-fleets`, priority: "0.8", changefreq: "monthly" },
    { loc: `${DOMAIN}/match`, priority: "0.8", changefreq: "monthly" },
    { loc: `${DOMAIN}/blog`, priority: "0.7", changefreq: "weekly" },
    { loc: `${DOMAIN}/privacy`, priority: "0.3", changefreq: "yearly" },
    // Programmatic SEO — equipment pages
    { loc: `${DOMAIN}/cdl-jobs/dry-van`,  priority: "0.85", changefreq: "daily" },
    { loc: `${DOMAIN}/cdl-jobs/flatbed`,  priority: "0.85", changefreq: "daily" },
    { loc: `${DOMAIN}/cdl-jobs/reefer`,   priority: "0.85", changefreq: "daily" },
    { loc: `${DOMAIN}/cdl-jobs/tanker`,   priority: "0.85", changefreq: "daily" },
    // Programmatic SEO — state pages
    { loc: `${DOMAIN}/cdl-jobs/texas`,          priority: "0.8", changefreq: "daily" },
    { loc: `${DOMAIN}/cdl-jobs/florida`,         priority: "0.8", changefreq: "daily" },
    { loc: `${DOMAIN}/cdl-jobs/georgia`,         priority: "0.8", changefreq: "daily" },
    { loc: `${DOMAIN}/cdl-jobs/illinois`,        priority: "0.8", changefreq: "daily" },
    { loc: `${DOMAIN}/cdl-jobs/pennsylvania`,    priority: "0.8", changefreq: "daily" },
    { loc: `${DOMAIN}/cdl-jobs/ohio`,            priority: "0.8", changefreq: "daily" },
    { loc: `${DOMAIN}/cdl-jobs/mississippi`,     priority: "0.8", changefreq: "daily" },
    { loc: `${DOMAIN}/cdl-jobs/indiana`,         priority: "0.8", changefreq: "daily" },
    { loc: `${DOMAIN}/cdl-jobs/north-carolina`,  priority: "0.8", changefreq: "daily" },
    { loc: `${DOMAIN}/cdl-jobs/alabama`,         priority: "0.8", changefreq: "daily" },
    { loc: `${DOMAIN}/cdl-jobs/virginia`,        priority: "0.8", changefreq: "daily" },
    { loc: `${DOMAIN}/cdl-jobs/california`,      priority: "0.8", changefreq: "daily" },
    { loc: `${DOMAIN}/cdl-jobs/tennessee`,       priority: "0.8", changefreq: "daily" },
    { loc: `${DOMAIN}/cdl-jobs/south-carolina`,  priority: "0.8", changefreq: "daily" },
    { loc: `${DOMAIN}/cdl-jobs/new-jersey`,      priority: "0.8", changefreq: "daily" },
    { loc: `${DOMAIN}/cdl-jobs/wisconsin`,       priority: "0.8", changefreq: "daily" },
    { loc: `${DOMAIN}/cdl-jobs/new-york`,        priority: "0.8", changefreq: "daily" },
    { loc: `${DOMAIN}/cdl-jobs/maryland`,        priority: "0.8", changefreq: "daily" },
    { loc: `${DOMAIN}/cdl-jobs/louisiana`,       priority: "0.8", changefreq: "daily" },
  ];

  const jobs = db.prepare(
    "SELECT id, title, company, updated_at, created_at FROM jobs WHERE status = 'active' ORDER BY created_at DESC LIMIT 5000"
  ).all() as { id: number; title: string; company: string; updated_at: string | null; created_at: string }[];

  const posts = db.prepare(
    "SELECT slug, updated_at, published_at FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC"
  ).all() as { slug: string; updated_at: string | null; published_at: string }[];

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // SQLite stores dates as "YYYY-MM-DD HH:MM:SS" (space) or ISO "YYYY-MM-DDT..." (T).
  // Split on either separator and validate to avoid Google Search Console "Invalid date" errors.
  const toSitemapDate = (val: string | null | undefined): string => {
    if (!val) return today;
    const trimmed = val.trim();
    if (!trimmed) return today;
    // Try extracting YYYY-MM-DD via string split (handles SQLite + ISO formats)
    const d = trimmed.split("T")[0].split(" ")[0].trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    // Fallback: let JS Date parse anything else (un-padded, locale strings, etc.)
    try {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
    } catch {}
    return today;
  };

  const urlTag = (loc: string, lastmod: string, priority: string, changefreq: string) =>
    `  <url>\n    <loc>${esc(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

  const staticUrls = staticPages.map((p) => urlTag(p.loc, today, p.priority, p.changefreq));
  const jobUrls = jobs.map((j) => urlTag(`${DOMAIN}/jobs/${toJobSlug(j.id, j.title ?? "", j.company ?? "")}`, toSitemapDate(j.updated_at ?? j.created_at), "0.8", "weekly"));
  const blogUrls = posts.map((p) => urlTag(`${DOMAIN}/blog/${p.slug}`, toSitemapDate(p.updated_at ?? p.published_at), "0.6", "monthly"));

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticUrls,
    ...jobUrls,
    ...blogUrls,
    "</urlset>",
  ].join("\n");

  return c.text(xml, 200, { "Content-Type": "application/xml; charset=utf-8" });
});

// ────────────────────────────────────────────────────────────────────────
// Shared helper: upsert an array of ScrapedJobs into the DB
// ────────────────────────────────────────────────────────────────────────
function upsertJobs(jobs: ScrapedJob[]): { inserted: number; updated: number } {
  let inserted = 0, updated = 0;
  const now = new Date().toISOString();
  for (const job of jobs) {
    const existing = db.prepare(
      "SELECT id FROM jobs WHERE title = ? AND company = ? LIMIT 1"
    ).get(job.title, job.company) as any;
    const row = {
      title: job.title,
      company: job.company,
      location: job.location,
      city: job.city ?? null,
      state: job.state ?? null,
      route_type: job.route_type ?? null,
      equipment: job.equipment ?? "Dry Van",
      home_time: job.home_time ?? null,
      description: job.description ?? null,
      pay_rate: job.pay_rate ?? null,
      pay_period: job.pay_period ?? null,
      benefits: "[]",
      requirements: "[]",
      source_url: job.source_url,
      source_carrier: job.source_carrier,
      external_apply_url: job.external_apply_url ?? null,
      is_aggregated: 1,
      scraped_at: now,
      status: "active",
    };
    if (existing) {
      db.prepare(
        `UPDATE jobs SET route_type=?, equipment=?, home_time=?, description=?,
         pay_rate=?, pay_period=?, source_url=?, scraped_at=?, updated_at=? WHERE id=?`
      ).run(row.route_type, row.equipment, row.home_time, row.description,
            row.pay_rate, row.pay_period, row.source_url, now, now, existing.id);
      updated++;
    } else {
      const cols = Object.keys(row);
      db.prepare(
        `INSERT INTO jobs (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`
      ).run(...cols.map((k) => (row as any)[k]));
      inserted++;
    }
  }
  return { inserted, updated };
}

// ────────────────────────────────────────────────────────────────────────
// Nightly auto-scrape schedule (UTC — roughly 2–5 AM EST)
//
//  06:00 — Jobicy        (free, no key)
//  06:30 — Indeed RSS    (free, no key — CDL jobs from Indeed's public RSS)
//  07:00 — JSearch       (aggregates Indeed + LinkedIn + ZipRecruiter + Glassdoor)
//  07:30 — Adzuna        (requires ADZUNA_APP_ID + ADZUNA_APP_KEY)
//  08:00 — USAJOBS       (requires USAJOBS_API_KEY + USAJOBS_USER_AGENT)
//  08:30 — Careerjet     (requires CAREERJET_AFFID)
//
// Env vars — add to .env on Hostinger VPS:
//   RAPIDAPI_KEY  — get at rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
//   ADZUNA_APP_ID / ADZUNA_APP_KEY — free at developer.adzuna.com
//   USAJOBS_API_KEY / USAJOBS_USER_AGENT — free at usajobs.gov/api/
//   CAREERJET_AFFID — affiliate ID from careerjet.com
// ────────────────────────────────────────────────────────────────────────

registerScheduledTask({
  name: "Jobicy nightly import",
  hourUTC: 6,
  minuteUTC: 0,
  fn: async () => {
    try {
      const jobs = await fetchJobicyJobs();
      const { inserted, updated } = upsertJobs(jobs);
      console.log(`[Auto/Jobicy] ${jobs.length} fetched — ${inserted} new, ${updated} updated`);
    } catch (e) { console.warn("[Auto/Jobicy] Failed:", e); }
  },
});

registerScheduledTask({
  name: "Indeed RSS nightly import",
  hourUTC: 6,
  minuteUTC: 30,
  fn: async () => {
    try {
      const jobs = await fetchIndeedJobs();
      const { inserted, updated } = upsertJobs(jobs);
      console.log(`[Auto/Indeed] ${jobs.length} fetched — ${inserted} new, ${updated} updated`);
    } catch (e) { console.warn("[Auto/Indeed] Failed:", e); }
  },
});

registerScheduledTask({
  name: "JSearch nightly import",
  hourUTC: 7,
  minuteUTC: 0,
  fn: async () => {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) { console.warn("[Auto] RAPIDAPI_KEY missing — skipping"); return; }
    try {
      const jobs = await fetchJSearchJobs(apiKey);
      const { inserted, updated } = upsertJobs(jobs);
      console.log(`[Auto/JSearch] ${jobs.length} fetched — ${inserted} new, ${updated} updated`);
    } catch (e) { console.warn("[Auto/JSearch] Failed:", e); }
  },
});

registerScheduledTask({
  name: "Adzuna nightly import",
  hourUTC: 7,
  minuteUTC: 30,
  fn: async () => {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) { console.warn("[Auto] Adzuna keys missing — skipping"); return; }
    try {
      const jobs = await fetchAdzunaJobs(appId, appKey);
      const { inserted, updated } = upsertJobs(jobs);
      console.log(`[Auto/Adzuna] ${jobs.length} fetched — ${inserted} new, ${updated} updated`);
    } catch (e) { console.warn("[Auto/Adzuna] Failed:", e); }
  },
});

registerScheduledTask({
  name: "USAJOBS nightly import",
  hourUTC: 8,
  minuteUTC: 0,
  fn: async () => {
    const apiKey = process.env.USAJOBS_API_KEY;
    const userAgent = process.env.USAJOBS_USER_AGENT;
    if (!apiKey || !userAgent) { console.warn("[Auto] USAJOBS keys missing — skipping"); return; }
    try {
      const jobs = await fetchUSAJobsJobs(apiKey, userAgent);
      const { inserted, updated } = upsertJobs(jobs);
      console.log(`[Auto/USAJOBS] ${jobs.length} fetched — ${inserted} new, ${updated} updated`);
    } catch (e) { console.warn("[Auto/USAJOBS] Failed:", e); }
  },
});

registerScheduledTask({
  name: "Careerjet nightly import",
  hourUTC: 8,
  minuteUTC: 30,
  fn: async () => {
    const affId = process.env.CAREERJET_AFFID;
    if (!affId) { console.warn("[Auto] CAREERJET_AFFID missing — skipping"); return; }
    try {
      const jobs = await fetchCareerjetJobs(affId);
      const { inserted, updated } = upsertJobs(jobs);
      console.log(`[Auto/Careerjet] ${jobs.length} fetched — ${inserted} new, ${updated} updated`);
    } catch (e) { console.warn("[Auto/Careerjet] Failed:", e); }
  },
});

// ── Daily new-jobs digest — 10:00 UTC (6 AM EST / 3 AM PST) ─────────────
// Runs AFTER all nightly imports have finished (last one at 08:30 UTC)
registerScheduledTask({
  name: "Daily new-jobs digest",
  hourUTC: 10,
  minuteUTC: 0,
  fn: async () => {
    // Jobs added in the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const newJobs = db.prepare(
      "SELECT * FROM jobs WHERE status = 'active' AND created_at >= ? ORDER BY created_at DESC LIMIT 50"
    ).all(since) as any[];

    if (newJobs.length === 0) {
      console.log("[Digest] No new jobs in last 24h — skipping");
      return;
    }

    const totalJobs = (db.prepare("SELECT COUNT(*) as n FROM jobs WHERE status = 'active'").get() as any).n;

    // Collect all unique emails: leads + registered users
    const leadEmails = (db.prepare(
      "SELECT full_name, email FROM leads WHERE email IS NOT NULL AND email != '' GROUP BY email"
    ).all() as any[]);

    const userEmails = (db.prepare(
      "SELECT name, email FROM users WHERE email IS NOT NULL AND email != '' GROUP BY email"
    ).all() as any[]);

    // Merge, deduplicate by email
    const seen = new Set<string>();
    const recipients: Array<{ name?: string; email: string }> = [];
    for (const r of [...leadEmails, ...userEmails]) {
      const e = (r.email as string).toLowerCase().trim();
      if (!seen.has(e)) { seen.add(e); recipients.push({ name: r.full_name ?? r.name, email: e }); }
    }

    console.log(`[Digest] Sending ${newJobs.length} new jobs to ${recipients.length} recipients`);

    // Send in batches of 10 to avoid rate limits
    let sent = 0;
    for (let i = 0; i < recipients.length; i += 10) {
      const batch = recipients.slice(i, i + 10);
      await Promise.allSettled(batch.map((r) =>
        sendDailyDigest({
          recipientEmail: r.email,
          recipientName: r.name,
          newJobs,
          totalJobs,
        })
      ));
      sent += batch.length;
      if (i + 10 < recipients.length) await new Promise((res) => setTimeout(res, 1000));
    }
    console.log(`[Digest] Done — ${sent} emails sent`);
  },
});

// ── Job expiry — runs at 09:00 UTC, after all scrapers finish ────────────────
// Marks aggregated jobs as inactive if they haven't been re-scraped in 45 days.
// This prevents stale listings from accumulating forever.
registerScheduledTask({
  name: "Job expiry cleanup",
  hourUTC: 9,
  minuteUTC: 0,
  fn: async () => {
    const cutoff = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
    const result = db.prepare(
      `UPDATE jobs SET status = 'inactive', updated_at = datetime('now')
       WHERE is_aggregated = 1 AND status = 'active'
       AND (scraped_at IS NULL OR scraped_at < ?)`
    ).run(cutoff);
    console.log(`[Expiry] Marked ${result.changes} stale aggregated jobs as inactive`);
  },
});

// ────────────────────────────────────────────────────────────────────────
// AI BLOG GENERATION
// POST /api/admin/blog/generate — generate a full SEO blog post via Claude Haiku
// ────────────────────────────────────────────────────────────────────────
app.post("/api/admin/blog/generate", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return c.json({ message: "ANTHROPIC_API_KEY not set in .env" }, 500);

  const { topic, category = "Career Tips" } = await c.req.json().catch(() => ({}));
  if (!topic) return c.json({ message: "topic is required" }, 400);

  const prompt = `You are an SEO content expert writing for TruckDriverJobs.co, a CDL job board.

Write a comprehensive, SEO-optimized blog post about: "${topic}"

Return ONLY valid JSON with this exact structure (no markdown, no code blocks, just JSON):
{
  "title": "Engaging title with primary keyword near the start (60 chars max)",
  "slug": "url-friendly-slug-with-hyphens",
  "meta_description": "Compelling meta description 150-160 chars, includes primary keyword",
  "excerpt": "2-3 sentence summary for blog listing pages",
  "category": "${category}",
  "read_time": "X min read",
  "content": "Full markdown content here"
}

SEO content rules:
- 1200-1800 words total
- H2 headings every 200-300 words
- Include a "Frequently Asked Questions" H2 section at the end with 3-4 Q&A pairs using H3 for questions (Google featured snippets)
- Use the primary keyword naturally in the first paragraph, at least one H2, and the conclusion
- Write for truck drivers — practical, direct, no fluff
- Include specific numbers, facts, and actionable advice
- No keyword stuffing
- Markdown formatting: **bold** for emphasis, bullet lists where appropriate`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      const err = await res.text();
      return c.json({ message: `Anthropic API error: ${res.status} — ${err.slice(0, 300)}` }, 500);
    }

    const data = await res.json() as any;
    const raw = data.content?.[0]?.text ?? "";

    // Strip code fences if model wrapped in them
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

    let post: any;
    try {
      post = JSON.parse(cleaned);
    } catch {
      return c.json({ message: "Model returned invalid JSON", raw: raw.slice(0, 500) }, 500);
    }

    // Ensure slug is clean
    post.slug = (post.slug ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    post.published_at = new Date().toISOString().split("T")[0];
    post.status = "published";
    post.featured = 0;

    return c.json({ post });
  } catch (e: any) {
    return c.json({ message: e?.message ?? "Generation failed" }, 500);
  }
});

/** POST /api/admin/blog/save-generated — save an AI-generated post to the DB */
app.post("/api/admin/blog/save-generated", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  const post = await c.req.json().catch(() => null);
  if (!post?.slug || !post?.title || !post?.content) {
    return c.json({ message: "slug, title, and content are required" }, 400);
  }

  // Check slug collision
  const existing = db.prepare("SELECT id FROM blog_posts WHERE slug = ?").get(post.slug) as any;
  if (existing) {
    post.slug = `${post.slug}-${Date.now()}`;
  }

  db.prepare(`
    INSERT INTO blog_posts
      (slug, title, content, excerpt, meta_description, category, read_time, published_at, featured, status)
    VALUES
      (@slug, @title, @content, @excerpt, @meta_description, @category, @read_time, @published_at, @featured, @status)
  `).run({
    slug: post.slug,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt ?? null,
    meta_description: post.meta_description ?? null,
    category: post.category ?? "Career Tips",
    read_time: post.read_time ?? "5 min read",
    published_at: post.published_at ?? new Date().toISOString().split("T")[0],
    featured: post.featured ? 1 : 0,
    status: "published",
  });

  return c.json({ ok: true, slug: post.slug });
});

// ── Static file serving (production only — Vite handles this in dev) ────────
// Serves the built React app from out/ and falls back to index.html for SPA routing
const STATIC_DIR = resolve(process.cwd(), "out");

// ── Job slug helper (mirrors src/lib/jobSlug.ts) ─────────────────────────
function toJobSlug(id: number, title: string, company: string): string {
  const text = `${title}-at-${company}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${id}-${text}`;
}

// ── Server-side SEO injection ─────────────────────────────────────────────
// Intercepts job detail pages and injects correct title/meta/JSON-LD into
// the initial HTML so Googlebot sees full SEO data without executing JS.
function injectSeoIntoHtml(html: string, patches: {
  title: string;
  description: string;
  canonical: string;
  jsonLd: Record<string, unknown>[];
  ogImage?: string;
}): string {
  const esc = (s: string) => s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const desc = esc(patches.description.slice(0, 160));
  const title = esc(patches.title);
  const canonical = patches.canonical;
  const ldScript = patches.jsonLd
    .map((ld) => `<script type="application/ld+json">${JSON.stringify(ld)}</script>`)
    .join("\n");
  // index.html doesn't ship og:image/twitter:image by default — inject fresh tags rather than regex-replace
  const imageTags = patches.ogImage
    ? `<meta property="og:image" content="${esc(patches.ogImage)}" />\n<meta name="twitter:image" content="${esc(patches.ogImage)}" />\n`
    : "";

  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/,  `$1${desc}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/,        `$1${canonical}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/,       `$1${title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/,  `$1${desc}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/,          `$1${canonical}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/,       `$1${title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/,  `$1${desc}$2`)
    .replace("</head>", `${imageTags}${ldScript}\n</head>`);
}

// ── Slug maps (mirrors src/lib/seoSlugs.ts) ──────────────────────────────
const STATE_SLUGS: Record<string, { abbr: string; name: string }> = {
  "texas":          { abbr: "TX", name: "Texas" },
  "florida":        { abbr: "FL", name: "Florida" },
  "georgia":        { abbr: "GA", name: "Georgia" },
  "illinois":       { abbr: "IL", name: "Illinois" },
  "pennsylvania":   { abbr: "PA", name: "Pennsylvania" },
  "ohio":           { abbr: "OH", name: "Ohio" },
  "mississippi":    { abbr: "MS", name: "Mississippi" },
  "indiana":        { abbr: "IN", name: "Indiana" },
  "north-carolina": { abbr: "NC", name: "North Carolina" },
  "alabama":        { abbr: "AL", name: "Alabama" },
  "virginia":       { abbr: "VA", name: "Virginia" },
  "california":     { abbr: "CA", name: "California" },
  "tennessee":      { abbr: "TN", name: "Tennessee" },
  "south-carolina": { abbr: "SC", name: "South Carolina" },
  "new-jersey":     { abbr: "NJ", name: "New Jersey" },
  "wisconsin":      { abbr: "WI", name: "Wisconsin" },
  "new-york":       { abbr: "NY", name: "New York" },
  "maryland":       { abbr: "MD", name: "Maryland" },
  "louisiana":      { abbr: "LA", name: "Louisiana" },
};
const EQUIPMENT_SLUGS: Record<string, string> = {
  "dry-van": "Dry Van", "flatbed": "Flatbed", "reefer": "Reefer", "tanker": "Tanker",
};

if (existsSync(STATIC_DIR)) {
  // Job detail pages — inject SEO before serving SPA shell
  app.get("/jobs/:id", (c) => {
    // Support both "/jobs/16" (legacy) and "/jobs/16-otr-dry-van-driver-at-werner" (slug)
    const rawId = c.req.param("id");
    const id = parseInt(rawId, 10); // parseInt stops at first non-digit, so both formats work
    let html: string;
    try {
      html = readFileSync(resolve(STATIC_DIR, "index.html"), "utf-8");
    } catch {
      return c.text("App not built. Run: npm run build", 503);
    }

    const job = isNaN(id) ? null : db.prepare(
      "SELECT id, title, company, location, route_type, equipment, home_time, description, created_at FROM jobs WHERE id = ? AND status = 'active'"
    ).get(id) as any;

    if (!job) return c.html(html); // unknown job — serve SPA as-is

    const DOMAIN = "https://truckdriverjobs.co";
    const jobSlug = toJobSlug(job.id, job.title ?? "", job.company ?? "");
    const canonical = `${DOMAIN}/jobs/${jobSlug}`;
    const titleText = `${job.title} at ${job.company}`;
    const descText = [
      `${job.title} at ${job.company} in ${job.location}.`,
      job.route_type ? `${job.route_type} route.` : "",
      job.equipment ? `${job.equipment} equipment.` : "",
      job.home_time ? `${job.home_time} home time.` : "",
      "Apply in 30 seconds — no resume needed.",
    ].filter(Boolean).join(" ");

    const jsonLd: Record<string, unknown>[] = [
      {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "title": job.title,
        "datePosted": (job.created_at ?? new Date().toISOString()).split("T")[0],
        "description": job.description ?? descText,
        "employmentType": "FULL_TIME",
        "hiringOrganization": { "@type": "Organization", "name": job.company },
        "jobLocation": {
          "@type": "Place",
          "address": { "@type": "PostalAddress", "addressLocality": job.location, "addressCountry": "US" }
        },
        "url": canonical,
        "directApply": true,
      },
    ];

    return c.html(injectSeoIntoHtml(html, { title: titleText, description: descText, canonical, jsonLd }));
  });

  // Programmatic SEO pages — /cdl-jobs/:slug
  app.get("/cdl-jobs/:slug", (c) => {
    const slug = c.req.param("slug");
    let html: string;
    try {
      html = readFileSync(resolve(STATIC_DIR, "index.html"), "utf-8");
    } catch {
      return c.text("App not built. Run: npm run build", 503);
    }

    const DOMAIN = "https://truckdriverjobs.co";
    const canonical = `${DOMAIN}/cdl-jobs/${slug}`;

    const stateInfo = STATE_SLUGS[slug];
    const equipmentLabel = EQUIPMENT_SLUGS[slug];

    if (!stateInfo && !equipmentLabel) return c.html(html);

    let titleText: string, descText: string, count = 0;

    if (stateInfo) {
      const row = db.prepare(
        "SELECT COUNT(*) as c FROM jobs WHERE status='active' AND (state = ? OR state = ?)"
      ).get(stateInfo.abbr, stateInfo.name) as any;
      count = row?.c ?? 0;
      titleText = `CDL Jobs in ${stateInfo.name} (${new Date().getFullYear()})`;
      descText = `Find ${count} CDL truck driving jobs in ${stateInfo.name} from verified carriers. Dry Van, Flatbed, Reefer and Tanker positions available. Apply in 30 seconds — no resume needed.`;
    } else {
      const row = db.prepare(
        "SELECT COUNT(*) as c FROM jobs WHERE status='active' AND equipment = ?"
      ).get(equipmentLabel) as any;
      count = row?.c ?? 0;
      titleText = `${equipmentLabel} CDL Truck Driving Jobs`;
      descText = `Find ${count} ${equipmentLabel} CDL truck driving jobs across the US from verified carriers. OTR, Regional, and Local routes available. Apply in 30 seconds — no resume needed.`;
    }

    const jsonLd: Record<string, unknown>[] = [{
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": titleText,
      "description": descText,
      "url": canonical,
      "numberOfItems": count,
    }];

    return c.html(injectSeoIntoHtml(html, { title: titleText, description: descText, canonical, jsonLd }));
  });

  // Blog post pages — inject SEO before serving SPA shell
  app.get("/blog/:slug", (c) => {
    const slug = c.req.param("slug");
    let html: string;
    try {
      html = readFileSync(resolve(STATIC_DIR, "index.html"), "utf-8");
    } catch {
      return c.text("App not built. Run: npm run build", 503);
    }

    const post = db.prepare(
      "SELECT slug, title, excerpt, meta_description, content, category, image_url, published_at, updated_at FROM blog_posts WHERE slug = ? AND status = 'published'"
    ).get(slug) as any;

    if (!post) return c.html(html); // unknown/unpublished post — serve SPA as-is

    const DOMAIN = "https://truckdriverjobs.co";
    const canonical = `${DOMAIN}/blog/${post.slug}`;
    const titleText = post.title;
    const descText = post.meta_description || post.excerpt || "";
    const dateModified = post.updated_at || post.published_at;

    const jsonLd: Record<string, unknown>[] = [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": DOMAIN },
          { "@type": "ListItem", "position": 2, "name": "The Dispatch", "item": `${DOMAIN}/blog` },
          { "@type": "ListItem", "position": 3, "name": post.title },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title,
        "description": descText,
        "image": post.image_url ?? undefined,
        "datePublished": post.published_at,
        "dateModified": dateModified,
        "author": { "@type": "Organization", "name": "TruckDriverJobs.co Editorial Team", "url": DOMAIN },
        "publisher": {
          "@type": "Organization",
          "name": "TruckDriverJobs.co",
          "url": DOMAIN,
          "logo": { "@type": "ImageObject", "url": `${DOMAIN}/vite.svg` },
        },
        "mainEntityOfPage": { "@type": "WebPage", "@id": canonical },
      },
    ];

    return c.html(injectSeoIntoHtml(html, {
      title: titleText,
      description: descText,
      canonical,
      jsonLd,
      ogImage: post.image_url ?? undefined,
    }));
  });

  app.use("/*", serveStatic({ root: "./out" }));
  app.notFound((c) => {
    // SPA fallback — let React Router handle the route
    try {
      const html = readFileSync(resolve(STATIC_DIR, "index.html"), "utf-8");
      return c.html(html);
    } catch {
      return c.text("App not built. Run: npm run build", 404);
    }
  });
  console.log(`📁 Serving static files from ${STATIC_DIR}`);
}

// ────────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`✅ TDJ API running on http://localhost:${info.port}`);
});
