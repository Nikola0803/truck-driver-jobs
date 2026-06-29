import type { ScrapedJob } from "./types.js";

const BASE = "https://jsearch.p.rapidapi.com/search";

interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_description?: string;
  job_apply_link?: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_period?: string;
  job_posted_at_datetime_utc?: string;
  job_employment_type?: string;
}

const CDL_QUERIES = [
  "CDL-A truck driver",
  "Class A CDL OTR driver",
  "CDL flatbed truck driver",
  "CDL reefer driver",
  "CDL tanker driver",
  "CDL dedicated driver",
  "owner operator CDL truck",
  "truck driver Class A CDL",
];

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

function formatPay(min?: number, max?: number, period?: string): string | undefined {
  if (!min || min < 1) return undefined;
  const p = (period ?? "").toLowerCase();

  // Weekly already
  if (p === "week" || p === "weekly") {
    return max && max > min
      ? `$${Math.round(min).toLocaleString()}–$${Math.round(max).toLocaleString()}/week`
      : `$${Math.round(min).toLocaleString()}/week`;
  }

  // Annual — convert to weekly
  if (p === "year" || p === "yearly" || p === "annual" || min > 5000) {
    const wMin = Math.round(min / 52);
    const wMax = max && max > min ? Math.round(max / 52) : null;
    return wMax
      ? `$${wMin.toLocaleString()}–$${wMax.toLocaleString()}/week`
      : `$${wMin.toLocaleString()}/week`;
  }

  // CPM range
  if (min < 2) {
    return max && max > min
      ? `$${min.toFixed(2)}–$${max.toFixed(2)}/mile`
      : `$${min.toFixed(2)}/mile`;
  }

  return `$${Math.round(min).toLocaleString()}/week`;
}

export async function fetchJSearchJobs(rapidApiKey: string): Promise<ScrapedJob[]> {
  const seen = new Set<string>();
  const byKey = new Map<string, boolean>();
  const results: ScrapedJob[] = [];

  for (const query of CDL_QUERIES) {
    try {
      const url = new URL(BASE);
      url.searchParams.set("query", query);
      url.searchParams.set("page", "1");
      url.searchParams.set("num_pages", "1"); // 10 results per call — 8 queries = 8 API calls/run
      url.searchParams.set("country", "us");
      url.searchParams.set("date_posted", "month");

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "jsearch.p.rapidapi.com",
          "x-rapidapi-key": rapidApiKey,
        },
        signal: AbortSignal.timeout(20_000),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.warn(`[JSearch] Query "${query}" returned ${res.status}: ${body.slice(0, 300)}`);
        continue;
      }

      const data = (await res.json()) as { data?: JSearchJob[]; status?: string; error?: string };
      if (data.status === "ERROR" || data.error) {
        console.warn(`[JSearch] API error on "${query}":`, data.error ?? data.status);
        continue;
      }
      console.log(`[JSearch] "${query}" → ${data.data?.length ?? 0} results`);

      for (const job of data.data ?? []) {
        if (!job.job_id) continue;
        if (seen.has(job.job_id)) continue;
        seen.add(job.job_id);

        const dupKey = `${job.job_title}||${job.employer_name}`.toLowerCase();
        if (byKey.has(dupKey)) continue;
        byKey.set(dupKey, true);

        // Queries already target CDL jobs — just skip non-driving roles
        const titleLower = (job.job_title ?? "").toLowerCase();
        const isNonDriving =
          titleLower.includes("software") ||
          titleLower.includes("engineer") ||
          titleLower.includes("accountant") ||
          titleLower.includes("recruiter") ||
          titleLower.includes("manager") && !titleLower.includes("driver");
        if (isNonDriving) continue;

        const text = `${job.job_title} ${job.job_description ?? ""}`;

        const location = [job.job_city, job.job_state]
          .filter(Boolean)
          .join(", ") || "United States";

        results.push({
          title: job.job_title,
          company: job.employer_name ?? "Unknown",
          location,
          city: job.job_city ?? undefined,
          state: job.job_state ?? undefined,
          route_type: detectRouteType(text),
          equipment: detectEquipment(text),
          home_time: detectHomeTime(text),
          description: job.job_description?.slice(0, 3000) ?? undefined,
          pay_rate: formatPay(job.job_min_salary, job.job_max_salary, job.job_salary_period),
          pay_period: job.job_min_salary ? "Weekly" : undefined,
          source_url: job.job_apply_link ?? undefined,
          source_carrier: job.employer_name ?? "Unknown",
          external_apply_url: job.job_apply_link ?? undefined,
        });
      }
    } catch (e) {
      console.warn(`[JSearch] Error on "${query}":`, e);
    }
  }

  console.log(`[JSearch] Fetched ${results.length} unique CDL jobs`);
  return results;
}
