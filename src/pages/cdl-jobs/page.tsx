import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/feature/Navbar";
import Footer from "@/components/feature/Footer";
import SeoHead from "@/components/feature/SeoHead";
import ApplyModal from "@/components/feature/ApplyModal";
import { dbJobToJob } from "@/lib/jobMapper";
import { resolveSlug } from "@/lib/seoSlugs";
import SITE_URL from "@/lib/siteUrl";
import type { Job } from "@/mocks/jobs";

export default function CdlJobsPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const resolved = resolveSlug(slug);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyJobId, setApplyJobId] = useState("");
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyTitle, setApplyTitle] = useState("");
  const [applyCompany, setApplyCompany] = useState("");

  useEffect(() => {
    if (!resolved) { setLoading(false); return; }
    const params = new URLSearchParams({ status: "eq.active", limit: "100" });
    if (resolved.type === "state") {
      params.set("state", `in.(${resolved.state.abbr},${resolved.state.name})`);
    } else {
      params.set("equipment", `eq.${resolved.equipment.dbValue}`);
    }
    fetch(`/api/jobs?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setJobs((Array.isArray(data) ? data : []).map(dbJobToJob));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (!resolved) {
    return (
      <div className="min-h-screen bg-brand-bg font-sans text-brand-text">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <h1 className="font-heading text-2xl font-bold">Page Not Found</h1>
          <Link to="/jobs" className="mt-4 text-brand-orange underline">Browse all CDL jobs</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isState = resolved.type === "state";
  const label = isState ? resolved.state.name : resolved.equipment.label;
  const pageTitle = isState
    ? `CDL Truck Driving Jobs in ${label}`
    : `${label} Truck Driving Jobs`;
  const metaDesc = isState
    ? `Find CDL truck driving jobs in ${label}. Browse ${jobs.length || "top"} active positions from verified carriers. Apply in 30 seconds — no resume needed.`
    : `Find ${label} CDL truck driving jobs across the US. Browse ${jobs.length || "top"} active ${label} positions. Apply in 30 seconds — no resume needed.`;
  const canonical = `${SITE_URL}/cdl-jobs/${slug}`;

  const handleApply = (job: Job) => {
    setApplyJobId(job.id);
    setApplyTitle(job.title);
    setApplyCompany(job.company);
    setApplyOpen(true);
  };

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text">
      <SeoHead
        title={pageTitle}
        description={metaDesc}
        keywords={`CDL jobs ${label}, truck driver jobs ${label}, ${isState ? label : ""} trucking jobs, Class A CDL ${label}`}
        canonicalUrl={canonical}
        jsonLd={[{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": pageTitle,
          "description": metaDesc,
          "url": canonical,
          "numberOfItems": jobs.length,
        }]}
      />
      <Navbar />

      <div className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-brand-text-muted">
          <Link to="/" className="hover:text-brand-orange">Home</Link>
          <i className="ri-arrow-right-s-line" />
          <Link to="/jobs" className="hover:text-brand-orange">CDL Jobs</Link>
          <i className="ri-arrow-right-s-line" />
          <span className="text-brand-text">{label}</span>
        </nav>

        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-orange-light px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-orange mb-3">
            <i className="ri-truck-line" />
            {isState ? "State" : "Equipment Type"}
          </div>
          <h1 className="font-heading text-3xl font-bold text-brand-text md:text-4xl lg:text-5xl">
            {pageTitle}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-brand-text-secondary">
            {loading ? "Loading positions..." : `${jobs.length} active position${jobs.length !== 1 ? "s" : ""} from verified carriers.`}
            {" "}No resume needed — apply in 30 seconds.
          </p>

          {/* Filter chips — link to other states/equipment */}
          {isState ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {["dry-van", "flatbed", "reefer", "tanker"].map((eq) => (
                <Link key={eq} to={`/cdl-jobs/${eq}`}
                  className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs font-medium text-brand-text-secondary transition-colors hover:border-brand-orange hover:text-brand-orange capitalize">
                  {eq.replace("-", " ")} jobs
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap gap-2">
              {[["texas","Texas"],["florida","Florida"],["georgia","Georgia"],["california","California"],["illinois","Illinois"]].map(([s, name]) => (
                <Link key={s} to={`/cdl-jobs/${s}`}
                  className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs font-medium text-brand-text-secondary transition-colors hover:border-brand-orange hover:text-brand-orange">
                  {name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Job list */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-brand-border bg-brand-surface p-12 text-center">
            <i className="ri-search-line text-4xl text-brand-text-muted" />
            <p className="mt-4 text-brand-text-secondary">No active positions in this category right now.</p>
            <Link to="/jobs" className="mt-4 inline-block rounded-lg bg-brand-orange px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-orange-hover">
              Browse All Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id}
                className="flex flex-col gap-4 rounded-xl border border-brand-border bg-brand-surface p-5 transition-all hover:border-brand-orange/30 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-orange-light">
                    <i className="ri-truck-line text-xl text-brand-orange" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-brand-text">
                      <Link to={`/jobs/${job.id}`} className="hover:text-brand-orange">{job.title}</Link>
                    </h2>
                    <p className="text-sm text-brand-text-secondary">{job.company} · {job.location}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-brand-bg px-2.5 py-0.5 text-xs text-brand-text-muted">{job.routeType}</span>
                      <span className="rounded-full bg-brand-bg px-2.5 py-0.5 text-xs text-brand-text-muted">{job.equipment}</span>
                      <span className="rounded-full bg-brand-bg px-2.5 py-0.5 text-xs text-brand-text-muted">{job.homeTime}</span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link to={`/jobs/${job.id}`}
                    className="rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text transition-colors hover:border-brand-orange hover:text-brand-orange">
                    Details
                  </Link>
                  <button onClick={() => handleApply(job)}
                    className="rounded-lg bg-brand-orange px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-orange-hover">
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        {!loading && jobs.length > 0 && (
          <div className="mt-10 rounded-2xl border border-brand-orange/20 bg-brand-orange-light p-6 text-center">
            <p className="font-heading text-lg font-bold text-brand-text">Not finding the right fit?</p>
            <p className="mt-1 text-sm text-brand-text-secondary">
              Use our AI Match wizard to get matched with carriers based on your experience and preferences.
            </p>
            <Link to="/match"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-orange px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-orange-hover">
              <i className="ri-robot-line" /> Find My Match
            </Link>
          </div>
        )}
      </div>

      <ApplyModal
        jobId={applyJobId}
        jobTitle={applyTitle}
        jobCompany={applyCompany}
        isOpen={applyOpen}
        onClose={() => setApplyOpen(false)}
        onSuccess={() => setApplyOpen(false)}
      />

      <Footer />
    </div>
  );
}
