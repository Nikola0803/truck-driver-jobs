import { useState, useEffect } from "react";

const JOB_TYPES = ["Regional", "OTR", "Dedicated", "Local", "Team"];
const COMMON_BENEFITS = [
  "Home Weekly", "Home Every Weekend", "Home Daily", "Weekly Pay",
  "401k", "Sign-On Bonus", "Health Insurance", "Rider Policy",
  "Pet Policy", "New Equipment", "Referral Bonus", "Paid Training",
  "Hazmat Bonus", "Quarterly Safety Bonus", "Union Benefits", "6-Month Raise",
  "Top Pay CPM", "Hourly Pay", "Benefits Day 1", "No Touch Freight",
];

interface CampaignFormProps {
  campaign?: any;
  onClose: () => void;
  onSave: () => void;
}

export default function CampaignFormModal({ campaign, onClose, onSave }: CampaignFormProps) {
  const [name, setName] = useState(campaign?.name || "");
  const [locations, setLocations] = useState<string[]>(campaign?.locations || []);
  const [jobType, setJobType] = useState(campaign?.job_type || "Regional");
  const [benefits, setBenefits] = useState<string[]>(campaign?.benefits || []);
  const [cta, setCta] = useState(campaign?.cta || "");
  const [duration, setDuration] = useState(campaign?.duration_days || 30);
  const [status, setStatus] = useState(campaign?.status || "draft");
  const [saving, setSaving] = useState(false);
  const [locationInput, setLocationInput] = useState("");

  const isEdit = !!campaign;

  const addLocation = (loc: string) => {
    const trimmed = loc.trim();
    if (trimmed && !locations.includes(trimmed)) {
      setLocations([...locations, trimmed]);
    }
    setLocationInput("");
  };

  const toggleBenefit = (b: string) => {
    setBenefits((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const payload = {
      name: name.trim(),
      locations,
      job_type: jobType,
      benefits,
      cta: cta.trim(),
      duration_days: duration,
      status,
      updated_at: new Date().toISOString(),
    };

    const { supabase } = await import("@/lib/supabase");

    if (isEdit) {
      await supabase.from("campaigns").update(payload).eq("id", campaign.id);
    } else {
      await supabase.from("campaigns").insert({ ...payload, created_at: new Date().toISOString() });
    }

    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16">
      <div className="w-full max-w-2xl rounded-2xl border border-brand-border bg-brand-surface">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border px-6 py-4">
          <h2 className="font-heading text-xl font-bold text-foreground-950">
            {isEdit ? "Edit Campaign" : "New Campaign"}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border text-foreground-500 transition-colors hover:border-primary-400 hover:text-primary-500"
          >
            <i className="ri-close-line" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          {/* Name */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">Campaign Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Texas CDL Drivers"
              className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
            />
          </div>

          {/* Locations */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">Target Locations</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {locations.map((loc) => (
                <span key={loc} className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-600">
                  {loc}
                  <button onClick={() => setLocations(locations.filter((l) => l !== loc))} className="hover:text-primary-800">
                    <i className="ri-close-line" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLocation(locationInput); } }}
                placeholder="Add state or city..."
                className="flex-1 rounded-lg border border-brand-border bg-background-50 px-3 py-2 text-sm text-foreground-950 outline-none focus:border-primary-400"
              />
              <button
                type="button"
                onClick={() => addLocation(locationInput)}
                className="rounded-lg border border-brand-border px-3 py-2 text-sm font-semibold text-foreground-600 transition-colors hover:border-primary-400 hover:text-primary-500 whitespace-nowrap"
              >
                Add
              </button>
            </div>
          </div>

          {/* Job Type + Duration */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">Job Type</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
              >
                {JOB_TYPES.map((jt) => (
                  <option key={jt} value={jt}>{jt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">Duration (Days)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                min={1}
                max={365}
                className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
              />
            </div>
          </div>

          {/* Benefits */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">Benefits ({benefits.length} selected)</label>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto rounded-lg border border-brand-border bg-background-50 p-3">
              {COMMON_BENEFITS.map((b) => (
                <button
                  key={b}
                  onClick={() => toggleBenefit(b)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                    benefits.includes(b)
                      ? "bg-primary-500 text-white"
                      : "bg-white border border-brand-border text-foreground-600 hover:border-primary-300"
                  }`}
                >
                  {benefits.includes(b) && <i className="ri-check-line mr-1" />}
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">Call to Action</label>
            <input
              type="text"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="e.g. Apply at TruckDriverJobs.co"
              className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
            />
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">Status</label>
            <div className="flex gap-1 rounded-xl border border-brand-border bg-background-50 p-1 w-fit">
              {["draft", "active", "paused", "completed"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`rounded-lg px-4 py-2 text-xs font-bold capitalize transition-colors ${
                    status === s
                      ? "bg-primary-500 text-white"
                      : "text-foreground-600 hover:text-foreground-950"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-brand-border px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-brand-border px-4 py-2.5 text-sm font-semibold text-foreground-600 transition-colors hover:border-foreground-400 whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {saving ? "Saving..." : isEdit ? "Update Campaign" : "Create Campaign"}
          </button>
        </div>
      </div>
    </div>
  );
}