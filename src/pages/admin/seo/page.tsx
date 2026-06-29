import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const STATE_PAGES = [
  { slug: "texas",          label: "Texas",          abbr: "TX" },
  { slug: "florida",        label: "Florida",         abbr: "FL" },
  { slug: "georgia",        label: "Georgia",         abbr: "GA" },
  { slug: "illinois",       label: "Illinois",        abbr: "IL" },
  { slug: "pennsylvania",   label: "Pennsylvania",    abbr: "PA" },
  { slug: "ohio",           label: "Ohio",            abbr: "OH" },
  { slug: "mississippi",    label: "Mississippi",     abbr: "MS" },
  { slug: "indiana",        label: "Indiana",         abbr: "IN" },
  { slug: "north-carolina", label: "North Carolina",  abbr: "NC" },
  { slug: "alabama",        label: "Alabama",         abbr: "AL" },
  { slug: "virginia",       label: "Virginia",        abbr: "VA" },
  { slug: "california",     label: "California",      abbr: "CA" },
  { slug: "tennessee",      label: "Tennessee",       abbr: "TN" },
  { slug: "south-carolina", label: "South Carolina",  abbr: "SC" },
  { slug: "new-jersey",     label: "New Jersey",      abbr: "NJ" },
  { slug: "wisconsin",      label: "Wisconsin",       abbr: "WI" },
  { slug: "new-york",       label: "New York",        abbr: "NY" },
  { slug: "maryland",       label: "Maryland",        abbr: "MD" },
  { slug: "louisiana",      label: "Louisiana",       abbr: "LA" },
];

const EQUIPMENT_PAGES = [
  { slug: "dry-van",  label: "Dry Van"  },
  { slug: "flatbed",  label: "Flatbed"  },
  { slug: "reefer",   label: "Reefer"   },
  { slug: "tanker",   label: "Tanker"   },
];

interface PageStat {
  slug: string;
  label: string;
  type: "state" | "equipment";
  count: number;
}

export default function SeoPages() {
  const [stats, setStats] = useState<PageStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalJobs, setTotalJobs] = useState(0);

  useEffect(() => {
    // Fetch all jobs once and derive counts
    fetch("/api/jobs?status=eq.active&limit=2000")
      .then((r) => r.json())
      .then((jobs: any[]) => {
        if (!Array.isArray(jobs)) return;
        setTotalJobs(jobs.length);

        const stateStats: PageStat[] = STATE_PAGES.map((p) => ({
          slug: p.slug,
          label: p.label,
          type: "state",
          count: jobs.filter((j) => j.state === p.abbr || j.state === p.label).length,
        }));

        const eqStats: PageStat[] = EQUIPMENT_PAGES.map((p) => ({
          slug: p.slug,
          label: p.label,
          type: "equipment",
          count: jobs.filter((j) => j.equipment === p.label).length,
        }));

        setStats([...eqStats, ...stateStats]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const DOMAIN = "https://truckdriverjobs.co";
  const sitemapUrl = `${DOMAIN}/sitemap.xml`;

  const copyUrls = () => {
    const urls = stats.map((s) => `${DOMAIN}/cdl-jobs/${s.slug}`).join("\n");
    navigator.clipboard.writeText(urls);
  };

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-text">SEO Landing Pages</h1>
          <p className="mt-1 text-sm text-brand-text-secondary">
            {stats.length} live programmatic pages · {totalJobs} total active jobs indexed
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={copyUrls}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text transition-colors hover:border-brand-orange hover:text-brand-orange whitespace-nowrap">
            <i className="ri-file-copy-line mr-1.5" />Copy All URLs
          </button>
          <a href={sitemapUrl} target="_blank" rel="noopener noreferrer"
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text transition-colors hover:border-brand-orange hover:text-brand-orange whitespace-nowrap">
            <i className="ri-external-link-line mr-1.5" />Sitemap
          </a>
        </div>
      </div>

      {/* Google Search Console CTA */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <i className="ri-google-line mt-0.5 text-amber-600 text-lg" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Submit to Google Search Console</p>
            <p className="mt-0.5 text-xs text-amber-700">
              Go to{" "}
              <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer"
                className="underline font-medium">search.google.com/search-console</a>
              {" "}→ Sitemaps → Submit:{" "}
              <code className="rounded bg-amber-100 px-1 font-mono text-amber-800">{sitemapUrl}</code>
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Equipment pages */}
          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-text-muted">
              Equipment Type Pages ({EQUIPMENT_PAGES.length})
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stats.filter((s) => s.type === "equipment").map((s) => (
                <PageCard key={s.slug} stat={s} domain={DOMAIN} />
              ))}
            </div>
          </div>

          {/* State pages */}
          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-text-muted">
              State Pages ({STATE_PAGES.length})
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stats.filter((s) => s.type === "state").sort((a, b) => b.count - a.count).map((s) => (
                <PageCard key={s.slug} stat={s} domain={DOMAIN} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PageCard({ stat, domain }: { stat: PageStat; domain: string }) {
  const url = `/cdl-jobs/${stat.slug}`;
  const isStrong = stat.count >= 10;
  const isOk = stat.count >= 3;

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-brand-text">{stat.label}</p>
          <p className="mt-0.5 text-xs text-brand-text-muted font-mono">/cdl-jobs/{stat.slug}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
          isStrong ? "bg-green-50 text-green-700" :
          isOk    ? "bg-amber-50 text-amber-700" :
                    "bg-red-50 text-red-600"
        }`}>
          {stat.count} jobs
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        <Link to={url}
          className="flex-1 rounded-lg border border-brand-border py-1.5 text-center text-xs font-semibold text-brand-text transition-colors hover:border-brand-orange hover:text-brand-orange">
          Preview
        </Link>
        <a href={`${domain}${url}`} target="_blank" rel="noopener noreferrer"
          className="flex-1 rounded-lg border border-brand-border py-1.5 text-center text-xs font-semibold text-brand-text transition-colors hover:border-brand-orange hover:text-brand-orange">
          Live <i className="ri-external-link-line" />
        </a>
      </div>
    </div>
  );
}
