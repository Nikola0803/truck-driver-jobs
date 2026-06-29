import type { ScrapedJob } from "./types.js";

const BASE = "https://data.usajobs.gov/api/search";

interface USAJobsResult {
  MatchedObjectId: string;
  MatchedObjectDescriptor: {
    PositionTitle: string;
    OrganizationName: string;
    DepartmentName: string;
    PositionLocationDisplay: string;
    PositionLocation: Array<{ LocationName: string; CountrySubDivisionCode: string; CityName: string }>;
    UserArea: { Details: { JobSummary?: string; MajorDuties?: string[] } };
    PositionRemuneration: Array<{ MinimumRange: string; MaximumRange: string; RateIntervalCode: string }>;
    PositionURI: string;
    ApplyURI: string[];
    PublicationStartDate: string;
    QualificationSummary?: string;
  };
}

const CDL_QUERIES = [
  "truck driver CDL",
  "tractor trailer driver",
  "motor vehicle operator",
  "heavy vehicle operator",
  "transportation specialist",
];

function detectEquipment(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("flatbed")) return "Flatbed";
  if (t.includes("reefer") || t.includes("refrigerated")) return "Reefer";
  if (t.includes("tanker")) return "Tanker";
  if (t.includes("tractor trailer") || t.includes("semi")) return "Dry Van";
  return "Dry Van";
}

function detectRouteType(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("local") || t.includes("installation")) return "Local";
  if (t.includes("regional")) return "Regional";
  if (t.includes("otr") || t.includes("over the road") || t.includes("long haul")) return "OTR";
  return "Local"; // Most federal driving jobs are local/regional
}

function formatPay(min: string, max: string, interval: string): string | undefined {
  const minNum = parseFloat(min);
  const maxNum = parseFloat(max);
  if (!minNum) return undefined;

  const code = interval.toUpperCase();

  if (code === "PA" || code === "PER YEAR" || code === "ANNUALLY") {
    // Annual → weekly
    const wMin = Math.round(minNum / 52);
    const wMax = maxNum > minNum ? Math.round(maxNum / 52) : null;
    return wMax
      ? `$${wMin.toLocaleString()}–$${wMax.toLocaleString()}/week`
      : `$${wMin.toLocaleString()}/week`;
  }
  if (code === "PH" || code === "PER HOUR") {
    return maxNum > minNum
      ? `$${minNum.toFixed(2)}–$${maxNum.toFixed(2)}/hr`
      : `$${minNum.toFixed(2)}/hr`;
  }
  if (code === "BW" || code === "BI-WEEKLY") {
    const wMin = Math.round(minNum / 2);
    return `$${wMin.toLocaleString()}/week`;
  }
  return undefined;
}

export async function fetchUSAJobsJobs(apiKey: string, userAgent: string): Promise<ScrapedJob[]> {
  const seen = new Set<string>();
  const byKey = new Map<string, boolean>();
  const results: ScrapedJob[] = [];

  for (const keyword of CDL_QUERIES) {
    try {
      const url = new URL(BASE);
      url.searchParams.set("Keyword", keyword);
      url.searchParams.set("ResultsPerPage", "50");
      url.searchParams.set("WhoMayApply", "all");
      url.searchParams.set("Fields", "min");

      const res = await fetch(url.toString(), {
        headers: {
          Host: "data.usajobs.gov",
          "User-Agent": userAgent,
          "Authorization-Key": apiKey,
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        console.warn(`[USAJOBS] Query "${keyword}" returned ${res.status}`);
        continue;
      }

      const data = (await res.json()) as {
        SearchResult?: { SearchResultItems?: Array<{ MatchedObjectDescriptor: USAJobsResult["MatchedObjectDescriptor"]; MatchedObjectId: string }> };
      };

      const items = data.SearchResult?.SearchResultItems ?? [];

      for (const item of items) {
        const id = item.MatchedObjectId;
        if (!id || seen.has(id)) continue;
        seen.add(id);

        const d = item.MatchedObjectDescriptor;
        const dupKey = `${d.PositionTitle}||${d.OrganizationName}`.toLowerCase();
        if (byKey.has(dupKey)) continue;
        byKey.set(dupKey, true);

        // Filter to actual driving roles
        const titleLower = d.PositionTitle.toLowerCase();
        const isDriving =
          titleLower.includes("driver") ||
          titleLower.includes("operator") ||
          titleLower.includes("transportation") ||
          titleLower.includes("motor vehicle");
        if (!isDriving) continue;

        const loc = d.PositionLocation?.[0];
        const text = `${d.PositionTitle} ${d.UserArea?.Details?.JobSummary ?? ""} ${d.UserArea?.Details?.MajorDuties?.join(" ") ?? ""}`;
        const remun = d.PositionRemuneration?.[0];

        results.push({
          title: d.PositionTitle,
          company: d.OrganizationName || d.DepartmentName || "U.S. Federal Government",
          location: d.PositionLocationDisplay || "United States",
          city: loc?.CityName ?? undefined,
          state: loc?.CountrySubDivisionCode ?? undefined,
          route_type: detectRouteType(text),
          equipment: detectEquipment(text),
          description: d.UserArea?.Details?.JobSummary?.slice(0, 3000) ?? undefined,
          pay_rate: remun ? formatPay(remun.MinimumRange, remun.MaximumRange, remun.RateIntervalCode) : undefined,
          pay_period: remun ? "Weekly" : undefined,
          source_url: d.PositionURI ?? undefined,
          source_carrier: d.OrganizationName || "U.S. Federal Government",
          external_apply_url: d.ApplyURI?.[0] ?? d.PositionURI ?? undefined,
        });
      }
    } catch (e) {
      console.warn(`[USAJOBS] Error on "${keyword}":`, e);
    }
  }

  console.log(`[USAJOBS] Fetched ${results.length} unique federal driving jobs`);
  return results;
}
