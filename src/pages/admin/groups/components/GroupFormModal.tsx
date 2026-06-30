import { useState } from "react";

const PLATFORMS = ["facebook", "reddit", "craigslist", "linkedin"];
const CATEGORIES = ["OTR", "Regional", "Dedicated", "Local", "All"];
const STATES = [
  "USA", "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois",
  "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana",
  "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah",
  "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
];

interface GroupFormProps {
  group?: any;
  onClose: () => void;
  onSave: () => void;
}

export default function GroupFormModal({ group, onClose, onSave }: GroupFormProps) {
  const [name, setName] = useState(group?.name || "");
  const [platform, setPlatform] = useState(group?.platform || "facebook");
  const [url, setUrl] = useState(group?.url || "");
  const [membersCount, setMembersCount] = useState(group?.members_count || 0);
  const [category, setCategory] = useState(group?.category || "All");
  const [state, setState] = useState(group?.state || "USA");
  const [allowsPosts, setAllowsPosts] = useState(group?.allows_posts !== false);
  const [priority, setPriority] = useState(group?.priority || "medium");
  const [status, setStatus] = useState(group?.status || "active");
  const [notes, setNotes] = useState(group?.notes || "");
  const [saving, setSaving] = useState(false);

  const isEdit = !!group;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const payload = {
      name: name.trim(),
      platform,
      url: url.trim() || null,
      members_count: membersCount,
      category,
      state,
      allows_posts: allowsPosts,
      priority,
      status,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { db } = await import("@/lib/db");

    if (isEdit) {
      await db.from("recruitment_groups").update(payload).eq("id", group.id);
    } else {
      await db.from("recruitment_groups").insert({ ...payload, created_at: new Date().toISOString() });
    }

    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16">
      <div className="w-full max-w-xl rounded-2xl border border-brand-border bg-brand-surface">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border px-6 py-4">
          <h2 className="font-heading text-xl font-bold text-foreground-950">
            {isEdit ? "Edit Group" : "Add Group"}
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
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">Group Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Truck Drivers USA"
              className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p} className="capitalize">{p === "facebook" ? "Facebook" : p === "reddit" ? "Reddit" : p === "craigslist" ? "Craigslist" : "LinkedIn"}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">Members</label>
              <input
                type="number"
                value={membersCount}
                onChange={(e) => setMembersCount(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
              >
                {STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowsPosts}
                onChange={(e) => setAllowsPosts(e.target.checked)}
                className="h-4 w-4 rounded border-brand-border accent-primary-500"
              />
              <span className="text-sm text-foreground-700">Allows Posts</span>
            </label>
            <div>
              <span className="mr-2 text-sm font-semibold text-foreground-700">Priority:</span>
              <div className="inline-flex gap-1 rounded-lg border border-brand-border bg-background-50 p-1">
                {["high", "medium", "low"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`rounded-md px-3 py-1 text-xs font-bold capitalize transition-colors ${
                      priority === p ? "bg-primary-500 text-white" : "text-foreground-600 hover:text-foreground-950"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="mr-2 text-sm font-semibold text-foreground-700">Status:</span>
              <div className="inline-flex gap-1 rounded-lg border border-brand-border bg-background-50 p-1">
                {["active", "paused", "banned"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`rounded-md px-3 py-1 text-xs font-bold capitalize transition-colors ${
                      status === s ? "bg-primary-500 text-white" : "text-foreground-600 hover:text-foreground-950"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Morning posts perform best..."
              className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400 resize-none"
            />
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
            {saving ? "Saving..." : isEdit ? "Update Group" : "Add Group"}
          </button>
        </div>
      </div>
    </div>
  );
}