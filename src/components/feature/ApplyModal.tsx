import { useState } from "react";
import { Link } from "react-router-dom";
import { db } from "@/lib/db";

interface ApplyModalProps {
  jobId: string;
  jobTitle?: string;
  jobCompany?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (jobId: string) => void;
}

type ModalTab = "apply" | "signin";

export default function ApplyModal({ jobId, jobTitle = "", jobCompany = "", isOpen, onClose, onSuccess }: ApplyModalProps) {
  const [tab, setTab] = useState<ModalTab>("apply");
  const [step, setStep] = useState<"form" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Quick Apply form state
  const [applyData, setApplyData] = useState({
    fullName: "",
    email: "",
    phone: "",
    hasCdl: true,
    experience: "1-3 years",
    consent: false,
  });
  const [applyErrors, setApplyErrors] = useState<Record<string, string>>({});

  // Sign In form state
  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signInError, setSignInError] = useState("");

  if (!isOpen) return null;

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const errors: Record<string, string> = {};

    if (!applyData.fullName.trim()) errors.fullName = "Full name is required";
    if (!applyData.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applyData.email)) errors.email = "Enter a valid email";
    if (!applyData.phone.trim()) errors.phone = "Phone number is required";
    else if (!/^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(applyData.phone)) errors.phone = "Enter a valid US phone number";
    if (!applyData.consent) errors.consent = "You must agree to be contacted to submit";

    if (Object.keys(errors).length > 0) { setApplyErrors(errors); return; }
    setApplyErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/quick-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: applyData.fullName,
          email: applyData.email,
          phone: applyData.phone,
          hasCdl: applyData.hasCdl,
          experience: applyData.experience,
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
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError("");
    if (!signInData.email.trim() || !signInData.password.trim()) {
      setSignInError("Email and password are required");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await db.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });
      if (error) {
        setSignInError((error as any).message ?? "Invalid email or password");
        return;
      }
      // Signed in — treat as success
      setStep("success");
      onSuccess?.(jobId);
    } catch {
      setSignInError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setTab("apply");
    setStep("form");
    setApplyData({ fullName: "", email: "", phone: "", hasCdl: true, experience: "1-3 years", consent: false });
    setApplyErrors({});
    setSubmitError("");
    setSignInData({ email: "", password: "" });
    setSignInError("");
    onClose();
  };

  const successName = tab === "apply" ? applyData.fullName.split(" ")[0] : signInData.email.split("@")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border px-6 py-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-brand-text">
              {step === "success" ? "You're All Set!" : tab === "apply" ? "Quick Apply" : "Sign In"}
            </h2>
            {step === "form" && tab === "apply" && jobTitle && (
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

        {step === "success" ? (
          <div className="px-6 py-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange-light">
              <i className="ri-check-line text-2xl text-brand-orange" />
            </div>
            <h3 className="font-heading mb-2 text-lg font-bold text-brand-text">
              {tab === "signin" ? `Welcome back, ${successName}!` : `Thanks, ${successName}!`}
            </h3>
            <p className="text-sm text-brand-text-secondary">
              {tab === "signin"
                ? "You're now signed in. Browse and apply to any job instantly."
                : <>A recruiting agent will text or call you within{" "}<span className="font-semibold text-brand-orange">15 minutes</span>.</>
              }
            </p>
            <button
              onClick={handleClose}
              className="mt-6 rounded-lg border border-brand-border px-6 py-2.5 text-sm font-semibold text-brand-text transition-colors hover:bg-brand-bg"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-brand-border">
              <button
                onClick={() => { setTab("apply"); setSubmitError(""); setSignInError(""); }}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                  tab === "apply"
                    ? "border-b-2 border-brand-orange text-brand-orange"
                    : "text-brand-text-secondary hover:text-brand-text"
                }`}
              >
                Quick Apply
              </button>
              <button
                onClick={() => { setTab("signin"); setSubmitError(""); setSignInError(""); }}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                  tab === "signin"
                    ? "border-b-2 border-brand-orange text-brand-orange"
                    : "text-brand-text-secondary hover:text-brand-text"
                }`}
              >
                Sign In
              </button>
            </div>

            {tab === "apply" ? (
              <form onSubmit={handleApplySubmit} className="px-6 py-5">
                {submitError && (
                  <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</div>
                )}

                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium text-brand-text">Full Name</label>
                  <input
                    type="text"
                    value={applyData.fullName}
                    onChange={(e) => setApplyData({ ...applyData, fullName: e.target.value })}
                    placeholder="John Smith"
                    className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text placeholder-brand-text-muted outline-none transition-colors focus:border-brand-orange"
                  />
                  {applyErrors.fullName && <p className="mt-1 text-xs text-red-500">{applyErrors.fullName}</p>}
                </div>

                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium text-brand-text">Email Address</label>
                  <input
                    type="email"
                    value={applyData.email}
                    onChange={(e) => setApplyData({ ...applyData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text placeholder-brand-text-muted outline-none transition-colors focus:border-brand-orange"
                  />
                  {applyErrors.email && <p className="mt-1 text-xs text-red-500">{applyErrors.email}</p>}
                </div>

                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium text-brand-text">Phone Number</label>
                  <input
                    type="tel"
                    value={applyData.phone}
                    onChange={(e) => setApplyData({ ...applyData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text placeholder-brand-text-muted outline-none transition-colors focus:border-brand-orange"
                  />
                  {applyErrors.phone && <p className="mt-1 text-xs text-red-500">{applyErrors.phone}</p>}
                </div>

                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium text-brand-text">Do you have a Class A CDL?</label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setApplyData({ ...applyData, hasCdl: true })}
                      className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${applyData.hasCdl ? "bg-brand-orange text-white" : "border border-brand-border bg-brand-bg text-brand-text-secondary hover:text-brand-text"}`}>
                      YES
                    </button>
                    <button type="button" onClick={() => setApplyData({ ...applyData, hasCdl: false })}
                      className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${!applyData.hasCdl ? "bg-brand-orange text-white" : "border border-brand-border bg-brand-bg text-brand-text-secondary hover:text-brand-text"}`}>
                      NO
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium text-brand-text">Experience Level</label>
                  <select value={applyData.experience} onChange={(e) => setApplyData({ ...applyData, experience: e.target.value })}
                    className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none transition-colors focus:border-brand-orange">
                    <option value="Less than 1 year">Less than 1 year</option>
                    <option value="1-3 years">1 - 3 years</option>
                    <option value="3+ years">3+ years</option>
                  </select>
                </div>

                <div className="mb-5">
                  <label className={`flex items-start gap-3 cursor-pointer rounded-lg border p-3 transition-colors ${applyData.consent ? "border-brand-orange bg-brand-orange-light" : "border-brand-border bg-brand-bg"}`}>
                    <input type="checkbox" checked={applyData.consent}
                      onChange={(e) => setApplyData({ ...applyData, consent: e.target.checked })}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-brand-orange" />
                    <span className="text-xs leading-relaxed text-brand-text-secondary">
                      By submitting, I agree to the{" "}
                      <Link to="/privacy" target="_blank" className="underline text-brand-orange hover:text-brand-orange-hover">Privacy Policy</Link>{" "}
                      and consent to be contacted by TruckDriverJobs.co and its carrier partners via phone, text, and email regarding CDL employment opportunities. Message and data rates may apply.
                    </span>
                  </label>
                  {applyErrors.consent && <p className="mt-1 text-xs text-red-500">{applyErrors.consent}</p>}
                </div>

                <button type="submit" disabled={submitting || !applyData.consent}
                  className="w-full rounded-lg bg-brand-orange py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-orange-hover disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
                <p className="mt-3 text-center text-xs text-brand-text-muted">No resume needed. Just Class A CDL required.</p>
              </form>
            ) : (
              <form onSubmit={handleSignIn} className="px-6 py-5">
                {signInError && (
                  <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{signInError}</div>
                )}
                <p className="mb-4 text-sm text-brand-text-secondary">
                  Already applied before? Sign in to track your applications and apply instantly.
                </p>

                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium text-brand-text">Email Address</label>
                  <input type="email" value={signInData.email}
                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text placeholder-brand-text-muted outline-none transition-colors focus:border-brand-orange" />
                </div>

                <div className="mb-6">
                  <label className="mb-1.5 block text-sm font-medium text-brand-text">Password</label>
                  <input type="password" value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text placeholder-brand-text-muted outline-none transition-colors focus:border-brand-orange" />
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full rounded-lg bg-brand-orange py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-orange-hover disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? "Signing In..." : "Sign In"}
                </button>

                <p className="mt-4 text-center text-xs text-brand-text-muted">
                  New here?{" "}
                  <button type="button" onClick={() => setTab("apply")} className="text-brand-orange underline hover:text-brand-orange-hover">
                    Quick Apply instead
                  </button>
                </p>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
