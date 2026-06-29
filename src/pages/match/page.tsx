import { useState } from "react";
import { Link } from "react-router-dom";

const EQUIPMENT_OPTIONS = ["Dry Van", "Flatbed", "Reefer", "Tanker", "Step Deck", "Other"];
const ROUTE_OPTIONS = [
  { label: "OTR", desc: "Long haul, away weeks at a time" },
  { label: "Regional", desc: "Home 1–2× per week" },
  { label: "Local", desc: "Home every night" },
  { label: "Dedicated", desc: "Same route, consistent schedule" },
];
const HOME_TIME_OPTIONS = ["Home Daily", "Home Weekly", "Home Every 2 Weeks", "Home Monthly"];
const ENDORSEMENTS = ["Hazmat", "Tanker", "Doubles/Triples", "Passenger"];
const US_STATES = [
  "AL","AZ","AR","CA","CO","CT","DE","FL","GA","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
];
const LOADING_STEPS = [
  "Analyzing your CDL profile",
  "Scanning 450+ active positions",
  "Calculating compatibility scores",
  "Generating personalized matches",
];

interface DriverProfile {
  fullName: string;
  email: string;
  phone: string;
  cdlClass: string;
  experience: string;
  endorsements: string[];
  routeType: string;
  equipment: string;
  homeTime: string;
  minPay: string;
  states: string[];
}

interface MatchResult {
  job: Record<string, any>;
  score: number;
  reason: string;
}

type WizardStep = "info" | "cdl" | "prefs" | "loading" | "results" | "success";

const TOTAL_STEPS = 3;

function stepNumber(step: WizardStep): number | null {
  if (step === "info") return 1;
  if (step === "cdl") return 2;
  if (step === "prefs") return 3;
  return null;
}

function progressPct(step: WizardStep): number {
  if (step === "info") return 33;
  if (step === "cdl") return 66;
  return 100;
}

