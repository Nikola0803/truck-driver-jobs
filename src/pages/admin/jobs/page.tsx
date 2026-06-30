import { useState, useEffect } from "react";
import { db } from "@/lib/db";

const ROUTE_TYPES = ["OTR", "Regional", "Dedicated", "Local", "Team"];
const EQUIPMENT_TYPES = ["53'' Dry Van", "53'' Reefer", "48'' Flatbed", "48'' Step Deck", "Tanker", "Day Cab / Box", "Chassis / Container"];
const EXPERIENCE_OPTIONS = ["Less than 1 Year", "6+ Months", "1+ Years", "1-3 Years", "2+ Years", "3+ Years"];
const PAY_PERIODS = ["CPM", "Weekly", "Monthly", "Hourly"];
const HOME_TIME_OPTIONS = ["Home Daily", "Home Weekly", "Home Every Weekend", "Home Every 2 Weeks", "Home Every 14 Days"];
const BADGE_OPTIONS = ["", "New", "Urgently Hiring", "Featured"];
const STATUS_OPTIONS = ["active", "paused", "filled"];

const EMPTY_FORM = {
  title: "",
  company: "",
  location: "",
  city: "",
  state: "",
  route_type: "OTR",
  equipment: "53'' Dry Van",
  experience_required: "1+ Years",
  truck_info: "",
  pay_rate: "",
  pay_period: "CPM",
  home_time: "Home Every 2 Weeks",
  description: "",
  benefits: "",
  requirements: "",
  featured: false,
  badge: "",
  status: "active",
};

