/**
 * Jobicy Job API — free, no key required.
 * https://jobicy.com/jobs-rss-feed
 * API: https://jobicy.com/api/v2/remote-jobs
 *
 * Note: Jobicy is remote-first. We filter for US-based and driving roles.
 * Volume is lower (~20-50 CDL results) but completely free and reliable.
 */
import type { ScrapedJob } from "./types.js";

const BASE = "https://jobicy.com/api/v2/remote-jobs";

interface JobicyJob {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  jobGeo: string;       // e.g. "USA", "Anywhere"
  jobType: string;      // "full-time", "part-time", etc.
  jobExcerpt: string;
  jobDescription: string;
  pubDate: string;      // ISO date
  salary?: string;
  annualSalaryMin?: number;
  annualSalaryMax?: number;
}

const CDL_TAGS = [
  "truck driver",
  "cdl",
  "trucking",
  "transportation",
  "driver",
  "logistics",
];

function detectEquipment(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("flatbed")) return "Flatbed";
  if (t.includes("step deck")) return "Step Deck";
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

function formatSalary(min?: number, max?: number): string | undefined {
  if (!min) return undefined;
  const wMin = Math.round(min / 52);
  const wMax = max && max > min ? Math.round(max / 52) : null;
  return wMax
    ? `$${wMin.toLocaleString()}–$${wMax.toLocaleString()}/week`
    : `$${wMin.toLocaleString()}/week`;
}

export async function fetchJobicyJobs(): Promise<ScrapedJob[]> {
  const results: ScrapedJob[] = [];
  const seen = new Set<string>();

  for (const tag of CDL_TAGS) {
    try {
      const url = new URL(BASE);
      url.searchParams.set("count", "50");
      url.searchParams.set("tag", tag);
      url.searchParams.set("geo", "usa");

      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "TruckDriverJobs.co/1.0",
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        console.warn(`[Jobicy] tag "${tag}" returned ${res.status}`);
        continue;
      }

      const data = (await res.json()) as { jobs?: JobicyJob[]; apiVersion?: string };
      console.log(`[Jobicy] tag "${tag}" → ${data.jobs?.length ?? 0} results`);

      for (const job of data.jobs ?? []) {
        if (seen.has(String(job.id))) continue;
        seen.add(String(job.id));

        const text = `${job.jobTitle} ${job.jobExcerpt} ${job.jobDescription ?? ""}`;

        // Only keep driving/transport roles
        const textLower = text.toLowerCase();
        const isDriving =
          textLower.includes("driver") ||
          textLower.includes("cdl") ||
          textLower.includes("truck") ||
          textLower.includes("haul") ||
          textLower.includes("transport");
        if (!isDriving) continue;

        results.push({
          title: job.jobTitle,
          company: job.companyName ?? "Unknown",
          location: job.jobGeo === "Anywhere" ? "United States" : job.jobGeo,
          route_type: detectRouteType(text),
          equipment: detectEquipment(text),
          description: job.jobExcerpt?.slice(0, 3000) ?? undefined,
          pay_rate: job.salary ?? formatSalary(job.annualSalaryMin, job.annualSalaryMax),
          source_url: job.url,
          source_carrier: job.companyName ?? "Unknown",
          external_apply_url: job.url,
        });
      }
    } catch (e) {
      console.warn(`[Jobicy] Error on tag "${tag}":`, e);
    }
  }

  console.log(`[Jobicy] Total: ${results.length} CDL jobs`);
  return results;
}
