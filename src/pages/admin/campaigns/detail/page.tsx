import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "@/lib/db";
import TemplateFormModal from "./components/TemplateFormModal";

// ── AI Generation helpers ────────────────────────────────────
async function callGenerateContent(campaign: any, count: number): Promise<string[]> {
  const { data, error } = await db.functions.invoke("generate-content", {
    body: { campaign, count },
  });
  if (error) throw new Error(error.message ?? "Generation failed");
  return (data as any).posts as string[];
}

async function saveGeneratedTemplates(campaignId: string, type: string, posts: string[]) {
  const rows = posts.map((content, i) => ({
    campaign_id: Number(campaignId),
    type,
    content,
    variant_index: i + 1,
    used: false,
    performance_score: 0,
  }));
  const { error } = await db.from("content_templates").insert(rows);
  if (error) throw new Error(error.message);
}

const TYPE_LABELS: Record<string, string> = {
  intro: "Intro",
  job_post: "Job Post",
  value_content: "Value Content",
  urgency: "Urgency / Scarcity",
  testimonial: "Testimonial",
  comparison: "Comparison",
  qa: "Q&A",
  cta: "Direct CTA",
};

const TYPE_COLORS: Record<string, string> = {
  intro: "bg-blue-50 text-blue-600 border-blue-200",
  job_post: "bg-green-50 text-green-600 border-green-200",
  value_content: "bg-amber-50 text-amber-600 border-amber-200",
  urgency: "bg-red-50 text-red-600 border-red-200",
  testimonial: "bg-purple-50 text-purple-600 border-purple-200",
  comparison: "bg-teal-50 text-teal-600 border-teal-200",
  qa: "bg-sky-50 text-sky-600 border-sky-200",
  cta: "bg-pink-50 text-pink-600 border-pink-200",
};

