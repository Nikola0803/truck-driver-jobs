import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/feature/Navbar";
import Footer from "@/components/feature/Footer";
import GoogleReviews from "@/components/feature/GoogleReviews";
import SeoHead from "@/components/feature/SeoHead";
import { supabase } from "@/lib/supabase";
import SITE_URL from "@/lib/siteUrl";
import { dbJobToJob } from "@/lib/jobMapper";
import type { Job } from "@/mocks/jobs";

interface BlogPostPreview {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  read_time: string;
  published_at: string;
  image_url: string | null;
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchEquipment, setSearchEquipment] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [blogPosts, setBlogPosts] = useState<BlogPostPreview[]>([]);
  const [blogLoading, setBlogLoading] = useState(true);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [totalJobCount, setTotalJobCount] = useState(0);

  useEffect(() => {
    async function fetchJobs() {
      const [featuredRes, countRes] = await Promise.all([
        supabase
          .from("jobs")
          .select("*")
          .eq("status", "active")
          .eq("featured", true)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
      ]);
      if (featuredRes.data) setFeaturedJobs(featuredRes.data.map(dbJobToJob));
      if (countRes.count !== null) setTotalJobCount(countRes.count);
    }
    fetchJobs();
  }, []);

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, category, read_time, published_at, image_url")
        .order("published_at", { ascending: false })
        .limit(3);
      if (!error && data) {
        setBlogPosts(data as BlogPostPreview[]);
      }
      setBlogLoading(false);
    }
    fetchPosts();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchEquipment) params.set("equipment", searchEquipment);
    if (searchLocation) params.set("location", searchLocation);
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text">
      <SeoHead
        title="High-Paying CDL Trucking Jobs Across America - Apply in 30 Seconds"
        description="Find vetted, high-paying CDL Class A trucking jobs across all 48 contiguous states. Company drivers, owner-operators, and teams welcome. No resume needed. Apply in 30 seconds. 72-hour recruiter callback guarantee."
        keywords="CDL jobs, trucking jobs, truck driver jobs, Class A CDL, OTR jobs, owner-operator jobs, trucking careers, driver recruiting"
        canonicalUrl={SITE_URL}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "TruckDriverJobs.co",
            "url": SITE_URL,
            "description": "CDL truck driver recruiting platform connecting Class A drivers with verified carriers across the United States.",
            "foundingDate": "2016",
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+1-855-555-8785",
              "contactType": "customer service",
              "areaServed": "US",
              "availableLanguage": ["English", "Spanish", "Serbian", "Croatian", "Bosnian"]
            },
            "areaServed": { "@type": "Country", "name": "United States" }
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": featuredJobs.map((job, i) => ({
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
                "url": `${SITE_URL}/jobs/${job.id}`
              }
            }))
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "TruckDriverJobs.co",
            "url": SITE_URL,
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${SITE_URL}/jobs?equipment={equipment}&location={location}`
              },
              "query-input": "required name=equipment"
            }
          }
        ]}
      />
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute -right-24 -top-24 h-[500px] w-[500px] rounded-full bg-brand-orange/5 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-[400px] w-[400px] rounded-full bg-brand-orange/5 blur-3xl" />

        <div className="relative z-10">
          <Navbar />

          <div className="mx-auto max-w-7xl px-6 pb-12 pt-6 md:px-10 md:pb-16 md:pt-10">
            <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center">
              {/* Left */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mx-auto lg:mx-0 mb-5 inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface px-4 py-2">
                  <span className="h-2 w-2 rounded-full bg-brand-orange" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand-text-secondary">
                    {totalJobCount} CDL jobs across America &middot; Updated today
                  </span>
                </div>

                <h1 className="font-heading text-4xl font-bold leading-[1.05] tracking-tight text-brand-text md:text-5xl lg:text-6xl">
                  CDL Trucking Jobs
                  <br />
                  <span className="text-brand-orange">From Coast to Coast.</span>
                </h1>

                <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-brand-text-secondary md:text-lg lg:mx-0">
                  Browse high-paying CDL Class A positions. Company drivers, owner-operators, and teams welcome.
                  Apply in 30 seconds after free signup.
                </p>

                {/* Search / Lead Capture Widget */}
                <form
                  onSubmit={handleSearch}
                  className="mx-auto mt-8 w-full max-w-3xl rounded-2xl border border-brand-border bg-brand-surface p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted">
                        Equipment Type
                      </label>
                      <select
                        value={searchEquipment}
                        onChange={(e) => setSearchEquipment(e.target.value)}
                        className="w-full h-10 rounded-lg border border-brand-border bg-brand-bg px-3 text-sm text-brand-text outline-none transition-colors focus:border-brand-orange"
                      >
                        <option value="">All Equipment</option>
                        <option value="Dry Van">Dry Van</option>
                        <option value="Reefer">Reefer</option>
                        <option value="Flatbed">Flatbed</option>
                        <option value="Step Deck">Step Deck</option>
                        <option value="Tanker">Tanker</option>
                        <option value="Chassis">Chassis / Container</option>
                      </select>
                    </div>

                    <div className="hidden sm:block h-10 w-px bg-brand-border self-end" />

                    <div className="flex-[1.5]">
                      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted">
                        City, State or ZIP
                      </label>
                      <input
                        type="text"
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                        placeholder="e.g. Chicago, IL"
                        className="w-full h-10 rounded-lg border border-brand-border bg-brand-bg px-3 text-sm text-brand-text placeholder-brand-text-muted outline-none transition-colors focus:border-brand-orange"
                      />
                    </div>

                    <button
                      type="submit"
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-brand-orange px-6 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-orange-hover sm:w-auto whitespace-nowrap"
                    >
                      SEARCH JOBS
                    </button>
                  </div>
                </form>

                {/* Trust micro-bar */}
                <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-4 lg:mx-0 lg:justify-start">
                  <span className="inline-flex items-center gap-1 text-xs text-brand-text-muted">
                    <i className="ri-shield-check-line text-brand-orange" />
                    Verified Carriers Only
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-brand-text-muted">
                    <i className="ri-flashlight-line text-brand-orange" />
                    72h Callback Guarantee
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-brand-text-muted">
                    <i className="ri-global-line text-brand-orange" />
                    Bilingual Recruiters
                  </span>
                </div>

                {/* AI Match CTA */}
                <div className="mx-auto mt-6 flex max-w-3xl items-center gap-4 rounded-2xl border border-brand-orange/30 bg-gradient-to-r from-brand-orange/10 to-brand-orange-light/30 px-5 py-4 lg:mx-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-orange">
                    <i className="ri-robot-2-line text-lg text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-brand-text">Try our AI Job Matching</p>
                    <p className="text-xs text-brand-text-secondary">Answer 3 quick screens. AI finds your best-fit jobs. Apply to all with one click.</p>
                  </div>
                  <Link
                    to="/match"
                    className="shrink-0 rounded-xl bg-brand-orange px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-orange-hover whitespace-nowrap"
                  >
                    Get Matched
                  </Link>
                </div>
              </div>

              {/* Right Image */}
              <div className="relative flex-1 max-w-md lg:max-w-lg">
                <div className="absolute inset-0 -z-10 translate-x-4 translate-y-4 rounded-3xl border-2 border-brand-orange/20" />
                <div className="absolute -bottom-8 -left-8 -z-10 h-32 w-32 rounded-full bg-brand-orange/10 blur-2xl" />
                <img
                  src="https://readdy.ai/api/search-image?query=A%20modern%20sleek%20American%20semi%20truck%20driving%20on%20a%20wide%20open%20highway%20during%20bright%20golden%20hour%20warm%20amber%20sunlight%20clean%20minimal%20sky%20with%20soft%20clouds%20professional%20automotive%20photography%20crisp%20sharp%20details%20vibrant%20warm%20color%20palette%20with%20orange%20and%20cream%20tones%20optimistic%20mood%20side%20angle%20view%20high%20resolution%20commercial%20style%20no%20text&width=700&height=500&seq=truck-bright-hero-01&orientation=landscape"
                  alt="Modern semi truck on highway"
                  className="relative z-10 h-[300px] w-full rounded-2xl object-cover md:h-[400px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED JOBS PREVIEW — SEO Directory Style */}
      <section id="jobs" className="bg-brand-surface px-6 py-14 md:px-10 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-brand-orange">
                Featured Positions
              </span>
              <h2 className="font-heading text-3xl font-bold text-brand-text md:text-4xl">
                Browse <span className="text-brand-orange">CDL Jobs</span>
              </h2>
              <p className="mt-2 max-w-xl text-sm text-brand-text-secondary">
                {totalJobCount} vetted trucking positions from top carriers across the United States.
                Sign up to unlock full details and apply instantly.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!user && (
                <Link
                  to="/signup"
                  className="rounded-lg border border-brand-orange px-4 py-2 text-sm font-semibold text-brand-orange transition-colors hover:bg-brand-orange hover:text-white whitespace-nowrap"
                >
                  Sign Up to View All
                </Link>
              )}
            </div>
          </div>

          {/* Job Preview Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredJobs.map((job) => (
              <div
                key={job.id}
                className="group flex flex-col rounded-xl border border-brand-border bg-brand-bg p-5 transition-all hover:-translate-y-0.5 hover:border-brand-orange/30"
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-orange-light">
                    <i className="ri-truck-line text-lg text-brand-orange" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-brand-text md:text-base">
                      {job.title}
                    </h3>
                    <p className="text-xs text-brand-text-secondary">
                      {job.location}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-brand-surface px-3 py-1 text-xs font-medium text-brand-text-secondary border border-brand-border">
                    {job.routeType}
                  </span>
                  <span className="rounded-full bg-brand-surface px-3 py-1 text-xs font-medium text-brand-text-secondary border border-brand-border">
                    {job.equipment}
                  </span>
                  <span className="rounded-full bg-brand-surface px-3 py-1 text-xs font-medium text-brand-text-secondary border border-brand-border">
                    {job.homeTime}
                  </span>
                </div>

                {/* Locked info teaser */}
                <div className="mt-4 rounded-lg bg-brand-orange-light p-3">
                  <div className="flex items-center gap-2">
                    <i className="ri-lock-line text-brand-orange text-sm" />
                    <span className="text-xs font-medium text-brand-orange">
                      Full details locked
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-brand-text-secondary">
                    Sign up to see company name, benefits, requirements, and apply in 30 seconds.
                  </p>
                </div>

                {/* Footer CTA */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-brand-text-muted">{job.postedAt}</span>
                  {user ? (
                    <Link
                      to={`/jobs/${job.id}`}
                      className="rounded-lg bg-brand-orange px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-orange-hover whitespace-nowrap"
                    >
                      View Details
                    </Link>
                  ) : (
                    <Link
                      to="/signup"
                      className="rounded-lg bg-brand-orange px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-orange-hover whitespace-nowrap"
                    >
                      Sign Up to Apply
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* View all CTA */}
          <div className="mt-10 text-center">
            {user ? (
              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 rounded-lg border border-brand-border px-6 py-3 text-sm font-semibold text-brand-text transition-colors hover:border-brand-orange hover:text-brand-orange"
              >
                View All Jobs
                <i className="ri-arrow-right-line" />
              </Link>
            ) : (
              <div className="rounded-2xl border border-brand-border bg-brand-bg p-6">
                <p className="text-sm font-semibold text-brand-text">
                  Want to see all {totalJobCount} positions?
                </p>
                <p className="mt-1 text-sm text-brand-text-secondary">
                  Create a free profile to unlock the full job board and get matched with carriers.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Link
                    to="/signup"
                    className="rounded-lg bg-brand-orange px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-orange-hover whitespace-nowrap"
                  >
                    Create Free Profile
                  </Link>
                  <Link
                    to="/login"
                    className="rounded-lg border border-brand-border px-6 py-2.5 text-sm font-semibold text-brand-text transition-colors hover:border-brand-orange hover:text-brand-orange whitespace-nowrap"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* OWNER-OPERATOR SECTION */}
      <section className="bg-brand-bg px-6 py-14 md:px-10 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-brand-orange">
                Owner-Operators
              </span>
              <h2 className="font-heading text-3xl font-bold text-brand-text md:text-4xl">
                Run Your Own Truck.
                <br />
                <span className="text-brand-orange">Keep More of the Money.</span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-brand-text-secondary">
                We partner with top lease-on programs and direct shippers looking for independent owner-operators.
                Get percentage pay, fuel surcharge, and direct freight without the broker middleman.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { icon: "ri-percent-line", title: "82% of Line Haul", desc: "Top percentage pay in the industry" },
                  { icon: "ri-gas-station-line", title: "Fuel Surcharge", desc: "Paid on every loaded mile" },
                  { icon: "ri-bill-line", title: "No Forced Dispatch", desc: "Self-dispatch or choose your loads" },
                  { icon: "ri-shield-check-line", title: "Base Plate Included", desc: "IFTA, permits, and insurance help" },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border border-brand-border bg-brand-surface p-4">
                    <div className="flex items-center gap-2">
                      <i className={`${item.icon} text-brand-orange`} />
                      <span className="text-sm font-semibold text-brand-text">{item.title}</span>
                    </div>
                    <p className="mt-1 text-xs text-brand-text-secondary">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3">
                <Link
                  to="/signup"
                  className="rounded-lg bg-brand-orange px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-orange-hover whitespace-nowrap"
                >
                  Get Owner-Op Leads
                </Link>
                <Link
                  to="/blog"
                  className="rounded-lg border border-brand-border px-6 py-3 text-sm font-semibold text-brand-text transition-colors hover:border-brand-orange hover:text-brand-orange whitespace-nowrap"
                >
                  Read O/O Guide
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 -z-10 translate-x-4 translate-y-4 rounded-3xl border-2 border-brand-orange/20" />
              <img
                src="https://readdy.ai/api/search-image?query=A%20large%20black%20American%20semi%20truck%20with%20chrome%20details%20parked%20at%20a%20scenic%20truck%20stop%20at%20golden%20hour%20warm%20amber%20sunlight%20professional%20automotive%20photography%20owner-operator%20style%20truck%20with%20sleeper%20cab%20clean%20background%20high%20resolution%20sharp%20details%20warm%20orange%20and%20cream%20tones&width=600&height=450&seq=owner-op-truck-01&orientation=landscape"
                alt="Owner-operator semi truck"
                className="relative z-10 h-[300px] w-full rounded-2xl object-cover md:h-[400px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* WHY SIGN UP SECTION */}
      <section className="bg-brand-surface px-6 py-14 md:px-10 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-brand-orange">
              How It Works
            </span>
            <h2 className="font-heading text-3xl font-bold text-brand-text md:text-4xl">
              Three Steps to Your Next Job
            </h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create Your Profile",
                desc: "Tell us your CDL, experience, and preferences. Takes 2 minutes.",
                icon: "ri-user-add-line",
              },
              {
                step: "02",
                title: "We Match You",
                desc: "Our recruiters review your profile and match you with vetted carriers.",
                icon: "ri-links-line",
              },
              {
                step: "03",
                title: "Get Hired Fast",
                desc: "Interview within 72 hours. Most drivers get hired within 1 week.",
                icon: "ri-briefcase-line",
              },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-brand-border bg-brand-bg p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange-light">
                  <i className={`${item.icon} text-2xl text-brand-orange`} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">{item.step}</span>
                <h3 className="mt-2 font-heading text-lg font-bold text-brand-text">{item.title}</h3>
                <p className="mt-2 text-sm text-brand-text-secondary">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GOOGLE REVIEWS */}
      <GoogleReviews />

      {/* LATEST BLOG POSTS */}
      <section className="bg-brand-bg px-6 py-14 md:px-10 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-brand-orange">
                From the Dispatch
              </span>
              <h2 className="font-heading text-3xl font-bold text-brand-text md:text-4xl">
                Latest <span className="text-brand-orange">Articles</span>
              </h2>
              <p className="mt-2 max-w-lg text-sm text-brand-text-secondary">
                Real talk for CDL drivers. Career guides, salary breakdowns, and regulation updates.
              </p>
            </div>
            <Link
              to="/blog"
              className="hidden items-center gap-1 rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text transition-colors hover:border-brand-orange hover:text-brand-orange sm:inline-flex whitespace-nowrap"
            >
              View All Articles
              <i className="ri-arrow-right-line" />
            </Link>
          </div>

          {blogLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-border border-t-brand-orange" />
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="rounded-2xl border border-brand-border bg-brand-surface p-8 text-center">
              <p className="text-sm text-brand-text-secondary">Articles coming soon. Check back later.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {blogPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-brand-border bg-brand-surface transition-all hover:-translate-y-0.5 hover:border-brand-orange/30"
                >
                  {post.image_url && (
                    <div className="h-44 w-full overflow-hidden">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="rounded-full bg-brand-orange-light px-3 py-1 text-xs font-medium text-brand-orange">
                        {post.category}
                      </span>
                      <span className="text-xs text-brand-text-muted">
                        {post.read_time}
                      </span>
                    </div>
                    <h3 className="font-heading text-base font-bold text-brand-text transition-colors group-hover:text-brand-orange md:text-lg">
                      {post.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-text-secondary">
                      {post.excerpt}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-brand-text-muted">
                      <i className="ri-calendar-line" />
                      {new Date(post.published_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6 text-center sm:hidden">
            <Link
              to="/blog"
              className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text transition-colors hover:border-brand-orange hover:text-brand-orange whitespace-nowrap"
            >
              View All Articles
              <i className="ri-arrow-right-line" />
            </Link>
          </div>
        </div>
      </section>

      {/* 72h Disclaimer */}
      <div className="border-t border-brand-border bg-brand-surface px-6 py-4 md:px-10">
        <p className="mx-auto max-w-7xl text-[11px] leading-relaxed text-brand-text-muted">
          <sup>*</sup>72-hour placement applies to qualified CDL-A holders with a clean MVR record. Timeline may vary based on position availability in your area and carrier acceptance requirements. TruckDriverJobs.co is a driver recruiting platform and does not guarantee employment. By submitting your information, you consent to be contacted by TruckDriverJobs.co and its carrier partners via phone, text, or email regarding CDL job opportunities. Standard message and data rates may apply. Reply STOP to opt out.
        </p>
      </div>

      <Footer />
    </div>
  );
}