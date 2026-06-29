import { useState } from "react";
import { supabase } from "@/lib/supabase";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

interface BlogPostFormProps {
  post?: any;
  onClose: () => void;
  onSave: () => void;
}

export default function BlogPostFormModal({ post, onClose, onSave }: BlogPostFormProps) {
  const [title, setTitle] = useState(post?.title || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [content, setContent] = useState(post?.content || "");
  const [category, setCategory] = useState(post?.category || "Career Guides");
  const [readTime, setReadTime] = useState(post?.read_time || "5 min read");
  const [publishedAt, setPublishedAt] = useState(post?.published_at ? new Date(post.published_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
  const [featured, setFeatured] = useState(post?.featured || false);
  const [imageUrl, setImageUrl] = useState(post?.image_url || "");
  const [metaDescription, setMetaDescription] = useState(post?.meta_description || "");
  const [saving, setSaving] = useState(false);

  const isEdit = !!post;

  const handleTitleBlur = () => {
    if (!isEdit && title && !slug) {
      setSlug(slugify(title));
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) return;
    setSaving(true);

    const payload = {
      title: title.trim(),
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""),
      excerpt: excerpt.trim(),
      content: content.trim(),
      category,
      read_time: readTime,
      published_at: publishedAt,
      featured,
      image_url: imageUrl.trim() || null,
      meta_description: metaDescription.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (isEdit) {
      await supabase.from("blog_posts").update(payload).eq("id", post.id);
    } else {
      await supabase.from("blog_posts").insert({ ...payload, created_at: new Date().toISOString() });
    }

    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12">
      <div className="w-full max-w-3xl rounded-2xl border border-brand-border bg-brand-surface">
        <div className="flex items-center justify-between border-b border-brand-border px-6 py-4">
          <h2 className="font-heading text-xl font-bold text-foreground-950">
            {isEdit ? "Edit Blog Post" : "New Blog Post"}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border text-foreground-500 transition-colors hover:border-accent-400 hover:text-accent-600"
          >
            <i className="ri-close-line" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5 max-h-[70vh] overflow-y-auto">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                placeholder="Post title..."
                className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-accent-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="url-friendly-slug"
                className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-accent-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              placeholder="Short description for previews and SEO..."
              className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-accent-400 resize-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">Content (Markdown)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              placeholder="Write your article in markdown..."
              className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-accent-400 resize-none font-mono"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-accent-400"
              >
                {["Career Guides", "Salary & Pay", "Regulations", "Lifestyle", "Equipment", "Industry News", "Owner-Operator", "Safety"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">Read Time</label>
              <input
                type="text"
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
                placeholder="5 min read"
                className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-accent-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">Published Date</label>
              <input
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-accent-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">Image URL</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-accent-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">Meta Description (SEO)</label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              placeholder="120-160 character SEO description..."
              className="w-full rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-accent-400 resize-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-brand-border accent-accent-500"
            />
            <span className="text-sm font-semibold text-foreground-700">Featured Post</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-brand-border px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-brand-border px-4 py-2.5 text-sm font-semibold text-foreground-600 transition-colors hover:border-foreground-400 whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !slug.trim()}
            className="rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {saving ? "Saving..." : isEdit ? "Update Post" : "Create Post"}
          </button>
        </div>
      </div>
    </div>
  );
}