import { useState } from "react";
import { Link } from "react-router-dom";

interface ApplyModalProps {
  jobId: string;
  jobTitle?: string;
  jobCompany?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (jobId: string) => void;
}

export default function ApplyModal({ jobId, jobTitle = "", jobCompany = "", isOpen, onClose, onSuccess }: ApplyModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    hasCdl: true,
    experience: "1-3 years",
    consent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(formData.phone)) {
      newErrors.phone = "Enter a valid US phone number";
    }
    if (!formData.consent) {
      newErrors.consent = "You must agree to be contacted to submit";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/quick-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          hasCdl: formData.hasCdl,
          experience: formData.experience,
          jobId: Number(jobId),
          jobTitle,
          jobCompany,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError((data as any).message ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      setStep("success");
      onSuccess?.(jobId);
    } catch (err) {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep("form");
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      hasCdl: true,
      experience: "1-3 years",
      consent: false,
    });
    setErrors({});
    setSubmitError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border px-6 py-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-brand-text">
              {step === "form" ? "Quick Apply" : "Application Sent!"}
            </h2>
            {step === "form" && jobTitle && (
              <p className="mt-0.5 text-xs text-brand-text-secondary">
                {jobTitle}{jobCompany ? ` at ${jobCompany}` : ""}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-brand-text-secondary transition-colors hover:bg-brand-bg hover:text-brand-text"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {step === "form" ? (
          <form onSubmit={handleSubmit} className="px-6 py-5">
            {submitError && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {submitError}
              </div>
            )}
            {/* Full Name */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-brand-text">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                placeholder="John Smith"
                className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text placeholder-brand-text-muted outline-none transition-colors focus:border-brand-orange"
              />
              {errors?.fullName && (
                <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-brand-text">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john@example.com"
                className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text placeholder-brand-text-muted outline-none transition-colors focus:border-brand-orange"
              />
              {errors?.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-brand-text">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="(555) 123-4567"
                className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text placeholder-brand-text-muted outline-none transition-colors focus:border-brand-orange"
              />
              {errors?.phone && (
                <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
              )}
            </div>

            {/* CDL Toggle */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-brand-text">
                Do you have a Class A CDL?
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hasCdl: true })}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                    formData.hasCdl
                      ? "bg-brand-orange text-white"
                      : "border border-brand-border bg-brand-bg text-brand-text-secondary hover:text-brand-text"
                  }`}
                >
                  YES
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hasCdl: false })}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                    !formData.hasCdl
                      ? "bg-brand-orange text-white"
                      : "border border-brand-border bg-brand-bg text-brand-text-secondary hover:text-brand-text"
                  }`}
                >
                  NO
                </button>
              </div>
            </div>

            {/* Experience */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-brand-text">
                Experience Level
              </label>
              <select
                name="experience"
                value={formData.experience}
                onChange={(e) =>
                  setFormData({ ...formData, experience: e.target.value })
                }
                className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none transition-colors focus:border-brand-orange"
              >
                <option value="Less than 1 year">Less than 1 year</option>
                <option value="1-3 years">1 - 3 years</option>
                <option value="3+ years">3+ years</option>
              </select>
            </div>

            {/* TCPA Consent */}
            <div className="mb-5">
              <label className={`flex items-start gap-3 cursor-pointer rounded-lg border p-3 transition-colors ${formData.consent ? "border-brand-orange bg-brand-orange-light" : "border-brand-border bg-brand-bg"}`}>
                <input
                  type="checkbox"
                  checked={formData.consent}
                  onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-brand-orange"
                />
                <span className="text-xs leading-relaxed text-brand-text-secondary">
                  By submitting, I agree to the{" "}
                  <Link to="/privacy" target="_blank" className="underline text-brand-orange hover:text-brand-orange-hover">
                    Privacy Policy
                  </Link>{" "}
                  and consent to be contacted by TruckDriverJobs.co and its carrier partners via phone, text, and email regarding CDL employment opportunities. Message and data rates may apply.
                </span>
              </label>
              {errors?.consent && (
                <p className="mt-1 text-xs text-red-500">{errors.consent}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !formData.consent}
              className="w-full rounded-lg bg-brand-orange py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-orange-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
            <p className="mt-3 text-center text-xs text-brand-text-muted">
              No resume needed. Just Class A CDL required.
            </p>
          </form>
        ) : (
          <div className="px-6 py-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange-light">
              <i className="ri-check-line text-2xl text-brand-orange" />
            </div>
            <h3 className="font-heading mb-2 text-lg font-bold text-brand-text">
              Thanks, {formData.fullName.split(" ")[0]}!
            </h3>
            <p className="text-sm text-brand-text-secondary">
              A recruiting agent will text or call you within{" "}
              <span className="font-semibold text-brand-orange">15 minutes</span>.
            </p>
            <button
              onClick={handleClose}
              className="mt-6 rounded-lg border border-brand-border px-6 py-2.5 text-sm font-semibold text-brand-text transition-colors hover:bg-brand-bg"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}