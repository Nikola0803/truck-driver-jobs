import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Job } from "@/mocks/jobs";
import { useNavigate } from "react-router-dom";

interface JobCardProps {
  job: Job;
  onApply?: (jobId: string) => void;
  onSave?: (jobId: string) => void;
  isSaved?: boolean;
  isApplied?: boolean;
  showCompany?: boolean;
}

/** Strip HTML tags from scraped descriptions for the preview snippet */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function JobCard({ job, onApply, onSave, isSaved, isApplied, showCompany = true }: JobCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(isSaved ?? false);
  const [applied, setApplied] = useState(isApplied ?? false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => { setSaved(isSaved ?? false); }, [isSaved]);
  useEffect(() => { setApplied(isApplied ?? false); }, [isApplied]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const badgeStyles: Record<string, string> = {
    "Urgently Hiring": "bg-red-50 text-red-600 border-red-200",
    New: "bg-green-50 text-green-600 border-green-200",
    Featured: "bg-brand-orange-light text-brand-orange border-brand-orange/20",
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate("/login"); return; }
    setSaving(true);
    try {
      if (saved) {
        const { error } = await supabase.from("saved_jobs").delete().eq("user_id", user.id).eq("job_id", Number(job.id));
        if (!error) { setSaved(false); setToast("Removed from saved"); }
      } else {
        const { error } = await supabase.from("saved_jobs").insert({ user_id: user.id, job_id: Number(job.id) });
        if (!error) { setSaved(true); setToast("Job saved!"); }
      }
      onSave?.(job.id);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (applied) { setToast("Already applied"); return; }
    onApply?.(job.id);
  };

  const descSnippet = job.description
    ? stripHtml(job.description).slice(0, 120) + (job.description.length > 120 ? "…" : "")
    : null;

  const hasPay = !!job.payRate;

  return (
    <div className="group relative flex flex-col rounded-xl border border-brand-border bg-brand-surface p-5 transition-all hover:-translate-y-0.5 hover:border-brand-orange/40 hover:shadow-sm">
      {/* Toast */}
      {toast && (
        <div className="absolute right-3 top-3 z-50 rounded-lg bg-brand-orange px-3 py-1.5 text-xs font-bold text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-orange-light">
          <i className="ri-truck-line text-xl text-brand-orange" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold leading-snug text-brand-text md:text-base">
              {job.title}
            </h3>
            {job.badge && (
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeStyles[job.badge] || "bg-brand-bg text-brand-text-muted"}`}>
                {job.badge}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-brand-text-secondary">
            {showCompany && job.company ? `${job.company} · ` : ""}{job.location}
          </p>
        </div>
      </div>

      {/* Pay — most important, show prominently when available */}
      {hasPay && (
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-base font-extrabold text-brand-orange">{job.payRate}</span>
          {job.payPeriod && (
            <span className="text-xs text-brand-text-muted">{job.payPeriod}</span>
          )}
        </div>
      )}

      {/* Key tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {job.routeType && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-bg px-2.5 py-1 text-xs font-medium text-brand-text-secondary">
            <i className="ri-map-pin-2-line text-[10px]" />
            {job.routeType}
          </span>
        )}
        {job.equipment && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-bg px-2.5 py-1 text-xs font-medium text-brand-text-secondary">
            <i className="ri-truck-line text-[10px]" />
            {job.equipment}
          </span>
        )}
        {job.homeTime && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-bg px-2.5 py-1 text-xs font-medium text-brand-text-secondary">
            <i className="ri-home-2-line text-[10px]" />
            {job.homeTime}
          </span>
        )}
        {job.experienceRequired && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-bg px-2.5 py-1 text-xs font-medium text-brand-text-secondary">
            <i className="ri-award-line text-[10px]" />
            {job.experienceRequired}
          </span>
        )}
      </div>

      {/* Description snippet */}
      {descSnippet && (
        <p className="mt-3 text-xs leading-relaxed text-brand-text-muted line-clamp-2">
          {descSnippet}
        </p>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-brand-border pt-3">
        <span className="text-[11px] text-brand-text-muted">{job.postedAt}</span>
        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition-colors ${
                saved
                  ? "border-brand-orange bg-brand-orange-light text-brand-orange"
                  : "border-brand-border text-brand-text-muted hover:border-brand-orange hover:text-brand-orange"
              }`}
              title={saved ? "Unsave" : "Save job"}
            >
              <i className={saved ? "ri-bookmark-fill" : "ri-bookmark-line"} />
            </button>
          )}
          <Link
            to={`/jobs/${job.slug}`}
            className="rounded-lg border border-brand-border px-3 py-1.5 text-center text-xs font-semibold text-brand-text transition-colors hover:border-brand-text hover:bg-brand-bg whitespace-nowrap"
          >
            View Details
          </Link>
          <button
            onClick={handleApply}
            className={`rounded-lg px-3 py-1.5 text-center text-xs font-bold transition-colors whitespace-nowrap ${
              applied
                ? "border border-green-200 bg-green-50 text-green-600 cursor-default"
                : "bg-brand-orange text-white hover:bg-brand-orange-hover"
            }`}
          >
            {applied ? "✓ Applied" : "Quick Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}
