import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/feature/Navbar";
import SeoHead from "@/components/feature/SeoHead";
import { jobs } from "@/mocks/jobs";

interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  has_cdl: boolean;
  cdl_state: string | null;
  experience: string | null;
  driver_type: string | null;
  preferred_route: string | null;
  preferred_equipment: string | null;
  home_time_preference: string | null;
  min_pay_expectation: string | null;
  created_at: string;
}

interface ApplicationRow {
  id: number;
  user_id: string;
  job_id: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const statusStyles: Record<string, string> = {
  submitted: "bg-blue-50 text-blue-600 border-blue-200",
  reviewed: "bg-yellow-50 text-yellow-600 border-yellow-200",
  contacted: "bg-brand-orange-light text-brand-orange border-brand-orange/20",
  hired: "bg-green-50 text-green-600 border-green-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
};

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  reviewed: "Under Review",
  contacted: "Contacted",
  hired: "Hired",
  rejected: "Not Selected",
};

export default function AdminCRM() {
  const { isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "drivers" | "applications">("overview");
  const [driverSearch, setDriverSearch] = useState("");
  const [appFilter, setAppFilter] = useState("all");
  const [selectedProfile, setSelectedProfile] = useState<ProfileRow | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, appsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("applications").select("*").order("created_at", { ascending: false }),
    ]);
    setProfiles(profilesRes.data ?? []);
    setApplications(appsRes.data ?? []);
    setLoading(false);
  };

  const updateApplicationStatus = async (id: number, status: string, notes?: string) => {
    const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (notes !== undefined) update.notes = notes;
    await supabase.from("applications").update(update).eq("id", id);
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status, notes: notes ?? a.notes, updated_at: new Date().toISOString() } : a))
    );
  };

  const getJobById = (jobId: number) => jobs.find((j) => Number(j.id) === jobId);

  const filteredDrivers = profiles.filter((p) => {
    const term = driverSearch.toLowerCase();
    return (
      (p.full_name?.toLowerCase() || "").includes(term) ||
      (p.phone?.toLowerCase() || "").includes(term) ||
      (p.email?.toLowerCase() || "").includes(term) ||
      (p.driver_type?.toLowerCase() || "").includes(term) ||
      (p.preferred_route?.toLowerCase() || "").includes(term)
    );
  });

  const filteredApplications = appFilter === "all"
    ? applications
    : applications.filter((a) => a.status === appFilter);

  const stats = {
    totalDrivers: profiles.length,
    newDriversToday: profiles.filter((p) => {
      const d = new Date(p.created_at);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    }).length,
    totalApplications: applications.length,
    pendingApplications: applications.filter((a) => a.status === "submitted" || a.status === "reviewed").length,
    hiredThisMonth: applications.filter((a) => {
      if (a.status !== "hired") return false;
      const d = new Date(a.updated_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  const driverTypeCounts = () => {
    const counts: Record<string, number> = {};
    profiles.forEach((p) => {
      const type = p.driver_type || "unknown";
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  };

  const expCounts = () => {
    const counts: Record<string, number> = {};
    profiles.forEach((p) => {
      const exp = p.experience || "unknown";
      counts[exp] = (counts[exp] || 0) + 1;
    });
    return counts;
  };

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text">
      <SeoHead
        title="Admin CRM"
        description="Internal admin console for TruckDriverJobs.co - manage driver profiles, applications, and placements."
      />
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-brand-text md:text-4xl">
            Admin <span className="text-brand-orange">CRM</span>
          </h1>
          <p className="mt-2 text-sm text-brand-text-secondary">
            Manage driver profiles, applications, and placements. {isAdmin ? "Admin access active." : "Read-only view."}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Total Drivers", value: stats.totalDrivers, icon: "ri-user-line", color: "text-brand-orange" },
            { label: "New Today", value: stats.newDriversToday, icon: "ri-user-add-line", color: "text-green-600" },
            { label: "Total Applications", value: stats.totalApplications, icon: "ri-send-plane-line", color: "text-blue-600" },
            { label: "Pending Review", value: stats.pendingApplications, icon: "ri-time-line", color: "text-yellow-600" },
            { label: "Hired This Month", value: stats.hiredThisMonth, icon: "ri-briefcase-line", color: "text-green-600" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-brand-border bg-brand-surface p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange-light">
                  <i className={`${stat.icon} ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-brand-text">{stat.value}</p>
                  <p className="text-xs text-brand-text-secondary">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-brand-border bg-brand-surface p-1 w-fit">
          {[
            { id: "overview", label: "Overview", icon: "ri-dashboard-line" },
            { id: "drivers", label: `Drivers (${profiles.length})`, icon: "ri-user-line" },
            { id: "applications", label: `Applications (${applications.length})`, icon: "ri-send-plane-line" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-brand-orange text-white"
                  : "text-brand-text-secondary hover:text-brand-text"
              }`}
            >
              <i className={tab.icon} />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Driver Type Breakdown */}
                <div className="rounded-xl border border-brand-border bg-brand-surface p-6">
                  <h3 className="font-heading text-lg font-bold text-brand-text mb-4">Driver Types</h3>
                  <div className="space-y-3">
                    {Object.entries(driverTypeCounts()).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm text-brand-text capitalize">{type.replace("_", " ")}</span>
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 rounded-full bg-brand-bg">
                            <div
                              className="h-2 rounded-full bg-brand-orange"
                              style={{ width: `${profiles.length > 0 ? (count / profiles.length) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-brand-text w-6 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                    {profiles.length === 0 && (
                      <p className="text-sm text-brand-text-secondary">No driver data yet.</p>
                    )}
                  </div>
                </div>

                {/* Experience Breakdown */}
                <div className="rounded-xl border border-brand-border bg-brand-surface p-6">
                  <h3 className="font-heading text-lg font-bold text-brand-text mb-4">Experience Levels</h3>
                  <div className="space-y-3">
                    {Object.entries(expCounts()).map(([exp, count]) => (
                      <div key={exp} className="flex items-center justify-between">
                        <span className="text-sm text-brand-text">{exp}</span>
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 rounded-full bg-brand-bg">
                            <div
                              className="h-2 rounded-full bg-brand-orange"
                              style={{ width: `${profiles.length > 0 ? (count / profiles.length) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-brand-text w-6 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                    {profiles.length === 0 && (
                      <p className="text-sm text-brand-text-secondary">No driver data yet.</p>
                    )}
                  </div>
                </div>

                {/* Recent Applications */}
                <div className="rounded-xl border border-brand-border bg-brand-surface p-6 lg:col-span-1">
                  <h3 className="font-heading text-lg font-bold text-brand-text mb-4">Recent Applications</h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {applications.slice(0, 8).map((app) => {
                      const job = getJobById(app.job_id);
                      const driver = profiles.find((p) => p.id === app.user_id);
                      return (
                        <div key={app.id} className="rounded-lg border border-brand-border bg-brand-bg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-brand-text">{job?.title || `Job #${app.job_id}`}</span>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusStyles[app.status] || ""}`}>
                              {statusLabels[app.status] || app.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-brand-text-secondary">
                            {driver?.full_name || "Unknown driver"} &middot; {new Date(app.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      );
                    })}
                    {applications.length === 0 && (
                      <p className="text-sm text-brand-text-secondary">No applications yet.</p>
                    )}
                  </div>
                </div>

                {/* Recent Drivers */}
                <div className="rounded-xl border border-brand-border bg-brand-surface p-6 lg:col-span-3">
                  <h3 className="font-heading text-lg font-bold text-brand-text mb-4">Latest Driver Signups</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-brand-border">
                          <th className="pb-3 text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Name</th>
                          <th className="pb-3 text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Type</th>
                          <th className="pb-3 text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Experience</th>
                          <th className="pb-3 text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Route</th>
                          <th className="pb-3 text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Equipment</th>
                          <th className="pb-3 text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Joined</th>
                          <th className="pb-3 text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profiles.slice(0, 6).map((p) => (
                          <tr key={p.id} className="border-b border-brand-border/50 last:border-0">
                            <td className="py-3 text-sm font-semibold text-brand-text">{p.full_name || "N/A"}</td>
                            <td className="py-3 text-sm text-brand-text-secondary capitalize">{p.driver_type?.replace("_", " ") || "N/A"}</td>
                            <td className="py-3 text-sm text-brand-text-secondary">{p.experience || "N/A"}</td>
                            <td className="py-3 text-sm text-brand-text-secondary">{p.preferred_route || "N/A"}</td>
                            <td className="py-3 text-sm text-brand-text-secondary">{p.preferred_equipment || "N/A"}</td>
                            <td className="py-3 text-sm text-brand-text-secondary">{new Date(p.created_at).toLocaleDateString()}</td>
                            <td className="py-3">
                              <button
                                onClick={() => setSelectedProfile(p)}
                                className="rounded-md border border-brand-border px-2 py-1 text-xs font-semibold text-brand-text transition-colors hover:border-brand-orange hover:text-brand-orange"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                        {profiles.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-sm text-brand-text-secondary">
                              No drivers signed up yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* DRIVERS TAB */}
            {activeTab === "drivers" && (
              <div className="rounded-xl border border-brand-border bg-brand-surface p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="font-heading text-lg font-bold text-brand-text">All Drivers</h3>
                  <input
                    type="text"
                    value={driverSearch}
                    onChange={(e) => setDriverSearch(e.target.value)}
                    placeholder="Search by name, phone, type, route..."
                    className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder-brand-text-muted outline-none focus:border-brand-orange sm:w-80"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-brand-border">
                        <th className="pb-3 text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Name</th>
                        <th className="pb-3 text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Phone</th>
                        <th className="pb-3 text-xs font-bold uppercase tracking-wider text-brand-text-secondary">CDL</th>
                        <th className="pb-3 text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Type</th>
                        <th className="pb-3 text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Experience</th>
                        <th className="pb-3 text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Route</th>
                        <th className="pb-3 text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Equipment</th>
                        <th className="pb-3 text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Home Time</th>
                        <th className="pb-3 text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Min Pay</th>
                        <th className="pb-3 text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Joined</th>
                        <th className="pb-3 text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDrivers.map((p) => (
                        <tr key={p.id} className="border-b border-brand-border/50 last:border-0">
                          <td className="py-3 text-sm font-semibold text-brand-text">{p.full_name || "N/A"}</td>
                          <td className="py-3 text-sm text-brand-text-secondary">{p.phone || "N/A"}</td>
                          <td className="py-3 text-sm text-brand-text-secondary">
                            {p.has_cdl ? `Yes (${p.cdl_state || "N/A"})` : "No"}
                          </td>
                          <td className="py-3 text-sm text-brand-text-secondary capitalize">{p.driver_type?.replace("_", " ") || "N/A"}</td>
                          <td className="py-3 text-sm text-brand-text-secondary">{p.experience || "N/A"}</td>
                          <td className="py-3 text-sm text-brand-text-secondary">{p.preferred_route || "N/A"}</td>
                          <td className="py-3 text-sm text-brand-text-secondary">{p.preferred_equipment || "N/A"}</td>
                          <td className="py-3 text-sm text-brand-text-secondary">{p.home_time_preference || "N/A"}</td>
                          <td className="py-3 text-sm text-brand-text-secondary">{p.min_pay_expectation || "N/A"}</td>
                          <td className="py-3 text-sm text-brand-text-secondary">{new Date(p.created_at).toLocaleDateString()}</td>
                          <td className="py-3">
                            <button
                              onClick={() => setSelectedProfile(p)}
                              className="rounded-md border border-brand-border px-2 py-1 text-xs font-semibold text-brand-text transition-colors hover:border-brand-orange hover:text-brand-orange"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredDrivers.length === 0 && (
                        <tr>
                          <td colSpan={11} className="py-6 text-center text-sm text-brand-text-secondary">
                            No drivers match your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* APPLICATIONS TAB */}
            {activeTab === "applications" && (
              <div className="rounded-xl border border-brand-border bg-brand-surface p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="font-heading text-lg font-bold text-brand-text">All Applications</h3>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-brand-text-muted">Filter:</label>
                    <select
                      value={appFilter}
                      onChange={(e) => setAppFilter(e.target.value)}
                      className="rounded-lg border border-brand-border bg-brand-bg px-3 py-1.5 text-sm text-brand-text outline-none focus:border-brand-orange"
                    >
                      <option value="all">All Statuses</option>
                      <option value="submitted">Submitted</option>
                      <option value="reviewed">Under Review</option>
                      <option value="contacted">Contacted</option>
                      <option value="hired">Hired</option>
                      <option value="rejected">Not Selected</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  {filteredApplications.map((app) => {
                    const job = getJobById(app.job_id);
                    const driver = profiles.find((p) => p.id === app.user_id);
                    return (
                      <div key={app.id} className="rounded-lg border border-brand-border bg-brand-bg p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange-light">
                              <i className="ri-truck-line text-brand-orange" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-brand-text">{job?.title || `Job #${app.job_id}`}</p>
                              <p className="text-xs text-brand-text-secondary">
                                {driver?.full_name || "Unknown"} &middot; {driver?.phone || "No phone"} &middot; Applied {new Date(app.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusStyles[app.status] || ""}`}>
                              {statusLabels[app.status] || app.status}
                            </span>
                          </div>
                        </div>

                        {/* Admin Actions */}
                        <div className="mt-3 flex flex-wrap gap-2 border-t border-brand-border pt-3">
                          <span className="text-xs font-semibold text-brand-text-muted self-center">Update:</span>
                          {["submitted", "reviewed", "contacted", "hired", "rejected"].map((s) => (
                            <button
                              key={s}
                              onClick={() => updateApplicationStatus(app.id, s)}
                              disabled={app.status === s}
                              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                                app.status === s
                                  ? "bg-brand-orange text-white cursor-default"
                                  : "border border-brand-border text-brand-text-secondary hover:border-brand-orange hover:text-brand-orange"
                              }`}
                            >
                              {statusLabels[s]}
                            </button>
                          ))}
                          <button
                            onClick={() => {
                              const note = prompt("Add a note:", app.notes || "");
                              if (note !== null) {
                                updateApplicationStatus(app.id, app.status, note);
                              }
                            }}
                            className="rounded-md border border-brand-border px-3 py-1 text-xs font-semibold text-brand-text-secondary transition-colors hover:border-brand-orange hover:text-brand-orange"
                          >
                            Add Note
                          </button>
                        </div>
                        {app.notes && (
                          <div className="mt-2 rounded-md bg-brand-orange-light p-2">
                            <p className="text-xs text-brand-orange"><span className="font-semibold">Note:</span> {app.notes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredApplications.length === 0 && (
                    <div className="rounded-lg bg-brand-bg p-10 text-center">
                      <p className="text-sm text-brand-text-secondary">No applications match this filter.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Profile Detail Modal */}
        {selectedProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-heading text-xl font-bold text-brand-text">Driver Profile</h3>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-border text-brand-text-secondary transition-colors hover:border-brand-orange hover:text-brand-orange"
                >
                  <i className="ri-close-line" />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Name", value: selectedProfile.full_name || "N/A" },
                  { label: "Phone", value: selectedProfile.phone || "N/A" },
                  { label: "CDL", value: selectedProfile.has_cdl ? `Class A (${selectedProfile.cdl_state || "N/A"})` : "No CDL" },
                  { label: "Experience", value: selectedProfile.experience || "N/A" },
                  { label: "Driver Type", value: selectedProfile.driver_type?.replace("_", " ") || "N/A" },
                  { label: "Preferred Route", value: selectedProfile.preferred_route || "N/A" },
                  { label: "Equipment", value: selectedProfile.preferred_equipment || "N/A" },
                  { label: "Home Time", value: selectedProfile.home_time_preference || "N/A" },
                  { label: "Min Pay Goal", value: selectedProfile.min_pay_expectation || "N/A" },
                  { label: "Joined", value: new Date(selectedProfile.created_at).toLocaleString() },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between border-b border-brand-border/50 pb-2">
                    <span className="text-xs font-semibold text-brand-text-secondary uppercase">{item.label}</span>
                    <span className="text-sm font-medium text-brand-text">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => {
                    alert(`Calling ${selectedProfile.phone || "N/A"}...`);
                    setSelectedProfile(null);
                  }}
                  className="flex-1 rounded-lg bg-brand-orange px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-orange-hover"
                >
                  Call Driver
                </button>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="flex-1 rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text transition-colors hover:border-brand-orange hover:text-brand-orange"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}