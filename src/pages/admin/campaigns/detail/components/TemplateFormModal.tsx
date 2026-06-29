import { useState } from "react";

const POST_TYPES = [
  { value: "intro", label: "Intro", description: "Introduce the carrier, campaign, or opportunity" },
  { value: "job_post", label: "Job Post", description: "Direct job listing with pay, route, and requirements" },
  { value: "value_content", label: "Value Content", description: "Tips, guides, or educational content for drivers" },
  { value: "urgency", label: "Urgency / Scarcity", description: "Limited slots, high demand, deadline-driven posts" },
  { value: "testimonial", label: "Testimonial", description: "Driver success stories and experiences" },
  { value: "comparison", label: "Comparison", description: "Compare job types, carriers, or pay packages" },
  { value: "qa", label: "Q&A", description: "Answer common driver questions about the role" },
  { value: "cta", label: "Direct CTA", description: "Short, punchy call-to-action posts" },
];

interface TemplateFormProps {
  template?: any;
  onClose: () => void;
  onSave: () => void;
  campaignId: string;
}

export default function TemplateFormModal({ template, campaignId, onClose, onSave }: TemplateFormProps) {
  const [type, setType] = useState(template?.type || "job_post");
  const [content, setContent] = useState(template?.content || "");
  const [variantIndex, setVariantIndex] = useState(template?.variant_index ?? 0);
  const [saving, setSaving] = useState(false);

  const isEdit = !!template;
  const selectedType = POST_TYPES.find((t) => t.value === type);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);

    const payload = {
      campaign_id: parseInt(campaignId),
      type,
      content: content.trim(),
      variant_index: variantIndex,
      updated_at: new Date().toISOString(),
    };

    const { supabase } = await import("@/lib/supabase");

    if (isEdit) {
      await supabase.from("content_templates").update(payload).eq("id", template.id);
    } else {
      await supabase.from("content_templates").insert({ ...payload, used: false, performance_score: 0, created_at: new Date().toISOString() });
    }

    setSaving(false);
    onSave();
  };

  const charCount = content.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12">
      <div className="w-full max-w-2xl rounded-2xl border border-brand-border bg-brand-surface">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border px-6 py-4">
          <h2 className="font-heading text-xl font-bold text-foreground-950">
            {isEdit ? "Edit Template" : "New Content Template"}
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
          {/* Type */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-foreground-500">Post Type</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {POST_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  onClick={() => setType(pt.value)}
                  className={`flex flex-col gap-0.5 rounded-xl border px-4 py-3 text-left transition-all ${
                    type === pt.value
                      ? "border-primary-400 bg-primary-50"
                      : "border-brand-border bg-background-50 hover:border-primary-200"
                  }`}
                >
                  <span className="text-sm font-bold text-foreground-950">{pt.label}</span>
                  <span className="text-[11px] text-foreground-500">{pt.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Variant Index */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-500">Variant #</label>
            <p className="mb-2 text-[11px] text-foreground-400">Multiple templates of the same type can rotate. Higher variant number = lower priority.</p>
            <input
              type="number"
              value={variantIndex}
              onChange={(e) => setVariantIndex(parseInt(e.target.value) || 0)}
              min={0}
              max={99}
              className="w-24 rounded-lg border border-brand-border bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none focus:border-primary-400"
            />
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground-500">Post Content</label>
              <span className={`text-[11px] font-semibold ${charCount > 2000 ? "text-red-500" : charCount > 1500 ? "text-yellow-600" : "text-foreground-400"}`}>
                {charCount} chars
              </span>
            </div>
            <p className="mb-2 text-[11px] text-foreground-400">
              Write the exact text that will be posted. Use placeholders like {"{location}"}, {"{pay_range}"}, {"{company_name}"}. They'll be filled from campaign settings when generating.
            </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              placeholder={`Write your ${selectedType?.label.toLowerCase()} post here...

Example:
🚛 Now Hiring CDL-A Drivers in {location}!
💰 {pay_range} per week | {benefits_list}
🏠 {home_time}
📋 Requirements: {requirements}

{cta}`}
              className="w-full rounded-lg border border-brand-border bg-background-50 px-4 py-3 text-sm text-foreground-950 outline-none focus:border-primary-400 resize-none font-mono leading-relaxed"
            />
          </div>

          {/* Template Tips */}
          <div className="rounded-lg bg-background-100 border border-brand-border p-4">
            <p className="text-xs font-bold text-foreground-700 mb-2">
              <i className="ri-lightbulb-line mr-1" />
              Tips for Effective Posts
            </p>
            <ul className="space-y-1 text-[11px] text-foreground-500">
              <li>&middot; Keep it under 1500 characters for best engagement</li>
              <li>&middot; Start with a hook: emoji + strong opener</li>
              <li>&middot; Use bullet points for pay and benefits</li>
              <li>&middot; Include exactly one clear call-to-action</li>
              <li>&middot; Rotate 3-5 variants per type to avoid spam filters</li>
            </ul>
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
            disabled={saving || !content.trim()}
            className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {saving ? "Saving..." : isEdit ? "Update Template" : "Create Template"}
          </button>
        </div>
      </div>
    </div>
  );
}