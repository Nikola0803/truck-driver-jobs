import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";

interface BlogView {
  created_at: string;
  metadata: {
    blog_post_id: number;
    blog_slug: string;
    blog_category: string;
    blog_title: string;
  } | null;
}

interface BlogApplication {
  id: number;
  status: string;
  source_blog_post_id: number;
  source_blog_category: string;
  created_at: string;
}

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  category: string;
  published_at: string;
}

interface CategoryStat {
  category: string;
  views: number;
  ctaClicks: number;
  applications: number;
  hired: number;
}

interface ArticleStat {
  id: number;
  slug: string;
  title: string;
  category: string;
  views: number;
  ctaClicks: number;
  applications: number;
}

type TimeRange = "7d" | "30d" | "90d";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState<BlogView[]>([]);
  const [ctaClicks, setCtaClicks] = useState<BlogView[]>([]);
  const [apps, setApps] = useState<BlogApplication[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");

      const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const since = new Date();
      since.setDate(since.getDate() - daysAgo);
      const sinceISO = since.toISOString();

      try {
        const [viewsRes, clicksRes, appsRes, postsRes] = await Promise.all([
          supabase
            .from("analytics_events")
            .select("created_at, metadata")
            .eq("event_type", "blog_view")
            .gte("created_at", sinceISO)
            .order("created_at", { ascending: false })
            .limit(5000),
          supabase
            .from("analytics_events")
            .select("created_at, metadata")
            .eq("event_type", "blog_cta_click")
            .gte("created_at", sinceISO)
            .order("created_at", { ascending: false })
            .limit(5000),
          supabase
            .from("applications")
            .select("id, status, source_blog_post_id, source_blog_category, created_at")
            .not("source_blog_post_id", "is", null)
            .gte("created_at", sinceISO)
            .order("created_at", { ascending: false })
            .limit(500),
          supabase
            .from("blog_posts")
            .select("id, slug, title, category, published_at")
            .order("published_at", { ascending: false }),
        ]);

        if (viewsRes.error) throw new Error(viewsRes.error.message);
        if (clicksRes.error) throw new Error(clicksRes.error.message);
        if (appsRes.error) throw new Error(appsRes.error.message);
        if (postsRes.error) throw new Error(postsRes.error.message);

        setViews((viewsRes.data || []) as BlogView[]);
        setCtaClicks((clicksRes.data || []) as BlogView[]);
        setApps((appsRes.data || []) as BlogApplication[]);
        setPosts((postsRes.data || []) as BlogPost[]);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [timeRange]);

  // Computed stats
  const stats = useMemo(() => {
    const totalViews = views.length;
    const totalClicks = ctaClicks.length;
    const totalApps = apps.length;
    const conversionRate = totalClicks > 0 ? ((totalApps / totalClicks) * 100).toFixed(1) : "0.0";

    return { totalViews, totalClicks, totalApps, conversionRate };
  }, [views, ctaClicks, apps]);

  // Category breakdown
  const categoryStats = useMemo(() => {
    const map: Record<string, CategoryStat> = {};

    views.forEach((v) => {
      const cat = v.metadata?.blog_category || "Uncategorized";
      if (!map[cat]) map[cat] = { category: cat, views: 0, ctaClicks: 0, applications: 0, hired: 0 };
      map[cat].views++;
    });

    ctaClicks.forEach((c) => {
      const cat = c.metadata?.blog_category || "Uncategorized";
      if (!map[cat]) map[cat] = { category: cat, views: 0, ctaClicks: 0, applications: 0, hired: 0 };
      map[cat].ctaClicks++;
    });

    apps.forEach((a) => {
      const cat = a.source_blog_category || "Uncategorized";
      if (!map[cat]) map[cat] = { category: cat, views: 0, ctaClicks: 0, applications: 0, hired: 0 };
      map[cat].applications++;
      if (a.status === "hired") map[cat].hired++;
    });

    return Object.values(map).sort((a, b) => b.views - a.views);
  }, [views, ctaClicks, apps]);

  // Top articles
  const topArticles = useMemo(() => {
    const map: Record<number, ArticleStat> = {};

    views.forEach((v) => {
      const id = v.metadata?.blog_post_id;
      if (!id) return;
      if (!map[id]) {
        map[id] = {
          id,
          slug: v.metadata?.blog_slug || "",
          title: v.metadata?.blog_title || "Unknown",
          category: v.metadata?.blog_category || "Uncategorized",
          views: 0,
          ctaClicks: 0,
          applications: 0,
        };
      }
      map[id].views++;
    });

    ctaClicks.forEach((c) => {
      const id = c.metadata?.blog_post_id;
      if (!id || !map[id]) return;
      map[id].ctaClicks++;
    });

    apps.forEach((a) => {
      const id = a.source_blog_post_id;
      if (!id || !map[id]) return;
      map[id].applications++;
    });

    return Object.values(map).sort((a, b) => b.views - a.views).slice(0, 10);
  }, [views, ctaClicks, apps]);

  // Daily trend data
  const dailyTrend = useMemo(() => {
    const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const days: { date: string; label: string; views: number; clicks: number; apps: number }[] = [];

    for (let i = daysAgo - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      days.push({ date: dateStr, label, views: 0, clicks: 0, apps: 0 });
    }

    views.forEach((v) => {
      const dateStr = v.created_at.slice(0, 10);
      const day = days.find((d) => d.date === dateStr);
      if (day) day.views++;
    });

    ctaClicks.forEach((c) => {
      const dateStr = c.created_at.slice(0, 10);
      const day = days.find((d) => d.date === dateStr);
      if (day) day.clicks++;
    });

    apps.forEach((a) => {
      const dateStr = a.created_at.slice(0, 10);
      const day = days.find((d) => d.date === dateStr);
      if (day) day.apps++;
    });

    return days;
  }, [views, ctaClicks, apps, timeRange]);

  const maxDailyViews = Math.max(1, ...dailyTrend.map((d) => d.views));

  // Recent activity (last 20 unique events)
  const recentActivity = useMemo(() => {
    const all: { type: string; title: string; category: string; time: string }[] = [];

    views.slice(0, 8).forEach((v) => {
      all.push({
        type: "view",
        title: v.metadata?.blog_title || "Unknown Article",
        category: v.metadata?.blog_category || "",
        time: v.created_at,
      });
    });

    ctaClicks.slice(0, 6).forEach((c) => {
      all.push({
        type: "click",
        title: c.metadata?.blog_title || "Unknown Article",
        category: c.metadata?.blog_category || "",
        time: c.created_at,
      });
    });

    apps.slice(0, 6).forEach((a) => {
      const post = posts.find((p) => p.id === a.source_blog_post_id);
      all.push({
        type: "app",
        title: post?.title || "Unknown Article",
        category: a.source_blog_category || "",
        time: a.created_at,
      });
    });

    return all.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 20);
  }, [views, ctaClicks, apps, posts]);

  const maxCategoryViews = Math.max(1, ...categoryStats.map((c) => c.views));

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground-950">Blog Analytics</h1>
        </div>
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-background-200 border-t-primary-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground-950">Blog Analytics</h1>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <i className="ri-error-warning-line text-2xl text-red-500" />
          </div>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-red-500 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
  ];

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground-950">Blog Analytics</h1>
          <p className="mt-1 text-sm text-foreground-600">
            Track post views, engagement, and which content drives job applications.
          </p>
        </div>
        <div className="flex items-center rounded-lg border border-background-200 bg-background-50 p-1">
          {timeRangeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTimeRange(opt.value)}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                timeRange === opt.value
                  ? "bg-primary-500 text-background-50"
                  : "text-foreground-600 hover:text-foreground-950"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Views",
            value: stats.totalViews.toLocaleString(),
            icon: "ri-eye-line",
            change: dailyTrend.length >= 2
              ? `${dailyTrend[dailyTrend.length - 1].views > dailyTrend[dailyTrend.length - 2].views ? "+" : ""}${dailyTrend[dailyTrend.length - 1].views - dailyTrend[dailyTrend.length - 2].views}`
              : "-",
            color: "primary",
          },
          {
            label: "CTA Clicks",
            value: stats.totalClicks.toLocaleString(),
            icon: "ri-cursor-line",
            change: `${stats.totalViews > 0 ? ((stats.totalClicks / stats.totalViews) * 100).toFixed(1) : "0.0"}% CTR`,
            color: "accent",
          },
          {
            label: "Applications",
            value: stats.totalApps.toLocaleString(),
            icon: "ri-file-text-line",
            change: `${stats.conversionRate}% conv.`,
            color: "secondary",
          },
          {
            label: "Articles Published",
            value: posts.length.toString(),
            icon: "ri-article-line",
            change: "24 total",
            color: "primary",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-background-200 bg-background-50 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-foreground-500">
                {card.label}
              </span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-${card.color}-100`}>
                <i className={`${card.icon} text-sm text-${card.color}-600`} />
              </div>
            </div>
            <p className="font-heading text-2xl font-bold text-foreground-950">{card.value}</p>
            <p className="mt-1 text-xs text-foreground-500">{card.change}</p>
          </div>
        ))}
      </div>

      {/* VIEWS TREND + CATEGORY BREAKDOWN */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* Trend chart */}
        <div className="rounded-xl border border-background-200 bg-background-50 p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-sm font-bold text-foreground-950">
              <i className="ri-line-chart-line mr-2 text-foreground-400" />
              Daily Views
            </h3>
            <span className="text-xs text-foreground-500">{timeRangeOptions.find((t) => t.value === timeRange)?.label}</span>
          </div>

          {dailyTrend.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-foreground-400">
              No data for this period
            </div>
          ) : (
            <div className="h-48">
              <div className="flex h-full items-end gap-px">
                {dailyTrend.map((day) => {
                  const heightPct = (day.views / maxDailyViews) * 100;
                  const barWidth = timeRange === "7d" ? "w-[calc(100%/7-1px)]" : timeRange === "30d" ? "w-[calc(100%/30-1px)]" : "w-[calc(100%/90-1px)]";
                  return (
                    <div
                      key={day.date}
                      className={`${barWidth} group relative flex-1`}
                    >
                      <div
                        className="w-full rounded-t-sm bg-primary-500/70 transition-colors hover:bg-primary-500"
                        style={{ height: `${Math.max(heightPct, 2)}%` }}
                      />
                      {/* Tooltip */}
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden rounded-md bg-foreground-950 px-2.5 py-1.5 text-xs text-background-50 whitespace-nowrap group-hover:block z-10">
                        <p className="font-semibold">{day.views} views</p>
                        {day.clicks > 0 && <p>{day.clicks} clicks</p>}
                        {day.apps > 0 && <p>{day.apps} applications</p>}
                        <p className="text-foreground-400">{day.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* X-axis labels - show ~5 labels */}
              <div className="mt-2 flex justify-between">
                {dailyTrend
                  .filter((_, i) => {
                    const step = Math.max(1, Math.floor(dailyTrend.length / 5));
                    return i % step === 0 || i === dailyTrend.length - 1;
                  })
                  .slice(0, 6)
                  .map((day) => (
                    <span key={day.date} className="text-[10px] text-foreground-400">
                      {day.label}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Category breakdown */}
        <div className="rounded-xl border border-background-200 bg-background-50 p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-sm font-bold text-foreground-950">
              <i className="ri-pie-chart-line mr-2 text-foreground-400" />
              Views by Category
            </h3>
          </div>

          {categoryStats.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-foreground-400">
              No category data yet
            </div>
          ) : (
            <div className="space-y-3">
              {categoryStats.slice(0, 8).map((cat) => (
                <div key={cat.category} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground-700">{cat.category}</span>
                    <span className="text-xs text-foreground-500">{cat.views.toLocaleString()} views</span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-background-100">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary-500 transition-all"
                      style={{ width: `${(cat.views / maxCategoryViews) * 100}%` }}
                    />
                  </div>
                  {(cat.applications > 0 || cat.ctaClicks > 0) && (
                    <div className="mt-1 flex gap-3 text-[10px] text-foreground-400">
                      {cat.ctaClicks > 0 && <span>{cat.ctaClicks} CTA clicks</span>}
                      {cat.applications > 0 && (
                        <span className="font-semibold text-accent-600">{cat.applications} applications</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {categoryStats.length > 8 && (
                <p className="text-xs text-foreground-400 pt-1">
                  +{categoryStats.length - 8} more categories
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CATEGORY → APPLICATION CORRELATION */}
      <div className="mb-8 rounded-xl border border-background-200 bg-background-50 p-5 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-heading text-sm font-bold text-foreground-950">
              <i className="ri-link mr-2 text-foreground-400" />
              Categories That Drive Applications
            </h3>
            <p className="mt-0.5 text-xs text-foreground-500">
              Which blog categories result in the most job applications
            </p>
          </div>
        </div>

        {categoryStats.filter((c) => c.applications > 0).length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-foreground-400">
            <div className="text-center">
              <i className="ri-inbox-line text-2xl mb-2 block" />
              No blog-driven applications recorded yet.{' '}
              <span className="text-foreground-600">Applications will appear here when readers apply after reading blog posts.</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-background-200">
                  <th className="pb-3 pr-4 text-left text-xs font-bold uppercase tracking-wider text-foreground-500">Category</th>
                  <th className="pb-3 pr-4 text-right text-xs font-bold uppercase tracking-wider text-foreground-500">Views</th>
                  <th className="pb-3 pr-4 text-right text-xs font-bold uppercase tracking-wider text-foreground-500">CTA Clicks</th>
                  <th className="pb-3 pr-4 text-right text-xs font-bold uppercase tracking-wider text-foreground-500">Applications</th>
                  <th className="pb-3 text-right text-xs font-bold uppercase tracking-wider text-foreground-500">Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {categoryStats
                  .filter((c) => c.applications > 0 || c.ctaClicks > 5)
                  .sort((a, b) => b.applications - a.applications)
                  .slice(0, 10)
                  .map((cat) => {
                    const convRate = cat.ctaClicks > 0 ? ((cat.applications / cat.ctaClicks) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={cat.category} className="border-b border-background-100 last:border-b-0">
                        <td className="py-3 pr-4">
                          <span className="rounded-full bg-accent-100 px-3 py-1 text-xs font-medium text-accent-700">
                            {cat.category}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right text-sm font-semibold text-foreground-700">
                          {cat.views.toLocaleString()}
                        </td>
                        <td className="py-3 pr-4 text-right text-sm text-foreground-600">
                          {cat.ctaClicks.toLocaleString()}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span className={`text-sm font-bold ${cat.applications >= 3 ? "text-accent-600" : "text-foreground-700"}`}>
                            {cat.applications}
                          </span>
                          {cat.hired > 0 && (
                            <span className="ml-1.5 rounded-full bg-accent-100 px-1.5 py-0.5 text-[10px] font-bold text-accent-700">
                              {cat.hired} hired
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right text-sm text-foreground-600">
                          {convRate}%
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TOP ARTICLES + RECENT ACTIVITY */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top 10 articles */}
        <div className="rounded-xl border border-background-200 bg-background-50 p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-sm font-bold text-foreground-950">
              <i className="ri-trophy-line mr-2 text-foreground-400" />
              Top Articles
            </h3>
            <span className="text-xs text-foreground-500">By total views</span>
          </div>

          {topArticles.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-foreground-400">
              No article data yet
            </div>
          ) : (
            <div className="space-y-2">
              {topArticles.map((article, idx) => (
                <a
                  key={article.id}
                  href={`/blog/${article.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-background-100 group"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      idx < 3
                        ? "bg-accent-100 text-accent-700"
                        : "bg-background-100 text-foreground-500"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground-900 transition-colors group-hover:text-primary-500">
                      {article.title}
                    </p>
                    <p className="text-xs text-foreground-500">{article.category}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-foreground-700">{article.views.toLocaleString()}</p>
                    <p className="text-xs text-foreground-400">views</p>
                  </div>
                  {article.applications > 0 && (
                    <div className="hidden sm:flex shrink-0 items-center gap-1 rounded-full bg-accent-50 px-2 py-1">
                      <span className="text-xs font-bold text-accent-600">{article.applications}</span>
                      <span className="text-[10px] text-accent-500">apps</span>
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="rounded-xl border border-background-200 bg-background-50 p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-sm font-bold text-foreground-950">
              <i className="ri-history-line mr-2 text-foreground-400" />
              Recent Activity
            </h3>
          </div>

          {recentActivity.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-foreground-400">
              No recent activity
            </div>
          ) : (
            <div className="space-y-1">
              {recentActivity.map((item, idx) => {
                const icon = item.type === "view" ? "ri-eye-line" : item.type === "click" ? "ri-cursor-line" : "ri-file-text-line";
                const iconBg = item.type === "view" ? "bg-primary-100 text-primary-600" : item.type === "click" ? "bg-secondary-100 text-secondary-600" : "bg-accent-100 text-accent-600";
                const label = item.type === "view" ? "Read" : item.type === "click" ? "CTA Click" : "Applied";
                const timeAgo = getRelativeTime(item.time);

                return (
                  <div
                    key={`${item.type}-${idx}`}
                    className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-background-100"
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
                      <i className={`${icon} text-xs`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground-800">{item.title}</p>
                      <p className="text-xs text-foreground-500">{item.category}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-xs font-medium text-foreground-600">{label}</span>
                      <p className="text-[10px] text-foreground-400">{timeAgo}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* HIDDEN GEM: Post-published insight */}
      {posts.length > 0 && views.length === 0 && (
        <div className="mt-8 rounded-xl border border-background-200 bg-background-50 p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-100">
            <i className="ri-lightbulb-line text-2xl text-secondary-600" />
          </div>
          <h3 className="font-heading text-base font-bold text-foreground-950 mb-2">Analytics is live and tracking!</h3>
          <p className="text-sm text-foreground-500 max-w-md mx-auto">
            View events are recorded every time someone reads a blog post, and applications submitted after reading a post are automatically tagged with the source. Come back after some traffic to see the data populate.
          </p>
        </div>
      )}
    </div>
  );
}

function getRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}