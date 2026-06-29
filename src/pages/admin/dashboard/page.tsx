import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ campaigns: 0, activeCampaigns: 0, groups: 0, queued: 0, drivers: 0, apps: 0, pendingApps: 0 });
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const [campRes, groupRes, queueRes, profileRes, appRes] = await Promise.all([
      supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("recruitment_groups").select("*"),
      supabase.from("queued_posts").select("*").eq("status", "pending"),
      supabase.from("profiles").select("id"),
      supabase.from("applications").select("*").order("created_at", { ascending: false }),
    ]);

    const campaigns = campRes.data ?? [];
    const apps = appRes.data ?? [];

    setStats({
      campaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c: any) => c.status === "active").length,
      groups: groupRes.data?.length ?? 0,
      queued: queueRes.data?.length ?? 0,
      drivers: profileRes.data?.length ?? 0,
      apps: apps.length,
      pendingApps: apps.filter((a: any) => a.status === "submitted" || a.status === "reviewed").length,
    });

    setRecentCampaigns(campaigns.slice(0, 4));
    setRecentApps(apps.slice(0, 5));
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground-950">Recruitment CRM</h1>
        <p className="mt-1 text-sm text-foreground-600">One click → distribute a recruiting campaign everywhere.</p>
      </div>

      {/* Stat Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Campaigns", value: stats.activeCampaigns, sub: `${stats.campaigns} total`, icon: "ri-megaphone-line", color: "text-primary-500", bg: "bg-primary-50" },
          { label: "Recruitment Groups", value: stats.groups, sub: "Across platforms", icon: "ri-group-line", color: "text-accent-600", bg: "bg-accent-100" },
          { label: "Queued Posts", value: stats.queued, sub: "Ready to publish", icon: "ri-stack-line", color: "text-secondary-600", bg: "bg-secondary-100" },
          { label: "Pending Reviews", value: stats.pendingApps, sub: `${stats.drivers} drivers total`, icon: "ri-user-search-line", color: "text-foreground-600", bg: "bg-background-200" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-brand-border bg-brand-surface p-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>
                <i className={`${s.icon} ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground-950">{s.value}</p>
                <p className="text-xs text-foreground-500">{s.label}</p>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-foreground-400">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Campaigns */}
        <div className="lg:col-span-2 rounded-xl border border-brand-border bg-brand-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-foreground-950">Active Campaigns</h2>
            <Link
              to="/admin/campaigns"
              className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-foreground-600 transition-colors hover:border-primary-400 hover:text-primary-600"
            >
              View All
            </Link>
          </div>
          {recentCampaigns.length === 0 ? (
            <div className="rounded-lg bg-background-50 p-10 text-center">
              <i className="ri-megaphone-line text-3xl text-foreground-300" />
              <p className="mt-3 text-sm text-foreground-500">No campaigns yet.</p>
              <Link
                to="/admin/campaigns"
                className="mt-3 inline-block rounded-lg bg-primary-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-600"
              >
                Create First Campaign
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCampaigns.map((c: any) => (
                <Link
                  key={c.id}
                  to={`/admin/campaigns/${c.id}`}
                  className="flex items-center justify-between rounded-lg border border-brand-border bg-background-50 p-4 transition-colors hover:border-primary-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50">
                      <i className="ri-megaphone-line text-primary-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground-950">{c.name}</p>
                      <p className="text-xs text-foreground-500">{c.job_type || "N/A"} &middot; {c.duration_days} days</p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                    c.status === "active" ? "bg-green-50 text-green-600 border-green-200" :
                    c.status === "draft" ? "bg-foreground-100 text-foreground-600 border-foreground-200" :
                    "bg-foreground-50 text-foreground-400 border-foreground-100"
                  }`}>
                    {c.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="rounded-xl border border-brand-border bg-brand-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-foreground-950">Recent Applications</h2>
            <Link
              to="/admin/drivers"
              className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-foreground-600 transition-colors hover:border-primary-400 hover:text-primary-600"
            >
              All
            </Link>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {recentApps.length === 0 ? (
              <div className="rounded-lg bg-background-50 p-8 text-center">
                <p className="text-sm text-foreground-500">No applications yet.</p>
              </div>
            ) : (
              recentApps.map((a: any) => (
                <div key={a.id} className="rounded-lg border border-brand-border bg-background-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground-950">Job #{a.job_id}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                      a.status === "submitted" ? "bg-blue-50 text-blue-600 border-blue-200" :
                      a.status === "reviewed" ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
                      a.status === "contacted" ? "bg-primary-50 text-primary-500 border-primary-200" :
                      a.status === "hired" ? "bg-green-50 text-green-600 border-green-200" :
                      "bg-red-50 text-red-600 border-red-200"
                    }`}>
                      {a.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-foreground-500">
                    {new Date(a.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 rounded-xl border border-brand-border bg-brand-surface p-6">
        <h2 className="font-heading text-lg font-bold text-foreground-950 mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: "/admin/campaigns", label: "New Campaign", desc: "Create a recruitment campaign", icon: "ri-add-circle-line" },
            { to: "/admin/groups", label: "Add Group", desc: "Add a recruitment group", icon: "ri-group-line" },
            { to: "/admin/queue", label: "View Queue", desc: "Manage scheduled posts", icon: "ri-stack-line" },
            { to: "/admin/drivers", label: "Review Drivers", desc: "Process applications", icon: "ri-user-search-line" },
          ].map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="flex items-center gap-3 rounded-lg border border-brand-border bg-background-50 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50">
                <i className={`${action.icon} text-primary-500`} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground-950">{action.label}</p>
                <p className="text-xs text-foreground-500">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}