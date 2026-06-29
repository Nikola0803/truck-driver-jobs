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

export default function JobCard({ job, onApply, onSave, isSaved, isApplied, showCompany = true }: JobCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(isSaved ?? false);
  const [applied, setApplied] = useState(isApplied ?? false);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setSaved(isSaved ?? false);
  }, [isSaved]);
  useEffect(() => {
    setApplied(isApplied ?? false);
  }, [isApplied]);

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
    if (!user) {
      navigate("/login");
      return;
    }
    setSaving(true);
    try {
      if (saved) {
        const { error } = await supabase
          .from("saved_jobs")
          .delete()
          .eq("user_id", user.id)
          .eq("job_id", Number(job.id));
        if (!error) {
          setSaved(false);
          setToast("Removed from saved jobs");
        }
      } else {
        const { error } = await supabase
          .from("saved_jobs")
          .insert({ user_id: user.id, job_id: Number(job.id) });
        if (!error) {
          setSaved(true);
          setToast("Job saved!");
        }
      }
      onSave?.(job.id);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (applied) {
      setToast("You already applied to this job");
      return;
    }
    onApply?.(job.id);
  };

  return (
    <div className="group flex flex-col rounded-xl border border-brand-border bg-brand-surface p-5 transition-all hover:-translate-y-0.5 hover:border-brand-orange/30">
      {/* Toast */}
      {toast && (
        <div className="absolute right-4 top-4 z-50 rounded-lg bg-brand-orange px-4 py-2 text-xs font-bold text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-orange-light">
          <i className="ri-truck-line text-lg text-brand-orange" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-brand-text md:text-base">
              {job.title}
            </h3>
            {job.badge && (
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeStyles[job.badge] || "bg-brand-bg text-brand-text-muted"}`}>
                {job.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-brand-text-secondary">
            {showCompany ? `${job.company} \u00B7 ` : ""}{job.location}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-brand-bg px-3 py-1 text-xs font-medium text-brand-text-secondary">
          {job.routeType}
        </span>
        <span className="rounded-full bg-brand-bg px-3 py-1 text-xs font-medium text-brand-text-secondary">
          {job.equipment}
        </span>
        <span className="rounded-full bg-brand-bg px-3 py-1 text-xs font-medium text-brand-text-secondary">
          {job.homeTime}
        </span>
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs text-brand-text-muted">{job.postedAt}</span>
        <div className="flex items-center gap-2">
          <Link
            to={`/jobs/${job.slug}`}
            className="rounded-lg border border-brand-border px-4 py-2 text-center text-sm font-semibold text-brand-text transition-colors hover:border-brand-text hover:bg-brand-bg"
          >
            View Job
          </Link>
          {user && (
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-colors ${
                saved
                  ? "border-brand-orange bg-brand-orange-light text-brand-orange"
                  : "border-brand-border text-brand-text-muted hover:border-brand-orange hover:text-brand-orange"
              }`}
              title={saved ? "Unsave" : "Save job"}
            >
              <i className={saved ? "ri-bookmark-fill" : "ri-bookmark-line"} />
            </button>
          )}
          <button
            onClick={handleApply}
            className={`rounded-lg px-4 py-2 text-center text-sm font-bold transition-colors ${
              applied
                ? "border border-green-200 bg-green-50 text-green-600 cursor-default"
                : "bg-brand-orange text-white hover:bg-brand-orange-hover"
            }`}
          >
            {applied ? "Applied" : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}