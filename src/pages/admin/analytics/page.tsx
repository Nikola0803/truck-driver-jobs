import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

interface Lead {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  cdl_class: string;
  experience: string;
  route_type: string;
  equipment: string;
  states: string[];
  created_at: string;
  source?: string;
}

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  category: string;
  published_at: string;
  featured: boolean;
}

interface PlatformStats {
  totalJobs: number;
  activeJobs: number;
  totalLeads: number;
  leadsLast30: number;
  leadsLast7: number;
  blogPosts: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<PlatformStats>({
    totalJobs: 0, activeJobs: 0, totalLeads: 0, leadsLast30: 0, leadsLast7: 0, blogPosts: 0,
  });
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [gscUrl, setGscUrl] = useState(() => localStorage.getItem("gsc_property_url") || "");
  const [gscInput, setGscInput] = useState("");
  const [showGscSetup, setShowGscSetup] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const now = new Date();
        const ago30 = new Date(now); ago30.setDate(now.getDate() - 30);
        const ago7 = new Date(now); ago7.setDate(now.getDate() - 7);

        const [jobsRes, activeRes, leadsRes, blogRes] = await Promise.all([
          fetch("/api/jobs?count=exact&head=true"),
          fetch("/api/jobs?status=eq.active&count=exact&head=true"),
          fetch("/api/leads?order=created_at.desc&limit=100"),
          supabase.from("blog_posts").select("id, slug, title, category, published_at, featured").order("published_at", { ascending: false }),
        ]);

        const jobsData = await jobsRes.json().catch(() => ({}));
        const activeData = await activeRes.json().catch(() => ({}));
        const leadsData = await leadsRes.json().catch(() => []);

        const leads: Lead[] = Array.isArray(leadsData) ? leadsData : [];
        const leadsLast30 = leads.filter(l => new Date(l.created_at) >= ago30).length;
        const leadsLast7 = leads.filter(l => new Date(l.created_at) >= ago7).length;

