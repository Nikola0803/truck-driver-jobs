import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// DATA_DIR can be overridden by env var — point to a persistent volume on your VPS
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "app.db");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(DB_PATH);

// Performance pragmas
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Schema ──────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    email      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id                   TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name            TEXT,
    phone                TEXT,
    has_cdl              INTEGER DEFAULT 1,
    cdl_state            TEXT,
    experience           TEXT,
    endorsement_type     TEXT,
    driver_type          TEXT DEFAULT 'company_driver',
    preferred_route      TEXT,
    preferred_equipment  TEXT,
    home_time_preference TEXT,
    min_pay_expectation  TEXT,
    is_admin             INTEGER DEFAULT 0,
    updated_at           TEXT DEFAULT (datetime('now')),
    created_at           TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    title               TEXT NOT NULL,
    company             TEXT NOT NULL,
    location            TEXT NOT NULL,
    city                TEXT,
    state               TEXT,
    route_type          TEXT,
    equipment           TEXT,
    experience_required TEXT,
    truck_info          TEXT,
    pay_rate            TEXT,
    pay_period          TEXT,
    home_time           TEXT,
    description         TEXT,
    benefits            TEXT DEFAULT '[]',
    requirements        TEXT DEFAULT '[]',
    featured            INTEGER DEFAULT 0,
    badge               TEXT,
    status              TEXT DEFAULT 'active',
    created_at          TEXT DEFAULT (datetime('now')),
    updated_at          TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_jobs_status   ON jobs (status);
  CREATE INDEX IF NOT EXISTS idx_jobs_featured ON jobs (featured);
  CREATE INDEX IF NOT EXISTS idx_jobs_state    ON jobs (state);

  CREATE TABLE IF NOT EXISTS saved_jobs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id     INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, job_id)
  );

  CREATE TABLE IF NOT EXISTS applications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id     INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    cdl_class  TEXT,
    experience TEXT,
    message    TEXT,
    status     TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    status       TEXT DEFAULT 'active',
    job_type     TEXT,
    duration_days INTEGER DEFAULT 30,
    description  TEXT,
    benefits     TEXT DEFAULT '[]',
    locations    TEXT DEFAULT '[]',
    cta          TEXT,
    created_at   TEXT DEFAULT (datetime('now')),
    updated_at   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS content_templates (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id       INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    type              TEXT NOT NULL,
    content           TEXT NOT NULL,
    variant_index     INTEGER DEFAULT 1,
    used              INTEGER DEFAULT 0,
    performance_score INTEGER DEFAULT 0,
    created_at        TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS recruitment_groups (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT NOT NULL,
    platform         TEXT DEFAULT 'facebook',
    url              TEXT,
    fb_group_id      TEXT,
    post_method      TEXT DEFAULT 'manual',
    members_count    INTEGER DEFAULT 0,
    category         TEXT,
    state            TEXT,
    priority         TEXT DEFAULT 'medium',
    status           TEXT DEFAULT 'active',
    notes            TEXT,
    posts_count      INTEGER DEFAULT 0,
    last_post_status TEXT,
    last_post_error  TEXT,
    last_posted_at   TEXT,
    created_at       TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS queued_posts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id  INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    group_id     INTEGER REFERENCES recruitment_groups(id) ON DELETE SET NULL,
    template_id  INTEGER REFERENCES content_templates(id) ON DELETE SET NULL,
    headline     TEXT,
    description  TEXT,
    content      TEXT,
    status       TEXT DEFAULT 'pending',
    scheduled_at TEXT DEFAULT (datetime('now')),
    published_at TEXT,
    created_at   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS published_posts (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    queued_post_id INTEGER REFERENCES queued_posts(id),
    campaign_id    INTEGER REFERENCES campaigns(id),
    group_id       INTEGER REFERENCES recruitment_groups(id),
    content        TEXT,
    posted_at      TEXT,
    method         TEXT DEFAULT 'manual',
    created_at     TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS blog_posts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    slug         TEXT UNIQUE NOT NULL,
    title        TEXT NOT NULL,
    content      TEXT,
    excerpt      TEXT,
    category     TEXT,
    read_time    TEXT,
    published_at TEXT,
    image_url    TEXT,
    status       TEXT DEFAULT 'published',
    created_at   TEXT DEFAULT (datetime('now')),
    updated_at   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name        TEXT NOT NULL,
    email            TEXT NOT NULL,
    phone            TEXT NOT NULL,
    cdl_class        TEXT DEFAULT 'A',
    experience       TEXT,
    endorsements     TEXT DEFAULT '[]',
    route_type       TEXT,
    equipment        TEXT,
    home_time        TEXT,
    min_pay          TEXT,
    states           TEXT DEFAULT '[]',
    matched_job_ids  TEXT DEFAULT '[]',
    applied_job_ids  TEXT DEFAULT '[]',
    applied_at       TEXT,
    status           TEXT DEFAULT 'new',
    source           TEXT DEFAULT 'ai_match',
    notes            TEXT,
    created_at       TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_leads_email      ON leads (email);
  CREATE INDEX IF NOT EXISTS idx_leads_status     ON leads (status);
  CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at);

  CREATE TABLE IF NOT EXISTS analytics_events (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type   TEXT NOT NULL,
    session_id   TEXT,
    path         TEXT,
    referrer     TEXT,
    referrer_domain TEXT,
    utm_source   TEXT,
    utm_medium   TEXT,
    utm_campaign TEXT,
    user_agent   TEXT,
    metadata     TEXT DEFAULT '{}',
    created_at   TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_analytics_event_type  ON analytics_events (event_type);
  CREATE INDEX IF NOT EXISTS idx_analytics_session     ON analytics_events (session_id);
  CREATE INDEX IF NOT EXISTS idx_analytics_created_at  ON analytics_events (created_at);
`);

// ── Migrations: add columns that may not exist yet ──────────────────────
const migrations = [
  `ALTER TABLE jobs ADD COLUMN source_url TEXT`,
  `ALTER TABLE jobs ADD COLUMN source_carrier TEXT`,
  `ALTER TABLE jobs ADD COLUMN is_aggregated INTEGER DEFAULT 0`,
  `ALTER TABLE jobs ADD COLUMN external_apply_url TEXT`,
  `ALTER TABLE jobs ADD COLUMN scraped_at TEXT`,
  `ALTER TABLE applications ADD COLUMN applicant_name TEXT`,
  `ALTER TABLE applications ADD COLUMN applicant_email TEXT`,
  `ALTER TABLE applications ADD COLUMN applicant_phone TEXT`,
  `ALTER TABLE applications ADD COLUMN consent_given INTEGER DEFAULT 0`,
  `ALTER TABLE blog_posts ADD COLUMN featured INTEGER DEFAULT 0`,
  `ALTER TABLE blog_posts ADD COLUMN meta_description TEXT`,
  // Profile columns — may be missing in older production databases
  `ALTER TABLE profiles ADD COLUMN is_admin INTEGER DEFAULT 0`,
  `ALTER TABLE profiles ADD COLUMN driver_type TEXT`,
  `ALTER TABLE profiles ADD COLUMN has_cdl INTEGER DEFAULT 1`,
  `ALTER TABLE profiles ADD COLUMN cdl_state TEXT`,
  `ALTER TABLE profiles ADD COLUMN experience TEXT`,
  `ALTER TABLE profiles ADD COLUMN endorsement_type TEXT`,
  `ALTER TABLE profiles ADD COLUMN preferred_route TEXT`,
  `ALTER TABLE profiles ADD COLUMN preferred_equipment TEXT`,
  `ALTER TABLE profiles ADD COLUMN home_time_preference TEXT`,
  `ALTER TABLE profiles ADD COLUMN min_pay_expectation TEXT`,
];

for (const sql of migrations) {
  try { db.exec(sql); } catch { /* column already exists */ }
}

// ── JSON field helpers ───────────────────────────────────────────────────

// Tables and their JSON columns (stored as TEXT in SQLite)
const JSON_COLS: Record<string, string[]> = {
  jobs: ["benefits", "requirements"],
  campaigns: ["benefits", "locations"],
  profiles: [],
};

// Boolean columns stored as 0/1
const BOOL_COLS: Record<string, string[]> = {
  jobs: ["featured"],
  profiles: ["has_cdl", "is_admin"],
  content_templates: ["used"],
};

export function parseRow(table: string, row: Record<string, any>): Record<string, any> {
  if (!row) return row;
  const out = { ...row };
  for (const col of JSON_COLS[table] ?? []) {
    if (typeof out[col] === "string") {
      try { out[col] = JSON.parse(out[col]); } catch { out[col] = []; }
    }
  }
  for (const col of BOOL_COLS[table] ?? []) {
    if (col in out) out[col] = out[col] === 1 || out[col] === true;
  }
  return out;
}

export function stringifyRow(table: string, row: Record<string, any>): Record<string, any> {
  const out = { ...row };
  for (const col of JSON_COLS[table] ?? []) {
    if (Array.isArray(out[col]) || (out[col] && typeof out[col] === "object")) {
      out[col] = JSON.stringify(out[col]);
    }
  }
  for (const col of BOOL_COLS[table] ?? []) {
    if (col in out && typeof out[col] === "boolean") {
      out[col] = out[col] ? 1 : 0;
    }
  }
  return out;
}

// Known FK relationships for JOIN support
// format: { table: { fk_column: referenced_table } }
export const FK_MAP: Record<string, Record<string, string>> = {
  queued_posts: { campaign_id: "campaigns", group_id: "recruitment_groups", template_id: "content_templates" },
  content_templates: { campaign_id: "campaigns" },
  applications: { user_id: "users", job_id: "jobs" },
  saved_jobs: { user_id: "users", job_id: "jobs" },
  published_posts: { campaign_id: "campaigns", group_id: "recruitment_groups", queued_post_id: "queued_posts" },
  profiles: { id: "users" },
};
