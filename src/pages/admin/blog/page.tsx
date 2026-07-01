import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/db";
import BlogPostFormModal from "./components/BlogPostFormModal";

export default function BlogManager() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [search, setSearch] = useState("");

  // AI generation state
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiCategory, setAiCategory] = useState("Career Tips");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState<any>(null);
  const [aiError, setAiError] = useState("");
  const [aiSaving, setAiSaving] = useState(false);

  const CATEGORIES = ["Career Tips", "Regulations", "Equipment", "Pay & Benefits", "Owner-Operator", "Health & Wellness", "Routes & Lifestyle"];

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) return;
    setAiGenerating(true);
    setAiPreview(null);
    setAiError("");
    try {
      const res = await fetch("/api/admin/blog/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("tdj_token")}`,
        },
        body: JSON.stringify({ topic: aiTopic, category: aiCategory }),
      });
      const data = await res.json();
      if (!res.ok) { setAiError(data.message ?? "Generation failed"); return; }
      setAiPreview(data.post);
    } catch {
      setAiError("Network error");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAiSave = async () => {
    if (!aiPreview) return;
    setAiSaving(true);
    try {
      const res = await fetch("/api/admin/blog/save-generated", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("tdj_token")}`,
        },
        body: JSON.stringify(aiPreview),
      });
      if (res.ok) {
        setShowAiPanel(false);
        setAiPreview(null);
        setAiTopic("");
        loadPosts();
      }
    } finally {
      setAiSaving(false);
    }
  };

  const loadPosts = useCallback(() => {
    setLoading(true);
    db.from("blog_posts").select("*").order("published_at", { ascending: false }).then(({ data }) => {
      setPosts(data ?? []);
      setLoading(false);
    });
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleNew = () => {
    setEditingPost(null);
    setShowForm(true);
  };

  const handleEdit = (p: any) => {
    setEditingPost(p);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this blog post permanently?")) return;
    await db.from("blog_posts").delete().eq("id", id);
    loadPosts();
  };

  const handleToggleFeatured = async (p: any) => {
    await db.from("blog_posts").update({ featured: !p.featured, updated_at: new Date().toISOString() }).eq("id", p.id);
    loadPosts();
  };

  const filtered = search.trim()
    ? posts.filter((p: any) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
      )
    : posts;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground-950">Blog Posts</h1>
          <p className="mt-1 text-sm text-foreground-600">{posts.length} articles. Manage your content for SEO and driver engagement.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowAiPanel(!showAiPanel); setAiPreview(null); setAiError(""); }}
            className="flex items-center gap-2 rounded-lg border border-brand-orange bg-brand-orange-light px-4 py-2.5 text-sm font-bold text-brand-orange transition-colors hover:bg-brand-orange hover:text-white whitespace-nowrap"
          >
            <i className="ri-sparkling-2-line" /> Generate with AI
          </button>
          <button
            onClick={handleNew}
            className="rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-600 whitespace-nowrap"
          >
            + New Post
          </button>
        </div>
      </div>

      {/* AI Generation Panel */}
      {showAiPanel && (
        <div className="mb-6 rounded-xl border border-brand-orange/30 bg-brand-orange-light/20 p-5">
          <div className="mb-4 flex items-center gap-2">
            <i className="ri-sparkling-2-line text-brand-orange text-lg" />
            <h2 className="text-sm font-bold text-foreground-950">AI Blog Post Generator</h2>
            <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">Claude Haiku · Ultra Low Cost</span>
          </div>

          {!aiPreview ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-foreground-600">Topic / Keyword</label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAiGenerate()}
                    placeholder="e.g. how much do flatbed drivers make, CDL-A jobs in Texas..."
                    className="w-full rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground-600">Category</label>
                  <select
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value)}
                    className="w-full rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-brand-orange"
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {aiError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">{aiError}</div>
              )}
              <button
                onClick={handleAiGenerate}
                disabled={aiGenerating || !aiTopic.trim()}
                className="flex items-center gap-2 rounded-lg bg-brand-orange px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-orange-hover disabled:opacity-50"
              >
                {aiGenerating ? (
                  <><i className="ri-loader-4-line animate-spin" /> Writing post... (20–30s)</>
                ) : (
                  <><i className="ri-quill-pen-line" /> Generate Post</>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-brand-border bg-white p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-bold text-foreground-950">{aiPreview.title}</p>
                    <p className="text-xs text-foreground-500 mt-0.5">/{aiPreview.slug}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-brand-orange-light px-2 py-0.5 text-[10px] font-bold text-brand-orange">{aiPreview.category}</span>
                </div>
                <p className="text-xs text-foreground-600 mb-2">{aiPreview.meta_description}</p>
                <p className="text-xs text-foreground-500 italic">{aiPreview.excerpt}</p>
                <div className="mt-3 border-t border-brand-border pt-3">
                  <p className="text-[11px] text-foreground-400">{aiPreview.read_time} · {aiPreview.content.length} chars · {Math.round(aiPreview.content.split(" ").length)} words</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAiSave}
                  disabled={aiSaving}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {aiSaving ? <><i className="ri-loader-4-line animate-spin" /> Saving...</> : <><i className="ri-check-line" /> Publish Post</>}
                </button>
                <button
                  onClick={() => { setAiPreview(null); }}
                  className="rounded-lg border border-brand-border px-4 py-2.5 text-sm font-semibold text-foreground-600 hover:border-foreground-400"
                >
                  Regenerate
                </button>
                <button
                  onClick={() => { setShowAiPanel(false); setAiPreview(null); }}
                  className="ml-auto rounded-lg border border-brand-border px-4 py-2.5 text-sm text-foreground-500 hover:border-foreground-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or category..."
          className="w-full rounded-lg border border-brand-border bg-brand-surface px-4 py-2.5 text-sm text-foreground-950 outline-none focus:border-accent-400 sm:w-80"
        />
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-brand-border bg-background-50">
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Title</th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Category</th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Published</th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Read Time</th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Featured</th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => (
                <tr key={p.id} className="border-b border-brand-border/50 last:border-0 hover:bg-background-50">
                  <td className="px-5 py-3">
                    <p className="text-sm font-bold text-foreground-950">{p.title}</p>
                    <p className="text-[11px] text-foreground-400 mt-0.5 line-clamp-1">{p.excerpt}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-md bg-background-100 px-2 py-0.5 text-xs font-semibold text-foreground-600">{p.category}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-foreground-600">{p.published_at ? new Date(p.published_at).toLocaleDateString() : "Draft"}</td>
                  <td className="px-5 py-3 text-sm text-foreground-600">{p.read_time || "N/A"}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleFeatured(p)}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase transition-colors ${
                        p.featured ? "bg-yellow-50 text-yellow-600" : "bg-foreground-50 text-foreground-400 hover:text-yellow-600"
                      }`}
                    >
                      {p.featured ? "Featured" : "Regular"}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(p)}
                        className="rounded-md border border-brand-border px-2 py-1 text-xs font-semibold text-foreground-600 transition-colors hover:border-accent-400 hover:text-accent-600 whitespace-nowrap"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="rounded-md border border-brand-border px-2 py-1 text-xs font-semibold text-foreground-600 transition-colors hover:border-red-400 hover:text-red-500"
                      >
                        <i className="ri-delete-bin-line" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-foreground-500">
                    No blog posts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <BlogPostFormModal
          post={editingPost}
          onClose={() => { setShowForm(false); setEditingPost(null); }}
          onSave={() => { setShowForm(false); setEditingPost(null); loadPosts(); }}
        />
      )}
    </div>
  );
}