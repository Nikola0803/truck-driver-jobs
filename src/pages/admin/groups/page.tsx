import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import GroupFormModal from "./components/GroupFormModal";

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  reddit: "Reddit",
  craigslist: "Craigslist",
  linkedin: "LinkedIn",
};

export default function GroupsList() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);

  const loadGroups = () => {
    setLoading(true);
    supabase
      .from("recruitment_groups")
      .select("*, posts_count, last_post_status, last_post_error, fb_group_id")
      .order("priority")
      .order("name")
      .then(({ data }) => {
        setGroups(data ?? []);
        setLoading(false);
      });
  };

  useEffect(() => { loadGroups(); }, []);

  const handleNew = () => {
    setEditingGroup(null);
    setShowForm(true);
  };

  const handleEdit = (g: any) => {
    setEditingGroup(g);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingGroup(null);
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingGroup(null);
    loadGroups();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this group? This action cannot be undone.")) return;
    await supabase.from("recruitment_groups").delete().eq("id", id);
    loadGroups();
  };

  const filtered = platformFilter === "all" ? groups : groups.filter((g: any) => g.platform === platformFilter);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground-950">Group Database</h1>
          <p className="mt-1 text-sm text-foreground-600">{groups.length} groups across platforms. Manage where your campaigns get published.</p>
        </div>
        <button
          onClick={handleNew}
          className="rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-600 whitespace-nowrap"
        >
          + Add Group
        </button>
      </div>

      {/* Platform Filter */}
      <div className="mb-6 flex gap-1 rounded-xl border border-brand-border bg-brand-surface p-1 w-fit">
        {["all", "facebook", "reddit", "craigslist", "linkedin"].map((p) => (
          <button
            key={p}
            onClick={() => setPlatformFilter(p)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors capitalize ${
              platformFilter === p ? "bg-primary-500 text-white" : "text-foreground-600 hover:text-foreground-950"
            }`}
          >
            {p === "all" ? "All" : PLATFORM_LABELS[p] || p}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-brand-border bg-background-50">
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Group</th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Platform</th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Members</th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Posts</th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Last Posted</th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Priority</th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Status</th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g: any) => (
                <tr key={g.id} className="border-b border-brand-border/50 last:border-0 hover:bg-background-50">
                  <td className="px-5 py-3 max-w-xs">
                    <p className="text-sm font-bold text-foreground-950 truncate">{g.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {g.fb_group_id && (
                        <a
                          href={g.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary-500 hover:underline"
                        >
                          <i className="ri-external-link-line mr-0.5" />Open
                        </a>
                      )}
                      {g.notes && <p className="text-[11px] text-foreground-400 truncate">{g.notes.slice(0, 40)}{g.notes.length > 40 ? "..." : ""}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-md bg-background-100 px-2 py-0.5 text-xs font-semibold text-foreground-600 capitalize">{PLATFORM_LABELS[g.platform] || g.platform}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-foreground-600">{(g.members_count || 0).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-bold text-foreground-950">{g.posts_count || 0}</p>
                    {g.last_post_status && (
                      <span className={`text-[10px] font-semibold ${
                        g.last_post_status === "success" ? "text-green-600" : "text-red-500"
                      }`}>
                        {g.last_post_status === "success" ? "✓ last ok" : "✗ last failed"}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-foreground-500">{g.last_posted_at ? new Date(g.last_posted_at).toLocaleDateString() : "Never"}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      g.priority === "high" ? "bg-red-50 text-red-600" :
                      g.priority === "medium" ? "bg-yellow-50 text-yellow-600" :
                      "bg-foreground-50 text-foreground-400"
                    }`}>{g.priority}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                      g.status === "active" ? "bg-green-50 text-green-600 border-green-200" : "bg-foreground-50 text-foreground-400 border-foreground-100"
                    }`}>{g.status}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(g)}
                        className="rounded-md border border-brand-border px-2 py-1 text-xs font-semibold text-foreground-600 transition-colors hover:border-primary-400 hover:text-primary-500 whitespace-nowrap"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(g.id)}
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

      {showForm && (
        <GroupFormModal
          group={editingGroup}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}
    </div>
  );
}