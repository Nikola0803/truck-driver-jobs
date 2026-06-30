import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "@/lib/db";
import CampaignFormModal from "./components/CampaignFormModal";

export default function CampaignsList() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);

  const loadCampaigns = () => {
    setLoading(true);
    db.from("campaigns").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setCampaigns(data ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { loadCampaigns(); }, []);

  const handleNew = () => {
    setEditingCampaign(null);
    setShowForm(true);
  };

  const handleEdit = (c: any) => {
    setEditingCampaign(c);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCampaign(null);
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingCampaign(null);
    loadCampaigns();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this campaign? Queued posts and templates will remain.")) return;
    await db.from("campaigns").delete().eq("id", id);
    loadCampaigns();
  };

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
          <h1 className="font-heading text-2xl font-bold text-foreground-950">Campaigns</h1>
          <p className="mt-1 text-sm text-foreground-600">Create and manage recruitment campaigns. Each campaign targets specific locations, job types, and benefits.</p>
        </div>
        <button
          onClick={handleNew}
          className="rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-600 whitespace-nowrap"
        >
          + New Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-brand-border bg-brand-surface p-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50">
            <i className="ri-megaphone-line text-3xl text-primary-500" />
          </div>
          <h2 className="font-heading text-lg font-bold text-foreground-950">No campaigns yet</h2>
          <p className="mt-2 text-sm text-foreground-500 max-w-sm mx-auto">Create your first campaign to start generating AI content and scheduling posts across recruitment groups.</p>
          <button
            onClick={handleNew}
            className="mt-5 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-600"
          >
            Create First Campaign
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c: any) => (
            <div
              key={c.id}
              className="rounded-xl border border-brand-border bg-brand-surface p-6 transition-all hover:border-primary-300"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                  <i className="ri-megaphone-line text-primary-500" />
                </div>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                  c.status === "active" ? "bg-green-50 text-green-600 border-green-200" :
                  c.status === "draft" ? "bg-foreground-100 text-foreground-600 border-foreground-200" :
                  c.status === "paused" ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
                  "bg-foreground-50 text-foreground-400 border-foreground-100"
                }`}>
                  {c.status}
                </span>
              </div>
              <Link to={`/admin/campaigns/${c.id}`} className="block">
                <h3 className="font-heading text-base font-bold text-foreground-950 hover:text-primary-500 transition-colors">{c.name}</h3>
              </Link>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-foreground-500">{c.job_type || "No job type"} &middot; {c.duration_days} days</p>
                <div className="flex flex-wrap gap-1">
                  {(c.benefits || []).slice(0, 3).map((b: string) => (
                    <span key={b} className="rounded-md bg-background-100 px-2 py-0.5 text-[10px] font-semibold text-foreground-600">{b}</span>
                  ))}
                  {(c.benefits || []).length > 3 && (
                    <span className="text-[10px] text-foreground-400">+{c.benefits.length - 3} more</span>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-2 border-t border-brand-border pt-3">
                <button
                  onClick={() => handleEdit(c)}
                  className="flex-1 rounded-md border border-brand-border px-3 py-1.5 text-xs font-semibold text-foreground-600 transition-colors hover:border-primary-400 hover:text-primary-500 whitespace-nowrap"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="rounded-md border border-brand-border px-3 py-1.5 text-xs font-semibold text-foreground-600 transition-colors hover:border-red-400 hover:text-red-500 whitespace-nowrap"
                >
                  <i className="ri-delete-bin-line" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <CampaignFormModal
          campaign={editingCampaign}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}
    </div>
  );
}