/**
 * Generates an SEO-friendly URL slug for a job.
 * Format: `{id}-{title}-at-{company}` (lowercased, non-alphanum → hyphens)
 *
 * Examples:
 *   16 + "OTR Dry Van Driver" + "Werner Enterprises"
 *   → "16-otr-dry-van-driver-at-werner-enterprises"
 *
 * The numeric ID prefix means the frontend can always extract the DB id via
 * `parseInt(slug)` without a separate lookup.
 */
export function toJobSlug(id: string | number, title: string, company: string): string {
  const text = `${title}-at-${company}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${id}-${text}`;
}
