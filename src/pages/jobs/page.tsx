import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/feature/Navbar";
import Footer from "@/components/feature/Footer";
import SeoHead from "@/components/feature/SeoHead";
import JobCard from "@/components/feature/JobCard";
import ApplyModal from "@/components/feature/ApplyModal";
import CategoryChips from "@/pages/home/components/CategoryChips";
import JobFilters from "@/pages/home/components/JobFilters";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/db";
import SITE_URL from "@/lib/siteUrl";
import { dbJobToJob } from "@/lib/jobMapper";
import type { Job } from "@/mocks/jobs";

export default function JobsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("relevance");
  const [applyJobId, setApplyJobId] = useState("");
  const [applyOpen, setApplyOpen] = useState(false);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState<Set<number>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const [visibleCount, setVisibleCount] = useState(24);
  const [filters, setFilters] = useState({
    routeType: [] as string[],
    equipment: [] as string[],
    experience: [] as string[],
    homeTime: [] as string[],
  });

  // Fetch all active jobs from Supabase
  useEffect(() => {
    db
      .from("jobs")
      .select("*")
      .eq("status", "active")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAllJobs((data ?? []).map(dbJobToJob));
        setJobsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchUserData = async () => {
      const [savedRes, appsRes] = await Promise.all([
        db.from("saved_jobs").select("job_id").eq("user_id", user.id),
        db.from("applications").select("job_id").eq("user_id", user.id),
      ]);
      setSavedJobIds(new Set((savedRes.data ?? []).map((s) => s.job_id)));
      setAppliedJobIds(new Set((appsRes.data ?? []).map((a) => a.job_id)));
      setLoading(false);
    };
    fetchUserData();
  }, [user]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allJobs.length };
    const categories = [
      "Dry Van", "Reefer", "Flatbed", "Step Deck", "Tanker",
      "Local", "OTR", "Regional", "Dedicated", "Team",
    ];
    categories.forEach((cat) => {
      counts[cat] = allJobs.filter((j) =>
        j.equipment.includes(cat) || j.routeType === cat || j.title.includes(cat)
      ).length;
    });
    return counts;
  }, [allJobs]);

  const filteredJobs = useMemo(() => {
    let result = [...allJobs];

    if (activeCategory !== "All") {
      result = result.filter(
        (j) =>
          j.equipment.includes(activeCategory) ||
          j.routeType === activeCategory ||
          j.title.includes(activeCategory)
      );
    }

    if (filters.routeType.length > 0) {
      result = result.filter((j) => filters.routeType.includes(j.routeType));
    }
    if (filters.equipment.length > 0) {
      result = result.filter((j) =>
        filters.equipment.some((e) => j.equipment.includes(e))
      );
    }
    if (filters.experience.length > 0) {
      result = result.filter((j) => filters.experience.includes(j.experienceRequired));
    }
    if (filters.homeTime.length > 0) {
      result = result.filter((j) => filters.homeTime.includes(j.homeTime));
    }

    if (sortBy === "newest") {
      const priority: Record<string, number> = {
        "Posted today": 0,
        "Posted 2 days ago": 1,
        "Posted 3 days ago": 2,
        "Posted 4 days ago": 3,
        "Posted 5 days ago": 4,
        "Posted 6 days ago": 5,
        "Posted 1 week ago": 6,
      };
      result.sort((a, b) => (priority[a.postedAt] ?? 99) - (priority[b.postedAt] ?? 99));
    }

    return result;
  }, [allJobs, activeCategory, filters, sortBy]);

  // Reset pagination when filters change
  const setFiltersAndReset = (f: typeof filters) => { setFilters(f); setVisibleCount(24); };
  const setCategoryAndReset = (c: string) => { setActiveCategory(c); setVisibleCount(24); };
  const setSortAndReset = (s: string) => { setSortBy(s); setVisibleCount(24); };

  const visibleJobs = filteredJobs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredJobs.length;

  const handleQuickApply = (jobId: string) => {
    setApplyJobId(jobId);
    setApplyOpen(true);
  };

  const handleSave = (jobId: string) => {
    const numId = Number(jobId);
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(numId)) next.delete(numId);
      else next.add(numId);
      return next;
    });
  };

  const handleApplySuccess = (jobId: string) => {
    setAppliedJobIds((prev) => new Set(prev).add(Number(jobId)));
    setApplyOpen(false);
  };

  if (jobsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-bg">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-border border-t-brand-orange" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text">
      <SeoHead
        title="All CDL Trucking Jobs - Browse 450+ Vetted Positions"
        description="Browse our complete directory of vetted CDL Class A trucking jobs. Filter by equipment type, route type, experience level, and home time. Company drivers, owner-operators, and teams. Apply in 30 seconds."
        keywords="CDL jobs directory, trucking jobs list, Class A CDL openings, OTR positions, regional trucking jobs, dedicated route jobs"
        canonicalUrl={`${SITE_URL}/jobs`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "itemListElement": filteredJobs.map((job, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "item": {
              "@type": "JobPosting",
              "title": job.title,
              "datePosted": job.createdAt ? job.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
              "description": job.description,
              "employmentType": "FULL_TIME",
              "hiringOrganization": { "@type": "Organization", "name": job.company },
              "jobLocation": { "@type": "Place", "address": { "@type": "PostalAddress", "addressLocality": job.location } },
              "occupationalCategory": job.equipment,
              "url": `${SITE_URL}/jobs/${job.slug}`
            }
          }))
        }}
      />
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-12">
        <div className="mb-6">
          <h1 className="font-heading text-3xl font-bold text-brand-text md:text-4xl">
            All <span className="text-brand-orange">CDL Jobs</span>
          </h1>
          <p className="mt-2 text-sm text-brand-text-secondary">
            Browse all {allJobs.length} vetted positions. Use filters to find your perfect match.
          </p>
        </div>

        <CategoryChips
          activeCategory={activeCategory}
          onChange={setCategoryAndReset}
          counts={categoryCounts}
        />

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="w-full shrink-0 lg:w-64">
            <JobFilters jobs={allJobs} activeFilters={filters} onChange={setFiltersAndReset} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-brand-text-secondary">
                Showing <span className="font-bold text-brand-text">{visibleJobs.length}</span> of <span className="font-bold text-brand-text">{filteredJobs.length}</span> CDL jobs
              </p>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-brand-text-muted">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortAndReset(e.target.value)}
                  className="rounded-lg border border-brand-border bg-brand-surface px-3 py-1.5 text-sm text-brand-text outline-none focus:border-brand-orange"
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="rounded-2xl border border-brand-border bg-brand-surface p-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange-light">
                  <i className="ri-search-line text-2xl text-brand-orange" />
                </div>
                <h3 className="text-lg font-bold text-brand-text">No jobs match your filters</h3>
                <p className="mt-2 text-sm text-brand-text-secondary">
                  Try adjusting your filters or clearing the search to see all positions.
                </p>
                <button
                  onClick={() => {
                    setActiveCategory("All");
                    setFilters({ routeType: [], equipment: [], experience: [], homeTime: [] });
                  }}
                  className="mt-4 rounded-lg bg-brand-orange px-5 py-2 text-sm font-bold text-white hover:bg-brand-orange-hover"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-4">
                  {visibleJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onApply={handleQuickApply}
                      onSave={handleSave}
                      isSaved={savedJobIds.has(Number(job.id))}
                      isApplied={appliedJobIds.has(Number(job.id))}
                    />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => setVisibleCount((n) => n + 24)}
                      className="rounded-lg border border-brand-border bg-brand-surface px-8 py-3 text-sm font-semibold text-brand-text transition-colors hover:border-brand-orange hover:text-brand-orange"
                    >
                      Load More Jobs ({filteredJobs.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ApplyModal
        jobId={applyJobId}
        isOpen={applyOpen}
        onClose={() => setApplyOpen(false)}
        onSuccess={handleApplySuccess}
      />

      <Footer />
    </div>
  );
}