        const posts = (blogRes.data || []) as BlogPost[];
        setBlogPosts(posts);
        setRecentLeads(leads.slice(0, 10));
        setStats({
          totalJobs: jobsData.count ?? 0,
          activeJobs: activeData.count ?? 0,
          totalLeads: leads.length,
          leadsLast30,
          leadsLast7,
          blogPosts: posts.length,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const saveGscUrl = () => {
    const url = gscInput.trim();
    if (!url) return;
    localStorage.setItem("gsc_property_url", url);
    setGscUrl(url);
    setGscInput("");
    setShowGscSetup(false);
  };

  const statCards = [
    { label: "Active Jobs", value: stats.activeJobs.toLocaleString(), sub: `${stats.totalJobs.toLocaleString()} total`, icon: "ri-briefcase-line", color: "orange" },
    { label: "Total Leads", value: stats.totalLeads.toLocaleString(), sub: `${stats.leadsLast30} in last 30 days`, icon: "ri-user-add-line", color: "green" },
    { label: "Leads This Week", value: stats.leadsLast7.toLocaleString(), sub: "last 7 days", icon: "ri-line-chart-line", color: "blue" },
    { label: "Blog Articles", value: stats.blogPosts.toLocaleString(), sub: "published", icon: "ri-article-line", color: "purple" },
  ];

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="font-heading text-2xl font-bold text-brand-text mb-8">Analytics</h1>
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-border border-t-brand-orange" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-text">Analytics</h1>
          <p className="mt-1 text-sm text-brand-text-secondary">Platform performance overview</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/leads" className="rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text hover:border-brand-orange hover:text-brand-orange">
            View All Leads
          </Link>
          <Link to="/admin/blog" className="rounded-lg bg-brand-orange px-4 py-2 text-sm font-bold text-white hover:bg-brand-orange-hover">
            Manage Blog
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-brand-border bg-brand-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted">{card.label}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-orange-light">
                <i className={`${card.icon} text-sm text-brand-orange`} />
              </div>
            </div>
            <p className="font-heading text-3xl font-bold text-brand-text">{card.value}</p>
            <p className="mt-1 text-xs text-brand-text-muted">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Recent Leads */}
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-sm font-bold text-brand-text">
              <i className="ri-user-line mr-2 text-brand-text-muted" />
              Recent Leads
            </h3>
            <Link to="/admin/leads" className="text-xs text-brand-orange hover:underline">View all →</Link>
          </div>

          {recentLeads.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-brand-text-muted">
              No leads yet. They'll appear here after drivers apply.
            </div>
          ) : (
            <div className="space-y-2">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between rounded-lg bg-brand-bg px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-text truncate">{lead.full_name}</p>
                    <p className="text-xs text-brand-text-muted">
                      CDL-{lead.cdl_class} · {lead.equipment || lead.route_type || "Any"} · {lead.experience}
                    </p>
                  </div>
                  <span className="ml-3 shrink-0 text-xs text-brand-text-muted">
                    {new Date(lead.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Blog Posts */}
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-sm font-bold text-brand-text">
              <i className="ri-article-line mr-2 text-brand-text-muted" />
              Published Articles
            </h3>
            <Link to="/admin/blog" className="text-xs text-brand-orange hover:underline">Manage →</Link>
          </div>

          {blogPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-sm text-brand-text-muted mb-3">No articles yet.</p>
              <Link to="/admin/blog" className="rounded-lg bg-brand-orange px-4 py-2 text-xs font-bold text-white hover:bg-brand-orange-hover">
                Add First Article
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {blogPosts.slice(0, 8).map((post) => (
                <div key={post.id} className="flex items-center justify-between rounded-lg bg-brand-bg px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-text truncate">{post.title}</p>
                    <p className="text-xs text-brand-text-muted">{post.category}</p>
                  </div>
                  <div className="ml-3 flex items-center gap-2 shrink-0">
                    {post.featured && (
                      <span className="rounded-full bg-brand-orange-light px-2 py-0.5 text-[10px] font-bold text-brand-orange">Featured</span>
                    )}
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-brand-orange hover:underline">
                      View
                    </a>
                  </div>
                </div>
              ))}
              {blogPosts.length > 8 && (
                <p className="text-xs text-brand-text-muted pt-1 text-center">+{blogPosts.length - 8} more articles</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Google Search Console Panel */}
      <div className="rounded-xl border border-brand-border bg-brand-surface p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange-light">
              <i className="ri-google-line text-xl text-brand-orange" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-brand-text">Google Search Console</h3>
              <p className="text-xs text-brand-text-muted">Track search rankings, impressions, and clicks</p>
            </div>
          </div>
          <button
            onClick={() => setShowGscSetup(!showGscSetup)}
            className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-text hover:border-brand-orange hover:text-brand-orange"
          >
            {gscUrl ? "Change" : "Setup"}
          </button>
        </div>

        {showGscSetup && (
          <div className="mb-5 rounded-xl border border-brand-border bg-brand-bg p-5">
            <h4 className="text-sm font-bold text-brand-text mb-3">Connect Google Search Console</h4>
            <ol className="space-y-3 text-sm text-brand-text-secondary mb-4">
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white">1</span>
                Go to{" "}
                <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-brand-orange underline">
                  search.google.com/search-console
                </a>
                {" "}and add <strong>truckdriverjobs.co</strong> as a property
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white">2</span>
                Verify ownership via the HTML tag method — add the meta tag to your site's{" "}
                <code className="rounded bg-brand-border px-1 py-0.5 text-xs">index.html</code>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white">3</span>
                Submit your sitemap:{" "}
                <code className="rounded bg-brand-border px-1 py-0.5 text-xs">https://truckdriverjobs.co/sitemap.xml</code>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white">4</span>
                Paste your GSC property URL below to open it directly from here
              </li>
            </ol>
            <div className="flex gap-2">
              <input
                type="url"
                value={gscInput}
                onChange={(e) => setGscInput(e.target.value)}
                placeholder="https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain:truckdriverjobs.co"
                className="flex-1 rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-xs text-brand-text outline-none focus:border-brand-orange"
              />
              <button onClick={saveGscUrl} className="rounded-lg bg-brand-orange px-4 py-2 text-xs font-bold text-white hover:bg-brand-orange-hover">
                Save
              </button>
            </div>
          </div>
        )}

        {gscUrl ? (
          <div className="space-y-3">
            <a
              href={gscUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-orange py-3 text-sm font-bold text-white hover:bg-brand-orange-hover"
            >
              <i className="ri-external-link-line" />
              Open Google Search Console
            </a>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Performance", desc: "Clicks, impressions, CTR by query", icon: "ri-bar-chart-line" },
                { label: "Coverage", desc: "Indexed vs non-indexed pages", icon: "ri-pages-line" },
                { label: "Sitemaps", desc: "Check sitemap submission status", icon: "ri-sitemap-line" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={gscUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-brand-border bg-brand-bg p-3 hover:border-brand-orange transition-colors"
                >
                  <i className={`${item.icon} text-xl text-brand-orange`} />
                  <p className="mt-1.5 text-xs font-bold text-brand-text">{item.label}</p>
                  <p className="mt-0.5 text-[10px] text-brand-text-muted">{item.desc}</p>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-brand-border bg-brand-bg p-8 text-center">
            <i className="ri-search-line text-3xl text-brand-text-muted" />
            <p className="mt-3 text-sm font-semibold text-brand-text">Not connected yet</p>
            <p className="mt-1 text-xs text-brand-text-muted max-w-sm mx-auto">
              Connect Google Search Console to track which keywords and pages are driving real organic traffic to truckdriverjobs.co.
            </p>
            <div className="mt-4 flex flex-col items-center gap-2">
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-orange-hover"
              >
                <i className="ri-google-line" />
                Open Google Search Console
              </a>
              <p className="text-xs text-brand-text-muted">
                Site: <strong>truckdriverjobs.co</strong> · Sitemap:{" "}
                <a href="/sitemap.xml" target="_blank" className="text-brand-orange underline">/sitemap.xml</a>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SEO Quick Links */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Sitemap", href: "/sitemap.xml", icon: "ri-sitemap-line", desc: "View XML sitemap" },
          { label: "Robots.txt", href: "/robots.txt", icon: "ri-robot-line", desc: "Crawler rules" },
          { label: "Blog", href: "/blog", icon: "ri-article-line", desc: "View live blog" },
          { label: "CDL Jobs TX", href: "/cdl-jobs/texas", icon: "ri-map-pin-line", desc: "State landing page" },
        ].map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-surface p-4 transition-colors hover:border-brand-orange"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-orange-light">
              <i className={`${link.icon} text-brand-orange`} />
            </div>
            <div>
              <p className="text-sm font-bold text-brand-text">{link.label}</p>
              <p className="text-xs text-brand-text-muted">{link.desc}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