function JobFormModal({
  job,
  onClose,
  onSave,
}: {
  job: any | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const isEdit = !!job;
  const [form, setForm] = useState(() => {
    if (!job) return EMPTY_FORM;
    return {
      title: job.title ?? "",
      company: job.company ?? "",
      location: job.location ?? "",
      city: job.city ?? "",
      state: job.state ?? "",
      route_type: job.route_type ?? "OTR",
      equipment: job.equipment ?? "53'' Dry Van",
      experience_required: job.experience_required ?? "1+ Years",
      truck_info: job.truck_info ?? "",
      pay_rate: job.pay_rate ?? "",
      pay_period: job.pay_period ?? "CPM",
      home_time: job.home_time ?? "Home Every 2 Weeks",
      description: job.description ?? "",
      benefits: Array.isArray(job.benefits) ? job.benefits.join("\n") : "",
      requirements: Array.isArray(job.requirements) ? job.requirements.join("\n") : "",
      featured: job.featured ?? false,
      badge: job.badge ?? "",
      status: job.status ?? "active",
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.company.trim() || !form.location.trim()) {
      setError("Title, company, and location are required.");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      benefits: form.benefits.split("\n").map((s: string) => s.trim()).filter(Boolean),
      requirements: form.requirements.split("\n").map((s: string) => s.trim()).filter(Boolean),
      badge: form.badge || null,
    };
    let err;
    if (isEdit) {
      ({ error: err } = await db.from("jobs").update(payload).eq("id", job.id));
    } else {
      ({ error: err } = await db.from("jobs").insert([payload]));
    }
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-brand-border bg-brand-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border px-6 py-4">
          <h2 className="font-heading text-lg font-bold text-foreground-950">
            {isEdit ? "Edit Job" : "New Job"}
          </h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border text-foreground-500 hover:text-foreground-950">
            <i className="ri-close-line" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[80vh]">
          <div className="space-y-5 p-6">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            {/* Title + Company */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground-500">Job Title *</span>
                <input
                  required
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="OTR Dry Van - No-Touch Freight"
                  className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground-500">Company *</span>
                <input
                  required
                  value={form.company}
                  onChange={(e) => set("company", e.target.value)}
                  placeholder="Schneider National"
                  className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
                />
              </label>
            </div>

            {/* Location */}
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block sm:col-span-1">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground-500">Location (display) *</span>
                <input
                  required
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="Dallas, TX"
                  className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground-500">City</span>
                <input
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="Dallas"
                  className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground-500">State</span>
                <input
                  value={form.state}
                  onChange={(e) => set("state", e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="TX"
                  maxLength={2}
                  className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 uppercase outline-none focus:border-primary-400"
                />
              </label>
            </div>

            {/* Route + Equipment */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground-500">Route Type</span>
                <select
                  value={form.route_type}
                  onChange={(e) => set("route_type", e.target.value)}
                  className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
                >
                  {ROUTE_TYPES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground-500">Equipment</span>
                <select
                  value={form.equipment}
                  onChange={(e) => set("equipment", e.target.value)}
                  className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
                >
                  {EQUIPMENT_TYPES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </label>
            </div>

            {/* Pay + Period */}
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block sm:col-span-1">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground-500">Pay Rate</span>
                <input
                  value={form.pay_rate}
                  onChange={(e) => set("pay_rate", e.target.value)}
                  placeholder="$0.72 CPM or $1,300/Week"
                  className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground-500">Pay Period</span>
                <select
                  value={form.pay_period}
                  onChange={(e) => set("pay_period", e.target.value)}
                  className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
                >
                  {PAY_PERIODS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground-500">Experience</span>
                <select
                  value={form.experience_required}
                  onChange={(e) => set("experience_required", e.target.value)}
                  className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
                >
                  {EXPERIENCE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </label>
            </div>

            {/* Home Time + Truck Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground-500">Home Time</span>
                <select
                  value={form.home_time}
                  onChange={(e) => set("home_time", e.target.value)}
                  className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
                >
                  {HOME_TIME_OPTIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground-500">Truck Info</span>
                <input
                  value={form.truck_info}
                  onChange={(e) => set("truck_info", e.target.value)}
                  placeholder="2024 Freightliner Cascadia"
                  className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
                />
              </label>
            </div>

            {/* Description */}
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground-500">Description</span>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="OTR operation across the continental US..."
                className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400 resize-none"
              />
            </label>

            {/* Benefits */}
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground-500">Benefits <span className="text-foreground-400 normal-case font-normal">(one per line)</span></span>
              <textarea
                rows={4}
                value={form.benefits}
                onChange={(e) => set("benefits", e.target.value)}
                placeholder={"Health insurance from day 1\n401k with company match\nNo-touch freight"}
                className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400 resize-none"
              />
            </label>

            {/* Requirements */}
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground-500">Requirements <span className="text-foreground-400 normal-case font-normal">(one per line)</span></span>
              <textarea
                rows={3}
                value={form.requirements}
                onChange={(e) => set("requirements", e.target.value)}
                placeholder={"Valid Class A CDL\nClean MVR\nPass DOT physical and drug screen"}
                className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400 resize-none"
              />
            </label>

            {/* Badge + Status + Featured */}
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground-500">Badge</span>
                <select
                  value={form.badge}
                  onChange={(e) => set("badge", e.target.value)}
                  className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
                >
                  {BADGE_OPTIONS.map((b) => <option key={b} value={b}>{b || "None"}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground-500">Status</span>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                  className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="flex cursor-pointer items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => set("featured", e.target.checked)}
                  className="h-4 w-4 accent-primary-500"
                />
                <span className="text-sm font-semibold text-foreground-700">Featured on homepage</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-brand-border px-6 py-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-foreground-600 transition-colors hover:bg-background-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary-500 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("active");
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [clearing, setClearing] = useState(false);

  const token = localStorage.getItem("tdj_token");

  const loadJobs = () => {
    setLoading(true);
    db
      .from("jobs")
      .select("id, title, company, location, route_type, equipment, pay_rate, pay_period, featured, badge, status, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setJobs(data ?? []);
        setLoading(false);
      });
  };

  useEffect(() => { loadJobs(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this job listing? This cannot be undone.")) return;
    await db.from("jobs").delete().eq("id", id);
    loadJobs();
  };

  const handleClearAll = async () => {
    if (!confirm(`Delete ALL ${jobs.length} job listings? This cannot be undone.`)) return;
    setClearing(true);
    try {
      await fetch("/api/admin/jobs/all", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      loadJobs();
    } finally {
      setClearing(false);
    }
  };

  const filtered = statusFilter === "all" ? jobs : jobs.filter((j) => j.status === statusFilter);
  const counts = {
    active: jobs.filter((j) => j.status === "active").length,
    paused: jobs.filter((j) => j.status === "paused").length,
    filled: jobs.filter((j) => j.status === "filled").length,
  };

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground-950">Job Listings</h1>
          <p className="mt-1 text-sm text-foreground-600">
            {jobs.filter((j) => j.status === "active").length} active &middot; {jobs.length} total positions
          </p>
        </div>
        <div className="flex items-center gap-3">
          {jobs.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 whitespace-nowrap"
            >
              {clearing ? "Clearing…" : `Clear All (${jobs.length})`}
            </button>
          )}
          <button
            onClick={() => { setEditingJob(null); setShowForm(true); }}
            className="rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-600 whitespace-nowrap"
          >
            + New Job
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex gap-1 rounded-xl border border-brand-border bg-brand-surface p-1 w-fit">
        {[
          { id: "active", label: `Active (${counts.active})` },
          { id: "paused", label: `Paused (${counts.paused})` },
          { id: "filled", label: `Filled (${counts.filled})` },
          { id: "all", label: "All" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              statusFilter === f.id ? "bg-primary-500 text-white" : "text-foreground-600 hover:text-foreground-950"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-brand-border bg-brand-surface p-16 text-center">
          <i className="ri-briefcase-line text-3xl text-foreground-300" />
          <p className="mt-3 text-sm text-foreground-500">No {statusFilter !== "all" ? statusFilter : ""} job listings.</p>
          <button
            onClick={() => { setEditingJob(null); setShowForm(true); }}
            className="mt-4 rounded-lg bg-primary-500 px-4 py-2 text-sm font-bold text-white hover:bg-primary-600"
          >
            Create First Job
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-brand-border bg-brand-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-brand-border bg-background-50">
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Job</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Route / Equipment</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Pay</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Badge</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Status</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((job) => (
                  <tr key={job.id} className="border-b border-brand-border/50 last:border-0 hover:bg-background-50">
                    <td className="px-5 py-3 max-w-xs">
                      <div className="flex items-center gap-2">
                        {job.featured && <i className="ri-star-fill text-amber-400 text-xs shrink-0" title="Featured" />}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground-950 truncate">{job.title}</p>
                          <p className="text-xs text-foreground-500 truncate">{job.company} &middot; {job.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-semibold text-foreground-700">{job.route_type}</p>
                      <p className="text-xs text-foreground-500">{job.equipment}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-semibold text-foreground-700">{job.pay_rate || "-"}</p>
                      <p className="text-xs text-foreground-500">{job.pay_period}</p>
                    </td>
                    <td className="px-5 py-3">
                      {job.badge ? (
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                          job.badge === "New" ? "bg-blue-50 text-blue-600 border-blue-200" :
                          job.badge === "Urgently Hiring" ? "bg-red-50 text-red-600 border-red-200" :
                          "bg-primary-50 text-primary-600 border-primary-200"
                        }`}>{job.badge}</span>
                      ) : (
                        <span className="text-xs text-foreground-300">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                        job.status === "active" ? "bg-green-50 text-green-600 border-green-200" :
                        job.status === "paused" ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
                        "bg-foreground-50 text-foreground-400 border-foreground-200"
                      }`}>{job.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditingJob(job); setShowForm(true); }}
                          className="rounded-md border border-brand-border px-2 py-1 text-xs font-semibold text-foreground-600 transition-colors hover:border-primary-400 hover:text-primary-500 whitespace-nowrap"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="rounded-md border border-brand-border px-2 py-1 text-xs font-semibold text-foreground-600 transition-colors hover:border-red-400 hover:text-red-500"
                        >
                          <i className="ri-delete-bin-line" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <JobFormModal
          job={editingJob}
          onClose={() => { setShowForm(false); setEditingJob(null); }}
          onSave={() => { setShowForm(false); setEditingJob(null); loadJobs(); }}
        />
      )}
    </div>
  );
}