const TYPE_ORDER = ["intro", "job_post", "value_content", "urgency", "testimonial", "comparison", "qa", "cta"];

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [queuedPosts, setQueuedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"templates" | "queue">("templates");
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [genCount, setGenCount] = useState(3);
  const [genType, setGenType] = useState("job_post");

  useEffect(() => {
    loadEverything();
  }, [id]);

  const loadEverything = async () => {
    const { data: c } = await db.from("campaigns").select("*").eq("id", id).maybeSingle();
    if (!c) { navigate("/admin/campaigns"); return; }
    setCampaign(c);

    const [{ data: t }, { data: q }] = await Promise.all([
      db.from("content_templates").select("*").eq("campaign_id", id).order("type").order("variant_index"),
      db.from("queued_posts").select("*, recruitment_groups(name)").eq("campaign_id", id).order("scheduled_at", { ascending: false }),
    ]);
    setTemplates(t ?? []);
    setQueuedPosts(q ?? []);
    setLoading(false);
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setShowTemplateForm(true);
  };

  const handleEditTemplate = (t: any) => {
    setEditingTemplate(t);
    setShowTemplateForm(true);
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm("Delete this template?")) return;
    await db.from("content_templates").delete().eq("id", templateId);
    loadEverything();
  };

  const handleToggleUsed = async (t: any) => {
    await db.from("content_templates").update({ used: !t.used }).eq("id", t.id);
    loadEverything();
  };

  const handleFormSave = () => {
    setShowTemplateForm(false);
    setEditingTemplate(null);
    loadEverything();
  };

  const handleGenerate = async () => {
    setGenError("");
    setGenerating(true);
    try {
      const posts = await callGenerateContent(campaign, genCount);
      await saveGeneratedTemplates(id!, genType, posts);
      await loadEverything();
    } catch (err: any) {
      setGenError(err.message ?? "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const groupedTemplates = () => {
    const groups: Record<string, any[]> = {};
    TYPE_ORDER.forEach((type) => {
      const items = templates.filter((t) => t.type === type);
      if (items.length > 0) groups[type] = items;
    });
    // catch any types not in TYPE_ORDER
    templates.forEach((t) => {
      if (!TYPE_ORDER.includes(t.type)) {
        if (!groups[t.type]) groups[t.type] = [];
        groups[t.type].push(t);
      }
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!campaign) return null;

  const grouped = groupedTemplates();
  const totalTypes = Object.keys(grouped).length;
  const usedCount = templates.filter((t) => t.used).length;

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/campaigns")} className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border text-foreground-500 transition-colors hover:border-primary-400 hover:text-primary-500">
            <i className="ri-arrow-left-line" />
          </button>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground-950">{campaign.name}</h1>
            <p className="text-sm text-foreground-500">{campaign.job_type} &middot; {campaign.duration_days} days &middot; <span className="capitalize">{campaign.status}</span></p>
          </div>
        </div>
      </div>

      {/* Campaign Stats Row */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-400">Templates</p>
          <p className="mt-1 font-heading text-2xl font-bold text-foreground-950">{templates.length}</p>
          <p className="text-xs text-foreground-500">{totalTypes} types</p>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-400">Used</p>
          <p className="mt-1 font-heading text-2xl font-bold text-foreground-950">{usedCount}</p>
          <p className="text-xs text-foreground-500">of {templates.length} templates</p>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-400">Queued Posts</p>
          <p className="mt-1 font-heading text-2xl font-bold text-foreground-950">{queuedPosts.length}</p>
          <p className="text-xs text-foreground-500">{queuedPosts.filter((q: any) => q.status === "published").length} published</p>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-400">Locations</p>
          <p className="mt-1 font-heading text-2xl font-bold text-foreground-950">{(campaign.locations || []).length}</p>
          <p className="text-xs text-foreground-500">target locations</p>
        </div>
      </div>

      {/* Benefits & CTA */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-foreground-500 mr-1">Benefits:</span>
        {(campaign.benefits || []).map((b: string) => (
          <span key={b} className="rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-600">{b}</span>
        ))}
        {(campaign.benefits || []).length === 0 && (
          <span className="text-xs text-foreground-400">No benefits defined</span>
        )}
        <span className="mx-2 text-foreground-200">|</span>
        <span className="text-xs font-semibold text-foreground-500">CTA:</span>
        <span className="rounded-lg bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent-600">{campaign.cta || "No CTA set"}</span>
        <span className="mx-2 text-foreground-200">|</span>
        <span className="text-xs font-semibold text-foreground-500">Locations:</span>
        {(campaign.locations || []).slice(0, 4).map((loc: string) => (
          <span key={loc} className="rounded-lg bg-background-100 px-2 py-0.5 text-[11px] text-foreground-600">{loc}</span>
        ))}
        {(campaign.locations || []).length > 4 && (
          <span className="text-[11px] text-foreground-400">+{(campaign.locations || []).length - 4} more</span>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="mb-6 inline-flex gap-1 rounded-xl border border-brand-border bg-background-50 p-1">
        <button
          onClick={() => setActiveTab("templates")}
          className={`rounded-lg px-5 py-2 text-sm font-bold transition-colors ${
            activeTab === "templates" ? "bg-primary-500 text-white" : "text-foreground-600 hover:text-foreground-950"
          }`}
        >
          <i className="ri-file-text-line mr-1.5" />
          Templates ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab("queue")}
          className={`rounded-lg px-5 py-2 text-sm font-bold transition-colors ${
            activeTab === "queue" ? "bg-primary-500 text-white" : "text-foreground-600 hover:text-foreground-950"
          }`}
        >
          <i className="ri-stack-line mr-1.5" />
          Queued ({queuedPosts.length})
        </button>
      </div>

      {/* TEMPLATES TAB */}
      {activeTab === "templates" && (
        <div>
          {/* AI Generate Panel */}
          <div className="mb-5 rounded-xl border border-brand-border bg-gradient-to-r from-primary-50 to-background-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
                  <i className="ri-sparkling-2-line text-primary-600 text-base" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground-950">Generate with AI</p>
                  <p className="text-xs text-foreground-500">Claude writes Facebook post variants for this campaign</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={genType}
                  onChange={(e) => setGenType(e.target.value)}
                  className="rounded-lg border border-brand-border bg-white px-3 py-2 text-xs font-semibold text-foreground-700 outline-none focus:border-primary-400"
                >
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select
                  value={genCount}
                  onChange={(e) => setGenCount(Number(e.target.value))}
                  className="rounded-lg border border-brand-border bg-white px-3 py-2 text-xs font-semibold text-foreground-700 outline-none focus:border-primary-400"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} variant{n !== 1 ? "s" : ""}</option>)}
                </select>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="rounded-lg bg-primary-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-600 disabled:opacity-50 whitespace-nowrap"
                >
                  {generating ? (
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                      Generating…
                    </span>
                  ) : (
                    <span><i className="ri-sparkling-2-line mr-1" />Generate</span>
                  )}
                </button>
              </div>
            </div>
            {genError && (
              <p className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">{genError}</p>
            )}
          </div>

          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-foreground-500">
              Content templates define what gets posted. Each post type can have multiple variants that rotate automatically.
            </p>
            <button
              onClick={handleNewTemplate}
              className="rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-600 whitespace-nowrap"
            >
              + New Template
            </button>
          </div>

          {templates.length === 0 ? (
            <div className="rounded-xl border border-brand-border bg-brand-surface p-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50">
                <i className="ri-article-line text-3xl text-primary-500" />
              </div>
              <h2 className="font-heading text-lg font-bold text-foreground-950">No templates yet</h2>
              <p className="mt-2 text-sm text-foreground-500 max-w-md mx-auto">
                Create content templates for this campaign. Each template type serves a different purpose:
                job posts sell the role, value content builds trust, urgency drives action.
              </p>
              <button
                onClick={handleNewTemplate}
                className="mt-5 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-600"
              >
                Create First Template
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                  {/* Type Header */}
                  <div className="mb-3 flex items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${TYPE_COLORS[type] || "bg-foreground-50 text-foreground-600 border-foreground-200"}`}>
                      {TYPE_LABELS[type] || type}
                    </span>
                    <span className="text-xs text-foreground-400">{items.length} variant{items.length > 1 ? "s" : ""}</span>
                  </div>

                  {/* Template Cards */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((t) => (
                      <div
                        key={t.id}
                        className={`group rounded-xl border bg-background-50 p-4 transition-all hover:border-primary-300 ${
                          t.used ? "border-primary-200" : "border-brand-border"
                        }`}
                      >
                        {/* Content Preview */}
                        <p className="text-xs text-foreground-800 leading-relaxed whitespace-pre-wrap line-clamp-6">
                          {t.content}
                        </p>

                        {/* Meta Row */}
                        <div className="mt-3 flex items-center justify-between border-t border-brand-border pt-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-foreground-400">#{t.variant_index}</span>
                            {t.performance_score > 0 && (
                              <span className="text-[10px] text-foreground-400">
                                <i className="ri-bar-chart-line mr-0.5" />{t.performance_score}
                              </span>
                            )}
                            <button
                              onClick={() => handleToggleUsed(t)}
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors ${
                                t.used ? "bg-green-50 text-green-600" : "bg-foreground-50 text-foreground-400 hover:text-green-600"
                              }`}
                            >
                              {t.used ? "Active" : "Unused"}
                            </button>
                          </div>
                          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => handleEditTemplate(t)}
                              className="rounded-md border border-brand-border px-2 py-1 text-[10px] font-semibold text-foreground-600 transition-colors hover:border-primary-400 hover:text-primary-500"
                            >
                              <i className="ri-edit-line" />
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(t.id)}
                              className="rounded-md border border-brand-border px-2 py-1 text-[10px] font-semibold text-foreground-600 transition-colors hover:border-red-400 hover:text-red-500"
                            >
                              <i className="ri-delete-bin-line" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUEUE TAB */}
      {activeTab === "queue" && (
        <div>
          {queuedPosts.length === 0 ? (
            <div className="rounded-xl border border-brand-border bg-brand-surface p-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-background-100">
                <i className="ri-stack-line text-3xl text-foreground-300" />
              </div>
              <h2 className="font-heading text-lg font-bold text-foreground-950">No queued posts</h2>
              <p className="mt-2 text-sm text-foreground-500 max-w-sm mx-auto">
                Posts appear here when generated from templates and scheduled for publishing.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {queuedPosts.map((q: any) => (
                <div key={q.id} className="rounded-xl border border-brand-border bg-brand-surface p-5 transition-all hover:border-primary-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground-950">{q.headline || "Untitled"}</p>
                      <p className="mt-1 text-xs text-foreground-600 line-clamp-2">{q.content}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <span className="text-[11px] text-foreground-500">
                          <i className="ri-calendar-line mr-1" />
                          {new Date(q.scheduled_at).toLocaleString()}
                        </span>
                        <span className="text-[11px] text-foreground-500">
                          <i className="ri-group-line mr-1" />
                          {q.recruitment_groups?.name || "No group"}
                        </span>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      q.status === "pending" ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
                      q.status === "published" ? "bg-green-50 text-green-600 border-green-200" :
                      q.status === "failed" ? "bg-red-50 text-red-600 border-red-200" :
                      "bg-foreground-50 text-foreground-400 border-foreground-100"
                    }`}>
                      {q.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Template Form Modal */}
      {showTemplateForm && (
        <TemplateFormModal
          template={editingTemplate}
          campaignId={id!}
          onClose={() => { setShowTemplateForm(false); setEditingTemplate(null); }}
          onSave={handleFormSave}
        />
      )}
    </div>
  );
}