import type { Job } from "@/mocks/jobs";

/** Converts a DB `jobs` row (snake_case) → camelCase `Job` interface */
export function dbJobToJob(row: Record<string, any>): Job {
  return {
    id: String(row.id),
    title: row.title ?? "",
    company: row.company ?? "",
    location: row.location ?? "",
    routeType: row.route_type ?? "",
    equipment: row.equipment ?? "",
    experienceRequired: row.experience_required ?? "",
    truckInfo: row.truck_info ?? "",
    payRate: row.pay_rate ?? "",
    payPeriod: row.pay_period ?? "",
    homeTime: row.home_time ?? "",
    description: row.description ?? "",
    benefits: Array.isArray(row.benefits) ? row.benefits : [],
    requirements: Array.isArray(row.requirements) ? row.requirements : [],
    featured: row.featured ?? false,
    badge: row.badge ?? undefined,
    postedAt: row.created_at ? timeAgo(row.created_at) : "Recently",
    createdAt: row.created_at ?? null,
    // Aggregation fields
    isAggregated: !!row.is_aggregated,
    sourceCarrier: row.source_carrier ?? undefined,
    externalApplyUrl: row.external_apply_url ?? undefined,
  };
}

function timeAgo(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "1 month ago";
  return `${diffMonths} months ago`;
}