export default function MatchPage() {
  const [step, setStep] = useState<WizardStep>("info");
  const [profile, setProfile] = useState<DriverProfile>({
    fullName: "", email: "", phone: "",
    cdlClass: "A", experience: "1-3 years",
    endorsements: [],
    routeType: "", equipment: "", homeTime: "",
    minPay: "", states: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Loading state
  const [loadingStep, setLoadingStep] = useState(0);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [leadId, setLeadId] = useState<number | null>(null);

  // Results state
  const [selectedJobIds, setSelectedJobIds] = useState<Set<number>>(new Set());
  const [consent, setConsent] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");

  function update(updates: Partial<DriverProfile>) {
    setProfile((p) => ({ ...p, ...updates }));
  }

  function validate(s: WizardStep): boolean {
    const e: Record<string, string> = {};
    if (s === "info") {
      if (!profile.fullName.trim()) e.fullName = "Required";
      if (!profile.email.trim()) e.email = "Required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) e.email = "Enter a valid email";
      if (!profile.phone.trim()) e.phone = "Required";
      else if (!/^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(profile.phone)) e.phone = "Enter a valid US phone number";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (step === "info" && validate("info")) { setStep("cdl"); return; }
    if (step === "cdl") { setStep("prefs"); return; }
    if (step === "prefs") { setStep("loading"); runMatching(); }
  }

  async function runMatching() {
    setLoadingStep(0);

    // Fake progress ticker
    let i = 0;
    const ticker = setInterval(() => {
      i++;
      setLoadingStep(i);
      if (i >= LOADING_STEPS.length - 1) clearInterval(ticker);
    }, 850);

    const minDelay = new Promise<void>((r) => setTimeout(r, LOADING_STEPS.length * 850 + 700));

    let result = { matches: [] as MatchResult[], leadId: null as number | null };
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      result = await res.json();
    } catch (err) {
      console.error("Match fetch error:", err);
    }

    await minDelay;
    clearInterval(ticker);
    setLoadingStep(LOADING_STEPS.length - 1);
    await new Promise<void>((r) => setTimeout(r, 400));

    setMatches(result.matches ?? []);
    setLeadId(result.leadId ?? null);
    setSelectedJobIds(new Set((result.matches ?? []).map((m: MatchResult) => m.job.id as number)));
    setStep("results");
  }

  async function handleApply() {
    if (!consent || selectedJobIds.size === 0) return;
    setApplying(true);
    setApplyError("");
    try {
      const res = await fetch(`/api/leads/${leadId}/apply`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds: Array.from(selectedJobIds) }),
      });
      if (!res.ok) throw new Error();
      setStep("success");
    } catch {
      setApplyError("Something went wrong. Please try again.");
    } finally {
      setApplying(false);
    }
  }

  const currentStepNum = stepNumber(step);

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-brand-border bg-brand-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-orange">
              <i className="ri-truck-line text-xs text-white" />
            </div>
            <span className="text-sm font-bold text-brand-text">TruckDriverJobs.co</span>
          </Link>
          {currentStepNum && (
            <span className="text-xs font-semibold text-brand-text-muted">
              Step {currentStepNum} of {TOTAL_STEPS}
            </span>
          )}
        </div>
        {currentStepNum && (
          <div className="h-0.5 bg-brand-border">
            <div
              className="h-full bg-brand-orange transition-all duration-500 ease-out"
              style={{ width: `${progressPct(step)}%` }}
            />
          </div>
        )}
      </div>

      <div className="mx-auto max-w-xl px-4 py-8 pb-16">

        {/* ── STEP 1: Basic Info ── */}
        {step === "info" && (
          <div>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-orange-light">
                <i className="ri-robot-2-line text-3xl text-brand-orange" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-brand-text md:text-3xl">
                Find Your Perfect CDL Job
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
                Answer 3 quick screens. Our AI scans 450+ positions and finds your best-fit roles.
                One click applies you to all of them.
              </p>
            </div>

            <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-text">Full Name</label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => update({ fullName: e.target.value })}
                  placeholder="John Smith"
                  className={`w-full rounded-xl border bg-brand-bg px-4 py-3 text-sm text-brand-text placeholder-brand-text-muted outline-none transition-colors focus:border-brand-orange ${errors.fullName ? "border-red-400" : "border-brand-border"}`}
                />
                {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-text">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => update({ email: e.target.value })}
                  placeholder="john@example.com"
                  className={`w-full rounded-xl border bg-brand-bg px-4 py-3 text-sm text-brand-text placeholder-brand-text-muted outline-none transition-colors focus:border-brand-orange ${errors.email ? "border-red-400" : "border-brand-border"}`}
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-text">Phone Number</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className={`w-full rounded-xl border bg-brand-bg px-4 py-3 text-sm text-brand-text placeholder-brand-text-muted outline-none transition-colors focus:border-brand-orange ${errors.phone ? "border-red-400" : "border-brand-border"}`}
                />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
              </div>
            </div>

            <button
              onClick={next}
              className="mt-5 w-full rounded-xl bg-brand-orange py-4 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-orange-hover"
            >
              Continue — CDL Details <i className="ri-arrow-right-line ml-1" />
            </button>

            <p className="mt-3 text-center text-xs text-brand-text-muted">
              Free. No account needed. No resume.
            </p>
          </div>
        )}

        {/* ── STEP 2: CDL Details ── */}
        {step === "cdl" && (
          <div>
            <div className="mb-8 text-center">
              <h1 className="font-heading text-2xl font-bold text-brand-text md:text-3xl">
                Your CDL Background
              </h1>
              <p className="mt-2 text-sm text-brand-text-secondary">
                We use this to filter out jobs you don't qualify for.
              </p>
            </div>

            <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 space-y-7">
              {/* CDL Class */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-brand-text">CDL Class</label>
                <div className="flex gap-3">
                  {["A", "B", "C"].map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => update({ cdlClass: cls })}
                      className={`flex-1 rounded-xl border-2 py-3 text-sm font-bold transition-colors ${
                        profile.cdlClass === cls
                          ? "border-brand-orange bg-brand-orange text-white"
                          : "border-brand-border bg-brand-bg text-brand-text-secondary hover:border-brand-orange/50"
                      }`}
                    >
                      Class {cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-brand-text">Years of Trucking Experience</label>
                <div className="grid grid-cols-2 gap-3">
                  {["Less than 1 year", "1-3 years", "3-5 years", "5+ years"].map((exp) => (
                    <button
                      key={exp}
                      type="button"
                      onClick={() => update({ experience: exp })}
                      className={`rounded-xl border-2 py-3 text-sm font-semibold transition-colors ${
                        profile.experience === exp
                          ? "border-brand-orange bg-brand-orange-light text-brand-orange"
                          : "border-brand-border bg-brand-bg text-brand-text-secondary hover:border-brand-orange/50"
                      }`}
                    >
                      {exp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Endorsements */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-brand-text">Endorsements</label>
                <p className="mb-3 text-xs text-brand-text-muted">Select all that apply (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {ENDORSEMENTS.map((e) => {
                    const on = profile.endorsements.includes(e);
                    return (
                      <button
                        key={e}
                        type="button"
                        onClick={() =>
                          update({
                            endorsements: on
                              ? profile.endorsements.filter((x) => x !== e)
                              : [...profile.endorsements, e],
                          })
                        }
                        className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                          on
                            ? "border-brand-orange bg-brand-orange text-white"
                            : "border-brand-border bg-brand-bg text-brand-text-secondary hover:border-brand-orange/50"
                        }`}
                      >
                        {e}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setStep("info")}
                className="rounded-xl border border-brand-border px-6 py-4 text-sm font-semibold text-brand-text-secondary transition-colors hover:bg-brand-surface"
              >
                Back
              </button>
              <button
                type="button"
                onClick={next}
                className="flex-1 rounded-xl bg-brand-orange py-4 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-orange-hover"
              >
                Continue — Preferences <i className="ri-arrow-right-line ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Preferences ── */}
        {step === "prefs" && (
          <div>
            <div className="mb-8 text-center">
              <h1 className="font-heading text-2xl font-bold text-brand-text md:text-3xl">
                What Are You Looking For?
              </h1>
              <p className="mt-2 text-sm text-brand-text-secondary">
                Skip anything you don't care about — we'll show you everything that fits.
              </p>
            </div>

            <div className="space-y-5">
              {/* Route Type */}
              <div className="rounded-2xl border border-brand-border bg-brand-surface p-5">
                <label className="mb-3 block text-sm font-semibold text-brand-text">Route Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {ROUTE_OPTIONS.map(({ label, desc }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => update({ routeType: profile.routeType === label ? "" : label })}
                      className={`rounded-xl border-2 p-3 text-left transition-colors ${
                        profile.routeType === label
                          ? "border-brand-orange bg-brand-orange-light"
                          : "border-brand-border bg-brand-bg hover:border-brand-orange/50"
                      }`}
                    >
                      <p className={`text-sm font-bold ${profile.routeType === label ? "text-brand-orange" : "text-brand-text"}`}>
                        {label}
                      </p>
                      <p className="mt-0.5 text-xs text-brand-text-muted">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipment */}
              <div className="rounded-2xl border border-brand-border bg-brand-surface p-5">
                <label className="mb-3 block text-sm font-semibold text-brand-text">Equipment Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {EQUIPMENT_OPTIONS.map((eq) => (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => update({ equipment: profile.equipment === eq ? "" : eq })}
                      className={`rounded-xl border-2 py-3 text-xs font-bold transition-colors ${
                        profile.equipment === eq
                          ? "border-brand-orange bg-brand-orange text-white"
                          : "border-brand-border bg-brand-bg text-brand-text-secondary hover:border-brand-orange/50"
                      }`}
                    >
                      {eq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Home Time */}
              <div className="rounded-2xl border border-brand-border bg-brand-surface p-5">
                <label className="mb-3 block text-sm font-semibold text-brand-text">Home Time</label>
                <div className="grid grid-cols-2 gap-3">
                  {HOME_TIME_OPTIONS.map((ht) => (
                    <button
                      key={ht}
                      type="button"
                      onClick={() => update({ homeTime: profile.homeTime === ht ? "" : ht })}
                      className={`rounded-xl border-2 py-3 text-sm font-semibold transition-colors ${
                        profile.homeTime === ht
                          ? "border-brand-orange bg-brand-orange-light text-brand-orange"
                          : "border-brand-border bg-brand-bg text-brand-text-secondary hover:border-brand-orange/50"
                      }`}
                    >
                      {ht}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min Pay */}
              <div className="rounded-2xl border border-brand-border bg-brand-surface p-5">
                <label className="mb-1 block text-sm font-semibold text-brand-text">Minimum Pay</label>
                <p className="mb-3 text-xs text-brand-text-muted">Per mile (CPM) — leave blank to see all</p>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-brand-text-muted">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.30"
                    max="2.00"
                    placeholder="0.55"
                    value={profile.minPay}
                    onChange={(e) => update({ minPay: e.target.value })}
                    className="w-full rounded-xl border border-brand-border bg-brand-bg py-3 pl-8 pr-20 text-sm text-brand-text outline-none transition-colors focus:border-brand-orange"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-brand-text-muted">per mile</span>
                </div>
              </div>

              {/* States */}
              <div className="rounded-2xl border border-brand-border bg-brand-surface p-5">
                <label className="mb-1 block text-sm font-semibold text-brand-text">States You'll Work In</label>
                <p className="mb-3 text-xs text-brand-text-muted">Leave empty for nationwide jobs</p>
                <div className="flex flex-wrap gap-1.5">
                  {US_STATES.map((state) => {
                    const on = profile.states.includes(state);
                    return (
                      <button
                        key={state}
                        type="button"
                        onClick={() =>
                          update({
                            states: on
                              ? profile.states.filter((s) => s !== state)
                              : [...profile.states, state],
                          })
                        }
                        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                          on
                            ? "border-brand-orange bg-brand-orange text-white"
                            : "border-brand-border bg-brand-bg text-brand-text-muted hover:border-brand-orange/50"
                        }`}
                      >
                        {state}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setStep("cdl")}
                className="rounded-xl border border-brand-border px-6 py-4 text-sm font-semibold text-brand-text-secondary transition-colors hover:bg-brand-surface"
              >
                Back
              </button>
              <button
                type="button"
                onClick={next}
                className="flex-1 rounded-xl bg-brand-orange py-4 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-orange-hover"
              >
                <i className="ri-sparkling-line mr-1.5" />
                Find My AI Matches
              </button>
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {step === "loading" && (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="relative mb-8">
              <div className="h-24 w-24 animate-spin rounded-full border-4 border-brand-border border-t-brand-orange" />
              <div className="absolute inset-0 flex items-center justify-center">
                <i className="ri-robot-2-line text-3xl text-brand-orange" />
              </div>
            </div>

            <h2 className="font-heading mb-1 text-xl font-bold text-brand-text">AI is Finding Your Matches</h2>
            <p className="mb-8 text-sm text-brand-text-secondary">Scanning 450+ active positions just for you...</p>

            <div className="w-full max-w-xs space-y-4 text-left">
              {LOADING_STEPS.map((label, i) => {
                const done = i < loadingStep;
                const active = i === loadingStep;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 transition-all duration-500 ${
                      i <= loadingStep ? "opacity-100" : "opacity-25"
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                        done ? "bg-brand-orange" : active ? "animate-pulse bg-brand-orange" : "bg-brand-border"
                      }`}
                    >
                      {done ? (
                        <i className="ri-check-line text-[11px] text-white" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-white/80" />
                      )}
                    </div>
                    <span className={`text-sm ${i <= loadingStep ? "text-brand-text" : "text-brand-text-muted"}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {step === "results" && (
          <div>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-orange-light">
                <i className="ri-sparkling-line text-2xl text-brand-orange" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-brand-text">
                {matches.length} Matches Found
              </h1>
              <p className="mt-1 text-sm text-brand-text-secondary">
                Select the ones you like, then apply to all with one click.
              </p>
            </div>

            {/* Match cards */}
            <div className="space-y-3 mb-6">
              {matches.length === 0 && (
                <div className="rounded-2xl border border-brand-border bg-brand-surface p-8 text-center">
                  <i className="ri-search-line mb-3 text-3xl text-brand-text-muted" />
                  <p className="text-sm font-semibold text-brand-text">No matches found</p>
                  <p className="mt-1 text-xs text-brand-text-muted">Try removing some preferences to broaden results.</p>
                  <button
                    onClick={() => setStep("prefs")}
                    className="mt-4 rounded-lg border border-brand-border px-5 py-2.5 text-sm font-semibold text-brand-text transition-colors hover:bg-brand-surface"
                  >
                    Adjust Preferences
                  </button>
                </div>
              )}

              {matches.map((m) => {
                const sel = selectedJobIds.has(Number(m.job.id));
                const scoreColor =
                  m.score >= 80
                    ? "bg-green-100 text-green-700"
                    : m.score >= 60
                    ? "bg-brand-orange-light text-brand-orange"
                    : "border border-brand-border bg-brand-surface text-brand-text-muted";

                return (
                  <div
                    key={m.job.id}
                    onClick={() => {
                      const next = new Set(selectedJobIds);
                      sel ? next.delete(Number(m.job.id)) : next.add(Number(m.job.id));
                      setSelectedJobIds(next);
                    }}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                      sel
                        ? "border-brand-orange bg-brand-orange-light/20"
                        : "border-brand-border bg-brand-surface hover:border-brand-orange/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          sel ? "border-brand-orange bg-brand-orange" : "border-brand-border bg-brand-bg"
                        }`}
                      >
                        {sel && <i className="ri-check-line text-[10px] text-white" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-brand-text">{m.job.title}</p>
                            <p className="text-xs text-brand-text-secondary">
                              {m.job.company} · {m.job.location}
                            </p>
                          </div>
                          <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${scoreColor}`}>
                            {m.score}%
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {m.job.equipment && (
                            <span className="rounded-md border border-brand-border bg-brand-bg px-2 py-0.5 text-[10px] font-medium text-brand-text-muted">
                              {m.job.equipment}
                            </span>
                          )}
                          {m.job.route_type && (
                            <span className="rounded-md border border-brand-border bg-brand-bg px-2 py-0.5 text-[10px] font-medium text-brand-text-muted">
                              {m.job.route_type}
                            </span>
                          )}
                          {m.job.pay_rate && (
                            <span className="rounded-md border border-brand-border bg-brand-bg px-2 py-0.5 text-[10px] font-medium text-brand-orange">
                              {m.job.pay_rate}
                            </span>
                          )}
                          {m.job.home_time && (
                            <span className="rounded-md border border-brand-border bg-brand-bg px-2 py-0.5 text-[10px] font-medium text-brand-text-muted">
                              {m.job.home_time}
                            </span>
                          )}
                        </div>

                        {m.reason && (
                          <p className="mt-2 text-xs italic text-brand-text-secondary">
                            <i className="ri-sparkling-line mr-1 text-brand-orange" />
                            {m.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sticky apply panel */}
            {matches.length > 0 && (
              <div className="sticky bottom-4 rounded-2xl border-2 border-brand-orange bg-brand-surface p-5 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-brand-text">
                    {selectedJobIds.size} position{selectedJobIds.size !== 1 ? "s" : ""} selected
                  </p>
                  <div className="flex gap-3 text-xs">
                    <button
                      onClick={() => setSelectedJobIds(new Set(matches.map((m) => Number(m.job.id))))}
                      className="font-semibold text-brand-orange hover:underline"
                    >
                      All
                    </button>
                    <button
                      onClick={() => setSelectedJobIds(new Set())}
                      className="font-semibold text-brand-text-muted hover:underline"
                    >
                      None
                    </button>
                  </div>
                </div>

                <label className="mb-3 flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand-orange"
                  />
                  <span className="text-xs leading-relaxed text-brand-text-secondary">
                    By submitting, I agree to the{" "}
                    <Link to="/privacy" target="_blank" className="text-brand-orange underline">
                      Privacy Policy
                    </Link>{" "}
                    and consent to be contacted by TruckDriverJobs.co and its carrier partners via phone, text, and email about CDL opportunities.
                  </span>
                </label>

                {applyError && <p className="mb-3 text-xs text-red-500">{applyError}</p>}

                <button
                  onClick={handleApply}
                  disabled={applying || !consent || selectedJobIds.size === 0}
                  className="w-full rounded-xl bg-brand-orange py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-orange-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {applying
                    ? "Submitting..."
                    : `Apply to ${selectedJobIds.size} Job${selectedJobIds.size !== 1 ? "s" : ""} — Get Called Today`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === "success" && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-orange-light">
              <i className="ri-check-double-line text-4xl text-brand-orange" />
            </div>
            <h1 className="font-heading mb-2 text-2xl font-bold text-brand-text">
              You're In! Applications Sent.
            </h1>
            <p className="text-base text-brand-text-secondary">
              Applied to{" "}
              <strong className="text-brand-text">{selectedJobIds.size} position{selectedJobIds.size !== 1 ? "s" : ""}</strong>.
            </p>
            <p className="mt-1 text-sm text-brand-text-muted">
              A recruiter will call or text{" "}
              <strong className="text-brand-text">{profile.phone}</strong>{" "}
              within <span className="font-semibold text-brand-orange">15 minutes</span>.
            </p>

            <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-brand-border bg-brand-surface p-6 text-left">
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-brand-text-muted">What happens next</p>
              <div className="space-y-4">
                {[
                  { icon: "ri-phone-line", title: "Recruiter calls within 15 min", desc: "They'll confirm your CDL details and top preference." },
                  { icon: "ri-file-check-line", title: "Quick verification", desc: "No paperwork — just a short call to confirm you qualify." },
                  { icon: "ri-truck-line", title: "Placed with a carrier", desc: "Get your start date within days of the call." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-orange-light">
                      <i className={`${item.icon} text-brand-orange`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-text">{item.title}</p>
                      <p className="text-xs text-brand-text-muted">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 rounded-xl border border-brand-border px-5 py-3 text-sm font-semibold text-brand-text transition-colors hover:bg-brand-surface"
              >
                <i className="ri-briefcase-line" />
                Browse More Jobs
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-hover"
              >
                <i className="ri-home-line" />
                Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
