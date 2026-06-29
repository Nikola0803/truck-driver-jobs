import { useState, useEffect, Fragment } from "react";

interface Lead {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  cdl_class: string;
  experience: string;
  endorsements: string[];
  route_type: string;
  equipment: string;
  home_time: string;
  min_pay: string;
  states: string[];
  matched_job_ids: number[];
  applied_job_ids: number[];
  applied_at: string | null;
  status: string;
  source: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  applied: "bg-green-100 text-green-700",
  contacted: "bg-yellow-100 text-yellow-700",
  placed: "bg-brand-orange-light text-brand-orange",
  dead: "bg-gray-100 text-gray-500",
};

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const token = localStorage.getItem("tdj_token");

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/leads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setLeads(data);
    } catch (e: any) {
      setError(e.message ?? "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/admin/leads/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  }

  const filtered = leads.filter((l) => {
    const matchSearch =
      !search ||
      l.full_name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search);
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    applied: leads.filter((l) => l.status === "applied").length,
    placed: leads.filter((l) => l.status === "placed").length,
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground-950">AI Match Leads</h1>
        <p className="mt-1 text-sm text-foreground-500">
          Drivers who used the AI matching wizard — your warm leads.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Leads", value: stats.total, icon: "ri-user-line", color: "text-blue-600" },
          { label: "New", value: stats.new, icon: "ri-notification-line", color: "text-blue-500" },
          { label: "Applied", value: stats.applied, icon: "ri-file-check-line", color: "text-green-600" },
          { label: "Placed", value: stats.placed, icon: "ri-truck-line", color: "text-brand-orange" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-brand-border bg-brand-surface p-4">
            <div className="flex items-center gap-2 mb-1">
              <i className={`${s.icon} text-base ${s.color}`} />
              <p className="text-xs font-semibold text-foreground-500">{s.label}</p>
            </div>
            <p className="text-2xl font-bold text-foreground-950">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-brand-border bg-brand-bg py-2.5 pl-9 pr-4 text-sm text-foreground-950 outline-none focus:border-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-500"
        >
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="applied">Applied</option>
          <option value="contacted">Contacted</option>
          <option value="placed">Placed</option>
          <option value="dead">Dead</option>
        </select>
        <button
          onClick={fetchLeads}
          className="flex items-center gap-2 rounded-lg border border-brand-border px-4 py-2.5 text-sm font-semibold text-foreground-600 transition-colors hover:bg-background-100"
        >
          <i className="ri-refresh-line" /> Refresh
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-border border-t-primary-500" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-xl border border-brand-border bg-brand-surface p-12 text-center">
          <i className="ri-user-search-line mb-3 text-4xl text-foreground-300" />
          <p className="text-sm font-semibold text-foreground-500">No leads yet</p>
          <p className="mt-1 text-xs text-foreground-400">
            Leads appear here when drivers use the AI Match wizard at /match
          </p>
        </div>
      )}

      {/* Lead table */}
      {!loading && filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-brand-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-background-50 text-left text-xs font-semibold uppercase tracking-wider text-foreground-500">
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3 hidden sm:table-cell">CDL / Exp</th>
                <th className="px-4 py-3 hidden md:table-cell">Preferences</th>
                <th className="px-4 py-3 hidden lg:table-cell">Jobs</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 hidden sm:table-cell">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border bg-brand-surface">
              {filtered.map((lead) => (
                <Fragment key={lead.id}>
                  <tr
                    className="cursor-pointer transition-colors hover:bg-background-50"
                    onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground-950">{lead.full_name}</p>
                      <p className="text-xs text-foreground-500">{lead.email}</p>
                      <p className="text-xs text-foreground-400">{lead.phone}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="font-semibold text-foreground-950">Class {lead.cdl_class}</p>
                      <p className="text-xs text-foreground-500">{lead.experience}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {lead.equipment && (
                          <span className="rounded-md border border-brand-border px-1.5 py-0.5 text-[10px] font-medium text-foreground-500">
                            {lead.equipment}
                          </span>
                        )}
                        {lead.route_type && (
                          <span className="rounded-md border border-brand-border px-1.5 py-0.5 text-[10px] font-medium text-foreground-500">
                            {lead.route_type}
                          </span>
                        )}
                        {lead.min_pay && (
                          <span className="rounded-md border border-brand-border px-1.5 py-0.5 text-[10px] font-medium text-brand-orange">
                            ${lead.min_pay}/mi+
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-xs text-foreground-500">
                        Matched: {lead.matched_job_ids?.length ?? 0}
                      </p>
                      <p className="text-xs text-green-600 font-semibold">
                        Applied: {lead.applied_job_ids?.length ?? 0}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateStatus(lead.id, e.target.value)}
                        className={`rounded-full border-0 px-2.5 py-1 text-xs font-bold outline-none cursor-pointer ${
                          STATUS_COLORS[lead.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <option value="new">New</option>
                        <option value="applied">Applied</option>
                        <option value="contacted">Contacted</option>
                        <option value="placed">Placed</option>
                        <option value="dead">Dead</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-xs text-foreground-400">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <i className={`ri-arrow-${expanded === lead.id ? "up" : "down"}-s-line text-foreground-400`} />
                    </td>
                  </tr>

                  {expanded === lead.id && (
                    <tr className="bg-background-50">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div>
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-foreground-400">Contact</p>
                            <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-sm font-semibold text-primary-600 hover:underline">
                              <i className="ri-phone-line" /> {lead.phone}
                            </a>
                            <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-sm text-primary-600 hover:underline">
                              <i className="ri-mail-line" /> {lead.email}
                            </a>
                          </div>
                          <div>
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-foreground-400">Preferences</p>
                            <p className="text-xs text-foreground-600">Home time: {lead.home_time || "Any"}</p>
                            <p className="text-xs text-foreground-600">Min pay: {lead.min_pay ? `$${lead.min_pay}/mi` : "Any"}</p>
                            <p className="text-xs text-foreground-600">
                              States: {lead.states?.length ? lead.states.join(", ") : "Nationwide"}
                            </p>
                            {lead.endorsements?.length > 0 && (
                              <p className="text-xs text-foreground-600">Endorsements: {lead.endorsements.join(", ")}</p>
                            )}
                          </div>
                          <div>
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-foreground-400">Activity</p>
                            <p className="text-xs text-foreground-600">
                              Submitted: {new Date(lead.created_at).toLocaleString()}
                            </p>
                            {lead.applied_at && (
                              <p className="text-xs text-foreground-600">
                                Applied: {new Date(lead.applied_at).toLocaleString()}
                              </p>
                            )}
                            <p className="text-xs text-foreground-600">Source: {lead.source}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          <div className="border-t border-brand-border bg-background-50 px-4 py-2 text-xs text-foreground-400">
            {filtered.length} lead{filtered.length !== 1 ? "s" : ""} shown
          </div>
        </div>
      )}
    </div>
  );
}
