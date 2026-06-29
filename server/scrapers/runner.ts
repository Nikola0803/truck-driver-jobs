import type { CarrierConfig, ScrapedJob, ScrapeResult } from "./types.js";

const BOT_UA = "TruckDriverJobsBot/1.0 (job aggregator; +https://truckdriverjobs.co)";
const FETCH_TIMEOUT_MS = 20_000;

// ── Schema.org JSON-LD extraction ────────────────────────────────────────

/** Pull every application/ld+json block out of raw HTML */
function extractJsonLdBlocks(html: string): any[] {
  const blocks: any[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      // Could be a single object or an array
      const entries = Array.isArray(parsed) ? parsed : [parsed];
      blocks.push(...entries);
    } catch {
      // malformed JSON — skip
    }
  }
  return blocks;
}

/** Normalise a schema.org/JobPosting object → ScrapedJob */
function normaliseJobPosting(jp: any, config: CarrierConfig, pageUrl: string): ScrapedJob | null {
  const title: string = jp.title ?? jp.name ?? "";
  if (!title) return null;

  // Location
  const addr = jp.jobLocation?.address ?? jp.jobLocation?.[0]?.address ?? {};
  const city: string = addr.addressLocality ?? "";
  const state: string = addr.addressRegion ?? "";
  const location: string = [city, state].filter(Boolean).join(", ") || addr.streetAddress || "United States";

  // Salary
  const salary = jp.baseSalary?.value;
  let payRate = "";
  let payPeriod = "";
  if (salary) {
    if (typeof salary === "number") {
      payRate = `$${salary.toLocaleString()}`;
    } else if (salary["@type"] === "QuantitativeValue") {
      const min = salary.minValue;
      const max = salary.maxValue;
      const unit = salary.unitText ?? "";
      if (min && max) payRate = `$${min.toLocaleString()} - $${max.toLocaleString()}`;
      else if (min) payRate = `$${min.toLocaleString()}+`;
      if (unit) payPeriod = unit.toLowerCase() === "year" ? "yearly" : unit.toLowerCase();
    }
  }

  // Description — strip HTML tags
  const rawDesc: string = jp.description ?? jp.responsibilities ?? "";
  const description = rawDesc.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000);

  // Benefits & requirements
  const benefits: string[] = [];
  const requirements: string[] = [];
  if (jp.jobBenefits) {
    const b = typeof jp.jobBenefits === "string" ? jp.jobBenefits : jp.jobBenefits.join(", ");
    benefits.push(...b.split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean));
  }
  if (jp.qualifications) {
    const q = typeof jp.qualifications === "string" ? jp.qualifications : jp.qualifications.join(", ");
    requirements.push(...q.split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean));
  }
  if (jp.experienceRequirements) {
    requirements.push(
      typeof jp.experienceRequirements === "string"
        ? jp.experienceRequirements
        : jp.experienceRequirements?.description ?? ""
    );
  }

  // Equipment / route hints from title/description
  const text = (title + " " + description).toLowerCase();
  let equipment = config.defaultEquipment ?? "Dry Van";
  if (text.includes("flatbed")) equipment = "Flatbed";
  else if (text.includes("refrig") || text.includes("reefer")) equipment = "Refrigerated";
  else if (text.includes("tanker")) equipment = "Tanker";
  else if (text.includes("hazmat")) equipment = "Hazmat";
  else if (text.includes("lowboy") || text.includes("step deck")) equipment = "Flatbed";

  let routeType = config.defaultRouteType ?? "OTR";
  if (text.includes("regional")) routeType = "Regional";
  else if (text.includes("local") || text.includes("home daily")) routeType = "Local";
  else if (text.includes("dedicated")) routeType = "Dedicated";
  else if (text.includes("otr") || text.includes("over-the-road")) routeType = "OTR";

  // Apply URL
  const externalApplyUrl: string =
    jp.url ?? jp.sameAs ?? jp.applyUrl ?? pageUrl;

  return {
    title,
    company: jp.hiringOrganization?.name ?? config.name,
    location,
    city: city || undefined,
    state: state || undefined,
    route_type: routeType,
    equipment,
    experience_required: jp.experienceRequirements?.description ?? jp.qualifications ?? undefined,
    pay_rate: payRate || undefined,
    pay_period: payPeriod || undefined,
    home_time: undefined,
    description: description || undefined,
    benefits: benefits.slice(0, 10),
    requirements: requirements.filter(Boolean).slice(0, 10),
    source_url: pageUrl,
    source_carrier: config.name,
    external_apply_url: externalApplyUrl !== pageUrl ? externalApplyUrl : undefined,
  };
}

// ── HTTP fetch with timeout ──────────────────────────────────────────────

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": BOT_UA,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// ── Strategy runners ─────────────────────────────────────────────────────

async function runSchemaOrg(config: CarrierConfig): Promise<ScrapedJob[]> {
  const urls = [config.url, ...(config.extraUrls ?? [])];
  const jobs: ScrapedJob[] = [];
  const seen = new Set<string>();

  for (const url of urls) {
    let html: string;
    try {
      html = await fetchHtml(url);
    } catch (err: any) {
      console.warn(`[scraper] fetch failed for ${url}: ${err.message}`);
      continue;
    }

    const blocks = extractJsonLdBlocks(html);
    for (const block of blocks) {
      const type = block["@type"];
      if (type === "JobPosting") {
        const job = normaliseJobPosting(block, config, url);
        if (job) {
          const key = `${job.title}|${job.location}`;
          if (!seen.has(key)) { seen.add(key); jobs.push(job); }
        }
      }
      // Some pages wrap multiple JobPostings in an ItemList
      if (type === "ItemList" && Array.isArray(block.itemListElement)) {
        for (const item of block.itemListElement) {
          const entry = item.item ?? item;
          if (entry?.["@type"] === "JobPosting") {
            const job = normaliseJobPosting(entry, config, url);
            if (job) {
              const key = `${job.title}|${job.location}`;
              if (!seen.has(key)) { seen.add(key); jobs.push(job); }
            }
          }
        }
      }
    }

    // Also look for individual job page links and scrape those if listing yielded nothing
    if (jobs.length === 0) {
      const jobLinkRe = /href=["']([^"']*(?:job|career|position|driver|cdl)[^"']*?)["']/gi;
      const links = new Set<string>();
      let m: RegExpExecArray | null;
      while ((m = jobLinkRe.exec(html)) !== null && links.size < 20) {
        try {
          const abs = new URL(m[1], url).href;
          if (abs.startsWith("http") && abs !== url) links.add(abs);
        } catch {}
      }
      for (const link of links) {
        try {
          const subHtml = await fetchHtml(link);
          const subBlocks = extractJsonLdBlocks(subHtml);
          for (const block of subBlocks) {
            if (block["@type"] === "JobPosting") {
              const job = normaliseJobPosting(block, config, link);
              if (job) {
                const key = `${job.title}|${job.location}`;
                if (!seen.has(key)) { seen.add(key); jobs.push(job); }
              }
            }
          }
        } catch {}
      }
    }
  }

  return jobs;
}

// ── Public API ───────────────────────────────────────────────────────────

export async function scrapeCarrier(config: CarrierConfig): Promise<ScrapeResult> {
  const scrapedAt = new Date().toISOString();
  try {
    let jobs: ScrapedJob[] = [];
    if (config.strategy === "schema-org") {
      jobs = await runSchemaOrg(config);
    }
    return { carrier: config.name, url: config.url, jobs, scrapedAt };
  } catch (err: any) {
    return { carrier: config.name, url: config.url, jobs: [], error: err.message, scrapedAt };
  }
}
