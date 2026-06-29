import type { ScrapedJob } from "./types.js";

const BASE = "http://public.api.careerjet.net/search";

interface CareerjetJob {
  url: string;
  title: string;
  company: string;
  locations: string;
  description: string;
  salary?: string;
  date: string;
}

const CDL_QUERIES = [
  "CDL-A truck driver",
  "Class A CDL OTR",
  "CDL flatbed driver",
  "CDL reefer driver",
  "CDL tanker driver",
  "CDL dedicated driver",
  "owner operator CDL",
  "tractor trailer driver CDL",
];

function detectEquipment(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("flatbed") || t.includes("flat bed")) return "Flatbed";
  if (t.includes("step deck") || t.includes("stepdeck")) return "Step Deck";
  if (t.includes("reefer") || t.includes("refrigerated")) return "Reefer";
  if (t.includes("tanker")) return "Tanker";
  return "Dry Van";
}

function detectRouteType(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("local") || t.includes("home daily")) return "Local";
  if (t.includes("dedicated")) return "Dedicated";
  if (t.includes("regional")) return "Regional";
  return "OTR";
}

function detectHomeTime(text: string): string | undefined {
  const t = text.toLowerCase();
  if (t.includes("home daily") || t.includes("home every night")) return "Home Daily";
  if (t.includes("home weekly")) return "Home Weekly";
  if (t.includes("home every 2 weeks") || t.includes("bi-weekly home")) return "Home Every 2 Weeks";
  return undefined;
}

function parseLocation(locations: string): { city?: string; state?: string } {
  // Careerjet returns "City, ST" or "City, State"
  const parts = locations.split(",").map((s) => s.trim());
  if (parts.length >= 2) {
    const stateRaw = parts[parts.length - 1].trim();
    // Handle both "TX" and "Texas"
    const state = stateRaw.length === 2 ? stateRaw.toUpperCase() : undefined;
    return { city: parts[0], state };
  }
  return {};
}

export async function fetchCareerjetJobs(affId: string): Promise<ScrapedJob[]> {
  const seen = new Set<string>();
  const byKey = new Map<string, boolean>();
  const results: ScrapedJob[] = [];

  for (const query of CDL_QUERIES) {
    try {
      const url = new URL(BASE);
      url.searchParams.set("keywords", query);
      url.searchParams.set("location", "USA");
      url.searchParams.set("affid", affId);
      url.searchParams.set("user_ip", "8.8.8.8");
      url.searchParams.set("url", "https://truckdriverjobs.co/jobs");
      url.searchParams.set("user_agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
      url.searchParams.set("locale_code", "en_US");
      url.searchParams.set("pagesize", "99");
      url.searchParams.set("page", "1");

      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          Referer: "https://truckdriverjobs.co/jobs",
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        console.warn(`[Careerjet] Query "${query}" returned ${res.status}`);
        continue;
      }

      const data = (await res.json()) as { jobs?: CareerjetJob[]; type?: string; hits?: number; error?: string };

      if (data.type === "ERROR" || data.error) {
        console.warn(`[Careerjet] API error on "${query}":`, JSON.stringify(data).slice(0, 300));
        continue;
      }
      console.log(`[Careerjet] "${query}" → ${data.jobs?.length ?? 0} results (hits: ${data.hits ?? "?"})`);

      for (const job of data.jobs ?? []) {
        if (!job.url) continue;
        if (seen.has(job.url)) continue;
        seen.add(job.url);

        const dupKey = `${job.title}||${job.company}`.toLowerCase();
        if (byKey.has(dupKey)) continue;
        byKey.set(dupKey, true);

        // Queries are CDL-specific — only skip obvious non-driving roles
        const titleLower = (job.title ?? "").toLowerCase();
        if (titleLower.includes("software") || titleLower.includes("accountant")) continue;

        const text = `${job.title} ${job.description ?? ""}`;
        const { city, state } = parseLocation(job.locations ?? "");

        results.push({
          title: job.title,
          company: job.company ?? "Unknown",
          location: job.locations || "United States",
          city,
          state,
          route_type: detectRouteType(text),
          equipment: detectEquipment(text),
          home_time: detectHomeTime(text),
          description: job.description?.slice(0, 3000) ?? undefined,
          pay_rate: job.salary ?? undefined,
          source_url: job.url,
          source_carrier: job.company ?? "Unknown",
          external_apply_url: job.url,
        });
      }
    } catch (e) {
      console.warn(`[Careerjet] Error on "${query}":`, e);
    }
  }

  console.log(`[Careerjet] Fetched ${results.length} unique CDL jobs`);
  return results;
}
