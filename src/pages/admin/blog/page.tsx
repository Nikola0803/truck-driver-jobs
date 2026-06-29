import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import BlogPostFormModal from "./components/BlogPostFormModal";

export default function BlogManager() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [search, setSearch] = useState("");

  const loadPosts = useCallback(() => {
    setLoading(true);
    supabase.from("blog_posts").select("*").order("published_at", { ascending: false }).then(({ data }) => {
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
    await supabase.from("blog_posts").delete().eq("id", id);
    loadPosts();
  };

  const handleToggleFeatured = async (p: any) => {
    await supabase.from("blog_posts").update({ featured: !p.featured, updated_at: new Date().toISOString() }).eq("id", p.id);
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
        <button
          onClick={handleNew}
          className="rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-600 whitespace-nowrap"
        >
          + New Post
        </button>
      </div>

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