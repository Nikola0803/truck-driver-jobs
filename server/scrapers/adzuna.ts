import type { ScrapedJob } from "./types.js";

const BASE = "https://api.adzuna.com/v1/api/jobs/us/search";

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string; area: string[] };
  description: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  created: string;
}

// Multiple CDL-focused queries to maximise coverage
const CDL_QUERIES = [
  "CDL-A truck driver",
  "Class A CDL OTR",
  "CDL flatbed driver",
  "CDL reefer driver",
  "CDL tanker driver",
  "CDL dedicated driver",
  "truck driver Class A",
  "owner operator CDL",
];

const STATE_MAP: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR",
  California: "CA", Colorado: "CO", Connecticut: "CT", Delaware: "DE",
  Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID",
  Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS",
  Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS",
  Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK",
  Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT",
  Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV",
  Wisconsin: "WI", Wyoming: "WY",
};

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

function parseState(area: string[]): string | undefined {
  for (const a of area) {
    if (STATE_MAP[a]) return STATE_MAP[a];
  }
  return undefined;
}

function formatPay(min?: number, max?: number): string | undefined {
  // Adzuna returns annual salary figures
  if (!min) return undefined;
  if (min < 500) return undefined; // Skip obviously bad data
  if (min > 1000) {
    // Annual salary — convert to weekly
    const weeklyMin = Math.round(min / 52);
    const weeklyMax = max && max > min ? Math.round(max / 52) : null;
    return weeklyMax
      ? `$${weeklyMin.toLocaleString()}–$${weeklyMax.toLocaleString()}/week`
      : `$${weeklyMin.toLocaleString()}/week`;
  }
  // Could be CPM (cents per mile) stored as raw value
  return `$${min.toFixed(2)}/mile`;
}

export async function fetchAdzunaJobs(appId: string, appKey: string): Promise<ScrapedJob[]> {
  const seen = new Set<string>(); // dedup by Adzuna job ID
  const byKey = new Map<string, boolean>(); // dedup by title+company
  const results: ScrapedJob[] = [];

  for (const query of CDL_QUERIES) {
    try {
      const url = new URL(`${BASE}/1`);
      url.searchParams.set("app_id", appId);
      url.searchParams.set("app_key", appKey);
      url.searchParams.set("results_per_page", "50");
      url.searchParams.set("what", query);
      url.searchParams.set("content-type", "application/json");
      // No category filter — let keywords do the work; Adzuna category slugs vary by region

      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.warn(`[Adzuna] Query "${query}" returned ${res.status}: ${body.slice(0, 200)}`);
        continue;
      }

      const data = (await res.json()) as { results?: AdzunaJob[]; count?: number; error?: string };
      if (data.error) {
        console.warn(`[Adzuna] API error on "${query}":`, data.error);
        continue;
      }
      console.log(`[Adzuna] "${query}" → ${data.results?.length ?? 0} results (total: ${data.count ?? "?"}`);

      for (const job of data.results ?? []) {
        if (seen.has(job.id)) continue;
        seen.add(job.id);

        const dupKey = `${job.title}||${job.company?.display_name}`.toLowerCase();
        if (byKey.has(dupKey)) continue;
        byKey.set(dupKey, true);

        const text = `${job.title} ${job.description ?? ""}`;
        const state = parseState(job.location?.area ?? []);
        const city = job.location?.area?.find(
          (a) => a !== "US" && !STATE_MAP[a] && a.length > 1
        );

        results.push({
          title: job.title,
          company: job.company?.display_name ?? "Unknown",
          location: job.location?.display_name ?? "United States",
          city: city ?? undefined,
          state,
          route_type: detectRouteType(text),
          equipment: detectEquipment(text),
          home_time: detectHomeTime(text),
          description: job.description?.slice(0, 3000) ?? undefined,
          pay_rate: formatPay(job.salary_min, job.salary_max),
          pay_period: job.salary_min && job.salary_min > 1000 ? "Weekly" : undefined,
          source_url: job.redirect_url,
          source_carrier: job.company?.display_name ?? "Unknown",
          external_apply_url: job.redirect_url,
        });
      }
    } catch (e) {
      console.warn(`[Adzuna] Error on "${query}":`, e);
    }
  }

  console.log(`[Adzuna] Fetched ${results.length} unique CDL jobs`);
  return results;
}
