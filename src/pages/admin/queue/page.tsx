import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export default function QueuePage() {
  const [queued, setQueued] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [markingId, setMarkingId] = useState<number | null>(null);

  const loadQueue = useCallback(async () => {
    const { data } = await supabase
      .from("queued_posts")
      .select("*, campaigns(name), recruitment_groups(name, url)")
      .order("scheduled_at", { ascending: true });
    setQueued(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  const handleCopy = async (q: any) => {
    const text = buildPostText(q);
    await navigator.clipboard.writeText(text);
    setCopiedId(q.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleMarkPosted = async (q: any) => {
    setMarkingId(q.id);
    await supabase
      .from("queued_posts")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", q.id);
    // Also log to published_posts if table exists
    await supabase.from("published_posts").insert([{
      queued_post_id: q.id,
      campaign_id: q.campaign_id,
      group_id: q.group_id,
      content: buildPostText(q),
      posted_at: new Date().toISOString(),
      method: "manual",
    }]).select();
    setMarkingId(null);
    loadQueue();
  };

  const filtered = statusFilter === "all" ? queued : queued.filter((q: any) => q.status === statusFilter);

  const counts = {
    pending: queued.filter((q) => q.status === "pending").length,
    published: queued.filter((q) => q.status === "published").length,
    failed: queued.filter((q) => q.status === "failed").length,
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
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground-950">Publishing Queue</h1>
        <p className="mt-1 text-sm text-foreground-600">
          {counts.pending} pending &middot; Copy post text and paste to Facebook, then mark as posted.
        </p>
      </div>

      {/* How it works banner */}
      {counts.pending > 0 && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <i className="ri-information-line text-blue-500 text-base mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-blue-800">How to publish</p>
              <p className="text-xs text-blue-600 mt-0.5">
                1. Click <strong>Copy Post</strong> to copy the content to clipboard &rarr;
                2. Go to the target Facebook group &rarr;
                3. Paste and post &rarr;
                4. Come back and click <strong>Mark Posted</strong> to track it.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="mb-6 flex gap-1 rounded-xl border border-brand-border bg-brand-surface p-1 w-fit">
        {[
          { id: "pending", label: `Pending (${counts.pending})` },
          { id: "published", label: `Published (${counts.published})` },
          { id: "failed", label: `Failed (${counts.failed})` },
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

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-brand-border bg-brand-surface p-16 text-center">
            <i className="ri-stack-line text-3xl text-foreground-300" />
            <p className="mt-3 text-sm text-foreground-500">
              No {statusFilter !== "all" ? statusFilter : ""} posts in queue.
            </p>
          </div>
        ) : (
          filtered.map((q: any) => (
            <QueueItem
              key={q.id}
              q={q}
              isCopied={copiedId === q.id}
              isMarking={markingId === q.id}
              onCopy={handleCopy}
              onMarkPosted={handleMarkPosted}
            />
          ))
        )}
      </div>
    </div>
  );
}

function QueueItem({
  q,
  isCopied,
  isMarking,
  onCopy,
  onMarkPosted,
}: {
  q: any;
  isCopied: boolean;
  isMarking: boolean;
  onCopy: (q: any) => void;
  onMarkPosted: (q: any) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const fullText = buildPostText(q);

  return (
    <div className={`rounded-xl border bg-brand-surface transition-all ${
      q.status === "published" ? "border-green-200 bg-green-50/30" :
      q.status === "failed" ? "border-red-200" :
      "border-brand-border hover:border-primary-200"
    }`}>
      {/* Header row */}
      <div className="flex flex-col gap-3 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-600">
              {q.campaigns?.name || "No campaign"}
            </span>
            {q.recruitment_groups?.name && (
              <span className="rounded-full bg-background-100 px-2 py-0.5 text-[10px] font-semibold text-foreground-500">
                <i className="ri-group-line mr-1" />{q.recruitment_groups.name}
              </span>
            )}
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ml-auto lg:ml-0 ${
              q.status === "pending" ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
              q.status === "published" ? "bg-green-50 text-green-600 border-green-200" :
              "bg-red-50 text-red-600 border-red-200"
            }`}>
              {q.status}
            </span>
          </div>

          {/* Post preview */}
          <p className={`text-sm text-foreground-700 leading-relaxed ${expanded ? "whitespace-pre-wrap" : "line-clamp-3"}`}>
            {fullText}
          </p>
          {fullText.length > 200 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-xs font-semibold text-primary-500 hover:text-primary-700"
            >
              {expanded ? "Show less" : "Show full post"}
            </button>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-foreground-400">
            <span><i className="ri-calendar-line mr-1" />{new Date(q.scheduled_at).toLocaleDateString()}</span>
            {q.published_at && (
              <span className="text-green-600">
                <i className="ri-check-line mr-1" />Posted {new Date(q.published_at).toLocaleDateString()}
              </span>
            )}
            {q.recruitment_groups?.url && (
              <a
                href={q.recruitment_groups.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 hover:underline"
              >
                <i className="ri-external-link-line mr-1" />Open group
              </a>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 gap-2 lg:flex-col lg:items-end">
          <button
            onClick={() => onCopy(q)}
            className={`rounded-lg border px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
              isCopied
                ? "border-green-400 bg-green-50 text-green-700"
                : "border-brand-border bg-white text-foreground-700 hover:border-primary-400 hover:text-primary-600"
            }`}
          >
            {isCopied ? (
              <span><i className="ri-check-line mr-1" />Copied!</span>
            ) : (
              <span><i className="ri-clipboard-line mr-1" />Copy Post</span>
            )}
          </button>

          {q.status === "pending" && (
            <button
              onClick={() => onMarkPosted(q)}
              disabled={isMarking}
              className="rounded-lg border border-green-300 bg-green-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-green-600 disabled:opacity-50 whitespace-nowrap"
            >
              {isMarking ? (
                <span className="flex items-center gap-1">
                  <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  Saving…
                </span>
              ) : (
                <span><i className="ri-check-double-line mr-1" />Mark Posted</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function buildPostText(q: any): string {
  const parts: string[] = [];
  if (q.headline) parts.push(q.headline);
  if (q.description) parts.push(q.description);
  if (q.content && q.content !== q.description) parts.push(q.content);
  return parts.join("\n\n") || q.content || "";
}
