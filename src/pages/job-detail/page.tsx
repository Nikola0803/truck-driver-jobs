import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/feature/Navbar";
import Footer from "@/components/feature/Footer";
import SeoHead from "@/components/feature/SeoHead";
import ApplyModal from "@/components/feature/ApplyModal";
import SITE_URL from "@/lib/siteUrl";
import { dbJobToJob } from "@/lib/jobMapper";
import type { Job } from "@/mocks/jobs";
import { toJobSlug } from "@/lib/jobSlug";

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [applyOpen, setApplyOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [externalUnlocked, setExternalUnlocked] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);

  // Fetch job from local API
  useEffect(() => {
    if (!id) return;
    supabase
      .from("jobs")
      .select("*")
      .eq("id", parseInt(id, 10))
      .maybeSingle()
      .then(({ data }) => {
        const mapped = data ? dbJobToJob(data) : null;
        setJob(mapped);
        setJobLoading(false);

        // Fetch similar jobs by equipment type
        if (mapped) {
          supabase
            .from("jobs")
            .select("*")
            .eq("equipment", mapped.equipment)
            .eq("status", "active")
            .limit(3)
            .then(({ data: simData }) => {
              const sims = (simData ?? [])
                .map(dbJobToJob)
                .filter((j) => j.id !== mapped.id)
                .slice(0, 2);
              setSimilarJobs(sims);
            });
        }
      });
  }, [id]);

  // Check if job is saved or applied
  useEffect(() => {
    if (!user || !id) return;
    const checkStatus = async () => {
      const numId = parseInt(id, 10);
      const [savedRes, appRes] = await Promise.all([
        supabase.from("saved_jobs").select("id").eq("user_id", user.id).eq("job_id", numId),
        supabase.from("applications").select("id").eq("user_id", user.id).eq("job_id", numId),
      ]);
      setSaved((savedRes.data ?? []).length > 0);
      setApplied((appRes.data ?? []).length > 0);
    };
    checkStatus();
  }, [user, id]);

  if (jobLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-bg">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
          <span className="text-sm text-brand-text-secondary">Loading...</span>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-brand-bg font-sans text-brand-text">
        <SeoHead title="Job Not Found" description="This trucking position has been filled or removed." />
        <Navbar />
        <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-bg">
            <i className="ri-error-warning-line text-3xl text-brand-orange" />
          </div>
          <h2 className="mt-6 font-heading text-2xl font-bold text-brand-text">
            Job Not Found
          </h2>
          <p className="mt-2 text-brand-text-secondary">
            This position has been filled or removed.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 rounded-lg bg-brand-orange px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-orange-hover"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const numId = parseInt(id!, 10);
      if (saved) {
        await supabase.from("saved_jobs").delete().eq("user_id", user.id).eq("job_id", numId);
        setSaved(false);
      } else {
        await supabase.from("saved_jobs").insert({ user_id: user.id, job_id: numId });
        setSaved(true);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleApplySuccess = () => {
    setApplied(true);
    setExternalUnlocked(true);
    setApplyOpen(false);
  };

  const highlights = [
    { icon: "ri-map-pin-line", label: "Route Type", value: job.routeType },
    { icon: "ri-truck-line", label: "Equipment", value: job.equipment },
    { icon: "ri-time-line", label: "Experience", value: job.experienceRequired },
    { icon: "ri-settings-line", label: "Truck", value: job.truckInfo },
  ];

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text">
      <SeoHead
        title={`${job.title} at ${job.company} | CDL Trucking Job`}
        description={`${job.title} at ${job.company} in ${job.location}. ${job.routeType} route, ${job.equipment} equipment, ${job.homeTime} home time. ${job.description.slice(0, 150)}`}
        keywords={`CDL job, trucking job, ${job.equipment}, ${job.routeType}, ${job.location}, Class A CDL, ${job.company}`}
        canonicalUrl={`${SITE_URL}/jobs/${job.slug}`}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": SITE_URL
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "CDL Jobs",
                "item": `${SITE_URL}/jobs`
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": `${job.title} - ${job.company}`
              }
            ]
          },
          {
            "@context": "https://schema.org",
            "@type": "JobPosting",
            "title": job.title,
            "datePosted": job.createdAt ? job.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
            "description": job.description,
            "employmentType": "FULL_TIME",
            "hiringOrganization": {
              "@type": "Organization",
              "name": job.company
            },
            "jobLocation": {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": job.location,
                "addressCountry": "US"
              }
            },
            "baseSalary": {
              "@type": "MonetaryAmount",
              "currency": "USD",
              "value": {
                "@type": "QuantitativeValue",
                "value": "competitive",
                "unitText": "YEAR"
              }
            },
            "occupationalCategory": job.equipment,
            "qualifications": job.requirements.join(", "),
            "jobBenefits": job.benefits.join(", "),
            "url": `${SITE_URL}/jobs/${job.slug}`
          }
        ]}
      />
      <Navbar />

      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-12">
        <button
          onClick={() => navigate("/")}
          className="mb-6 inline-flex items-center gap-1 text-sm text-brand-text-secondary transition-colors hover:text-brand-text"
        >
          <i className="ri-arrow-left-line" /> Back to all jobs
        </button>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* LEFT COLUMN */}
          <div>
            {/* Job Header */}
            <div className="rounded-2xl border border-brand-border bg-brand-surface p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-orange-light">
                  <i className="ri-truck-line text-2xl text-brand-orange" />
                </div>
                <div className="flex-1">
                  <h1 className="font-heading text-xl font-bold text-brand-text md:text-2xl">
                    {job.title}
                  </h1>
                  <p className="mt-1 text-sm text-brand-text-secondary">
                    {job.company} &middot; {job.location}
                  </p>
                </div>
              </div>

              {/* Established badge row */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded bg-brand-orange-light px-2 py-1 text-xs font-medium text-brand-orange">
                  <i className="ri-verified-badge-line" />
                  Vetted by TruckDriverJobs.co since 2016
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-brand-bg px-2 py-1 text-xs text-brand-text-muted">
                  <i className="ri-time-line" />
                  Position typically fills within 48 hours
                </span>
              </div>

              {/* Key Highlights Grid */}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {highlights.map((h) => (
                  <div
                    key={h.label}
                    className="rounded-lg bg-brand-bg p-3"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-brand-text-muted">
                      <i className={h.icon} />
                      {h.label}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-brand-text">
                      {h.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mt-6 rounded-2xl border border-brand-border bg-brand-surface p-6">
              <h2 className="font-heading text-lg font-bold text-brand-text">
                About This Position
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-brand-text-secondary">
                {job.description}
              </p>

              <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-brand-text">
                Benefits
              </h3>
              <ul className="mt-3 space-y-2">
                {job.benefits.map((benefit, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-brand-text-secondary"
                  >
                    <i className="ri-check-line mt-0.5 text-brand-orange" />
                    {benefit}
                  </li>
                ))}
              </ul>

              <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-brand-text">
                Requirements
              </h3>
              <ul className="mt-3 space-y-2">
                {job.requirements.map((req, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-brand-text-secondary"
                  >
                    <i className="ri-checkbox-blank-circle-fill mt-1.5 text-[6px] text-brand-text-muted" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT COLUMN - Sticky Sidebar */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-brand-border bg-brand-surface p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
                Position Details
              </p>
              <p className="font-heading mt-1 text-3xl font-extrabold text-brand-text">
                {job.routeType}
              </p>
              <p className="mt-1 text-xs text-brand-text-secondary">
                {job.equipment} &middot; {job.homeTime}
              </p>

              {/* Trust badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-600">
                  <i className="ri-shield-check-line" />
                  Verified Carrier
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-brand-orange-light px-2 py-1 text-xs font-medium text-brand-orange">
                  <i className="ri-flashlight-line" />
                  Fast Hire
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-600">
                  <i className="ri-global-line" />
                  Bilingual OK
                </span>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setApplyOpen(true)}
                  disabled={applied}
                  className={`flex-1 rounded-lg py-4 text-sm font-bold uppercase tracking-wide transition-colors ${
                    applied
                      ? "border border-green-200 bg-green-50 text-green-600 cursor-default"
                      : "bg-brand-orange text-white hover:bg-brand-orange-hover"
                  }`}
                >
                  {applied ? "Applied" : "Quick Apply (30 Sec)"}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex h-12 w-12 items-center justify-center rounded-lg border text-lg transition-colors ${
                    saved
                      ? "border-brand-orange bg-brand-orange-light text-brand-orange"
                      : "border-brand-border text-brand-text-muted hover:border-brand-orange hover:text-brand-orange"
                  }`}
                  title={saved ? "Unsave" : "Save job"}
                >
                  <i className={saved ? "ri-bookmark-fill" : "ri-bookmark-line"} />
                </button>
              </div>

              {/* For aggregated jobs — direct carrier link (gated until Quick Apply submitted) */}
              {job.isAggregated && job.externalApplyUrl && (
                externalUnlocked ? (
                  <a
                    href={job.externalApplyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-green-200 bg-green-50 py-2.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100"
                  >
                    <i className="ri-external-link-line" />
                    Also apply directly at {job.sourceCarrier ?? job.company}
                  </a>
                ) : (
                  <button
                    onClick={() => setApplyOpen(true)}
                    className="relative mt-2 flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-brand-border py-2.5 text-xs font-semibold text-brand-text-secondary"
                  >
                    {/* Blurred background text */}
                    <span className="absolute inset-0 flex items-center justify-center select-none blur-[3px] opacity-40 pointer-events-none">
                      <i className="ri-external-link-line mr-1" />
                      Also apply directly at {job.sourceCarrier ?? job.company}
                    </span>
                    {/* Lock overlay */}
                    <span className="relative z-10 flex items-center gap-1.5 text-brand-orange">
                      <i className="ri-lock-line" />
                      Quick Apply to unlock direct link
                    </span>
                  </button>
                )
              )}

              <p className="mt-3 text-center text-xs text-brand-text-muted">
                No resume needed. Just Class A CDL required.
              </p>

              {/* Guarantee micro-banner */}
              <div className="mt-4 rounded-lg border border-brand-orange/20 bg-brand-orange-light p-3">
                <div className="flex items-start gap-2">
                  <i className="ri-time-line mt-0.5 text-brand-orange" />
                  <p className="text-xs text-brand-text-secondary">
                    <span className="font-semibold text-brand-text">
                      72-Hour Guarantee:
                    </span>{" "}
                    Apply today and get a recruiter callback with matched
                    positions within 72 hours, or we will find you alternatives
                    at no cost. Our promise since 2016.
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-brand-border pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
                    <i className="ri-phone-line text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-text">
                      Call a Recruiter
                    </p>
                    <p className="text-xs text-brand-text-secondary">
                      (855) 555-TRUCK
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Trust mini stats */}
            <div className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="font-heading text-lg font-bold text-brand-text">
                    12,000+
                  </p>
                  <p className="text-xs text-brand-text-muted">Drivers Placed</p>
                </div>
                <div className="text-center">
                  <p className="font-heading text-lg font-bold text-brand-text">
                    15 min
                  </p>
                  <p className="text-xs text-brand-text-muted">Avg. Callback</p>
                </div>
              </div>
              <div className="mt-3 border-t border-brand-border pt-3 text-center">
                <p className="text-xs text-brand-text-muted">
                  <i className="ri-verified-badge-line mr-1 text-brand-orange" />
                  Trusted since 2016
                </p>
              </div>
            </div>

            {/* Similar Jobs */}
            <div className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-5">
              <h3 className="font-heading text-sm font-bold text-brand-text">
                Similar Positions
              </h3>
              <div className="mt-3 space-y-3">
                {similarJobs.map((similar) => (
                  <button
                    key={similar.id}
                    onClick={() => navigate(`/jobs/${similar.slug}`)}
                    className="w-full rounded-lg bg-brand-bg p-3 text-left transition-colors hover:bg-brand-orange-light"
                  >
                    <p className="text-sm font-semibold text-brand-text">
                      {similar.title}
                    </p>
                    <p className="mt-0.5 text-xs text-brand-text-secondary">
                      {similar.company} &middot; {similar.routeType}
                    </p>
                  </button>
                ))}
                {similarJobs.length === 0 && (
                  <p className="text-xs text-brand-text-muted">
                    No similar positions right now.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <ApplyModal
        jobId={job.id}
        jobTitle={job.title}
        jobCompany={job.company}
        isOpen={applyOpen}
        onClose={() => setApplyOpen(false)}
        onSuccess={handleApplySuccess}
      />

      <Footer />
    </div>
  );
}