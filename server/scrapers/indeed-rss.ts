/**
 * Indeed RSS scraper — free, no API key required.
 *
 * Indeed publishes public RSS feeds for any job search query.
 * Each feed returns up to 10-15 jobs. We run multiple CDL-specific
 * queries to maximize coverage.
 *
 * URL format: https://rss.indeed.com/rss?q=<query>&l=United+States&sort=date
 *
 * RSS item structure:
 *   <title>Job Title - Company Name</title>
 *   <link>https://www.indeed.com/viewjob?jk=...</link>
 *   <description>HTML with company, location, snippet</description>
 *   <pubDate>Mon, 23 Jun 2026 22:20:17 GMT</pubDate>
 *   <source url="...">Company Name</source>
 */

import type { ScrapedJob } from "./types.js";

const BASE = "https://rss.indeed.com/rss";

// Multiple targeted CDL queries to maximize coverage across freight types and routes
const CDL_QUERIES = [
  "CDL-A truck driver",
  "Class A CDL OTR driver",
  "CDL flatbed truck driver",
  "CDL reefer driver",
  "CDL tanker driver",
  "CDL dedicated driver",
  "tractor trailer driver CDL",
  "owner operator CDL",
  "truck driver Class A",
  "CDL local driver home daily",
  "CDL regional driver home weekly",
  "CDL team driver OTR",
];

// ── XML parsing helpers ───────────────────────────────────────────────────

/** Extract text content from an XML tag (handles CDATA) */
function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, "is");
  return (xml.match(re)?.[1] ?? "").trim();
}

/** Extract all <item> blocks from RSS XML */
function extractItems(xml: string): string[] {
  const items: string[] = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    items.push(match[1]);
  }
  return items;
}

/** Strip HTML tags from description text */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse location from Indeed description HTML */
function parseLocation(description: string): { city?: string; state?: string; location: string } {
  // Indeed description HTML typically has: <b>Location:</b> City, ST<br>
  const locMatch = description.match(/location[:\s]+([^<\n]+)/i);
  if (locMatch) {
    const raw = stripHtml(locMatch[1]).trim();
    const parts = raw.split(",").map((s) => s.trim());
    if (parts.length >= 2) {
      const state = parts[parts.length - 1].length <= 3 ? parts[parts.length - 1].toUpperCase() : undefined;
      return { city: parts[0], state, location: raw };
    }
    return { location: raw };
  }
  return { location: "United States" };
}

/** Parse company from Indeed description HTML or <source> tag */
function parseCompany(itemXml: string, description: string): string {
  // Try <source> tag first
  const sourceMatch = itemXml.match(/<source[^>]*>([^<]+)<\/source>/i);
  if (sourceMatch) return sourceMatch[1].trim();

  // Try description HTML: <b>Company:</b> Company Name
  const compMatch = description.match(/company[:\s]+([^<\n]+)/i);
  if (compMatch) return stripHtml(compMatch[1]).trim();

  // Fall back to extracting from title ("Job Title - Company Name")
  return "Unknown";
}

/** Parse title — Indeed format is often "Job Title - Company Name" */
function parseTitle(rawTitle: string): { title: string; company?: string } {
  const parts = rawTitle.split(" - ");
  if (parts.length >= 2) {
    return {
      title: parts.slice(0, -1).join(" - ").trim(),
      company: parts[parts.length - 1].trim(),
    };
  }
  return { title: rawTitle.trim() };
}

function detectEquipment(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("flatbed") || t.includes("flat bed")) return "Flatbed";
  if (t.includes("step deck") || t.includes("stepdeck")) return "Step Deck";
  if (t.includes("reefer") || t.includes("refrigerated")) return "Reefer";
  if (t.includes("tanker")) return "Tanker";
  if (t.includes("dry van")) return "Dry Van";
  return "Dry Van";
}

function detectRouteType(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("local") || t.includes("home daily")) return "Local";
  if (t.includes("dedicated")) return "Dedicated";
  if (t.includes("regional")) return "Regional";
  if (t.includes("otr") || t.includes("over the road") || t.includes("long haul")) return "OTR";
  return "OTR";
}

function detectHomeTime(text: string): string | undefined {
  const t = text.toLowerCase();
  if (t.includes("home daily") || t.includes("home every night")) return "Home Daily";
  if (t.includes("home weekly") || t.includes("home every week")) return "Home Weekly";
  if (t.includes("home every 2 weeks") || t.includes("bi-weekly home")) return "Home Every 2 Weeks";
  if (t.includes("regional") && !t.includes("otr")) return "Home Weekly";
  return undefined;
}

// ── Main export ───────────────────────────────────────────────────────────

export async function fetchIndeedJobs(): Promise<ScrapedJob[]> {
  const seen = new Set<string>(); // dedup by job URL
  const byKey = new Map<string, boolean>(); // dedup by title+company
  const results: ScrapedJob[] = [];

  for (const query of CDL_QUERIES) {
    try {
      const url = new URL(BASE);
      url.searchParams.set("q", query);
      url.searchParams.set("l", "United States");
      url.searchParams.set("sort", "date");

      const res = await fetch(url.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; TruckDriverJobsBot/1.0; +https://truckdriverjobs.co)",
          Accept: "application/rss+xml, application/xml, text/xml",
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        console.warn(`[Indeed RSS] Query "${query}" returned ${res.status}`);
        continue;
      }

      const xml = await res.text();
      const items = extractItems(xml);
      console.log(`[Indeed RSS] "${query}" → ${items.length} items`);

      for (const item of items) {
        const rawTitle = extractTag(item, "title");
        const link = extractTag(item, "link") || extractTag(item, "guid");
        const description = extractTag(item, "description");
        const pubDate = extractTag(item, "pubDate");

        if (!link || !rawTitle) continue;
        if (seen.has(link)) continue;
        seen.add(link);

        const { title, company: titleCompany } = parseTitle(rawTitle);
        const descText = stripHtml(description);
        const company = parseCompany(item, description) || titleCompany || "Unknown";

        const dupKey = `${title}||${company}`.toLowerCase();
        if (byKey.has(dupKey)) continue;
        byKey.set(dupKey, true);

        // Skip non-driving roles that slip through
        const titleLower = title.toLowerCase();
        const isNonDriving =
          titleLower.includes("software") ||
          titleLower.includes("engineer") && !titleLower.includes("driver") ||
          titleLower.includes("accountant") ||
          titleLower.includes("recruiter") ||
          titleLower.includes("dispatcher");
        if (isNonDriving) continue;

        const { city, state, location } = parseLocation(description);
        const fullText = `${title} ${descText}`;

        results.push({
          title,
          company,
          location,
          city,
          state,
          route_type: detectRouteType(fullText),
          equipment: detectEquipment(fullText),
          home_time: detectHomeTime(fullText),
          description: descText.slice(0, 3000) || undefined,
          source_url: link,
          source_carrier: company,
          external_apply_url: link,
        });
      }
    } catch (e) {
      console.warn(`[Indeed RSS] Error on "${query}":`, e);
    }

    // Small delay between queries to be polite
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`[Indeed RSS] Fetched ${results.length} unique CDL jobs`);
  return results;
}
