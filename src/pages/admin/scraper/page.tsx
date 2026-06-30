import { useState, useEffect } from "react";
import { db } from "@/lib/db";

interface CarrierStatus {
  name: string;
  url: string;
  strategy: string;
  defaultEquipment?: string;
  jobCount: number;
  lastScraped: string | null;
}

interface ScrapedJobPreview {
  title: string;
  company: string;
  location: string;
  route_type?: string;
  equipment?: string;
  pay_rate?: string;
  description?: string;
  source_url: string;
  source_carrier: string;
  external_apply_url?: string;
  benefits?: string[];
  requirements?: string[];
  city?: string;
  state?: string;
  pay_period?: string;
  home_time?: string;
  experience_required?: string;
}

interface ScrapeResult {
  carrier: string;
  url: string;
  jobs: ScrapedJobPreview[];
  error?: string;
  scrapedAt: string;
}

export default function ScraperPage() {
  const [carriers, setCarriers] = useState<CarrierStatus[]>([]);
  const [loadingCarriers, setLoadingCarriers] = useState(true);
  const [scraping, setScraping] = useState<string | null>(null);
  const [preview, setPreview] = useState<ScrapeResult | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ inserted: number; updated: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Adzuna state
  const [adzunaRunning, setAdzunaRunning] = useState(false);
  const [adzunaResult, setAdzunaResult] = useState<{ total: number; inserted: number; updated: number } | null>(null);
  const [adzunaError, setAdzunaError] = useState("");

  // Jobicy state
  const [jobicyRunning, setJobicyRunning] = useState(false);
  const [jobicyResult, setJobicyResult] = useState<{ total: number; inserted: number; updated: number } | null>(null);
  const [jobicyError, setJobicyError] = useState("");

  const runJobicy = async () => {
    setJobicyRunning(true);
    setJobicyResult(null);
    setJobicyError("");
    try {
      const res = await fetch("/api/admin/scrape/jobicy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("tdj_token")}`,
        },
        body: JSON.stringify({ import: true }),
      });
      const data = await res.json();
      if (!res.ok) { setJobicyError(data.message ?? "Failed"); return; }
      setJobicyResult({ total: data.total, inserted: data.inserted, updated: data.updated });
      await loadCarriers();
    } catch {
      setJobicyError("Network error — is the server running?");
    } finally {
      setJobicyRunning(false);
    }
  };

  // Indeed RSS state
  const [indeedRunning, setIndeedRunning] = useState(false);
  const [indeedResult, setIndeedResult] = useState<{ total: number; inserted: number; updated: number } | null>(null);
  const [indeedError, setIndeedError] = useState("");

  const runIndeed = async () => {
    setIndeedRunning(true);
    setIndeedResult(null);
    setIndeedError("");
    try {
      const res = await fetch("/api/admin/scrape/indeed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("tdj_token")}`,
        },
        body: JSON.stringify({ import: true }),
      });
      const data = await res.json();
      if (!res.ok) { setIndeedError(data.message ?? "Failed"); return; }
      setIndeedResult({ total: data.total, inserted: data.inserted, updated: data.updated });
      await loadCarriers();
    } catch {
      setIndeedError("Network error — is the server running?");
    } finally {
      setIndeedRunning(false);
    }
  };

  // JSearch state
  const [jsearchRunning, setJsearchRunning] = useState(false);
  const [jsearchResult, setJsearchResult] = useState<{ total: number; inserted: number; updated: number } | null>(null);
  const [jsearchError, setJsearchError] = useState("");

  const runJSearch = async () => {
    setJsearchRunning(true);
    setJsearchResult(null);
    setJsearchError("");
    try {
      const res = await fetch("/api/admin/scrape/jsearch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("tdj_token")}`,
        },
        body: JSON.stringify({ import: true }),
      });
      const data = await res.json();
      if (!res.ok) { setJsearchError(data.message ?? "Failed"); return; }
      setJsearchResult({ total: data.total, inserted: data.inserted, updated: data.updated });
      await loadCarriers();
    } catch {
      setJsearchError("Network error — is the server running?");
    } finally {
      setJsearchRunning(false);
    }
  };

  // USAJOBS state
  const [usajobsRunning, setUsajobsRunning] = useState(false);
  const [usajobsResult, setUsajobsResult] = useState<{ total: number; inserted: number; updated: number } | null>(null);
  const [usajobsError, setUsajobsError] = useState("");

  const runUSAJobs = async () => {
    setUsajobsRunning(true);
    setUsajobsResult(null);
    setUsajobsError("");
    try {
      const res = await fetch("/api/admin/scrape/usajobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("tdj_token")}`,
        },
        body: JSON.stringify({ import: true }),
      });
      const data = await res.json();
      if (!res.ok) { setUsajobsError(data.message ?? "Failed"); return; }
      setUsajobsResult({ total: data.total, inserted: data.inserted, updated: data.updated });
      await loadCarriers();
    } catch {
      setUsajobsError("Network error — is the server running?");
    } finally {
      setUsajobsRunning(false);
    }
  };

  // Careerjet state
  const [careerjetRunning, setCareerjetRunning] = useState(false);
  const [careerjetResult, setCareerjetResult] = useState<{ total: number; inserted: number; updated: number } | null>(null);
  const [careerjetError, setCareerjetError] = useState("");

  const runCareerjet = async () => {
    setCareerjetRunning(true);
    setCareerjetResult(null);
    setCareerjetError("");
    try {
      const res = await fetch("/api/admin/scrape/careerjet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("tdj_token")}`,
        },
        body: JSON.stringify({ import: true }),
      });
      const data = await res.json();
      if (!res.ok) { setCareerjetError(data.message ?? "Failed"); return; }
      setCareerjetResult({ total: data.total, inserted: data.inserted, updated: data.updated });
      await loadCarriers();
    } catch {
      setCareerjetError("Network error — is the server running?");
    } finally {
      setCareerjetRunning(false);
    }
  };

  const runAdzuna = async () => {
    setAdzunaRunning(true);
    setAdzunaResult(null);
    setAdzunaError("");
    try {
      const res = await fetch("/api/admin/scrape/adzuna", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("tdj_token")}`,
        },
        body: JSON.stringify({ import: true }),
      });
      const data = await res.json();
      if (!res.ok) { setAdzunaError(data.message ?? "Failed"); return; }
      setAdzunaResult({ total: data.total, inserted: data.inserted, updated: data.updated });
      await loadCarriers();
    } catch {
      setAdzunaError("Network error — is the server running?");
    } finally {
      setAdzunaRunning(false);
    }
  };

  const loadCarriers = async () => {
    setLoadingCarriers(true);
    try {
      const res = await fetch("/api/admin/scrapers", {
        headers: { Authorization: `Bearer ${localStorage.getItem("tdj_token")}` },
      });
      if (res.ok) setCarriers(await res.json());
    } finally {
      setLoadingCarriers(false);
    }
  };

  useEffect(() => { loadCarriers(); }, []);

  const handleScrape = async (carrierName: string) => {
    setScraping(carrierName);
    setPreview(null);
    setSelectedJobs(new Set());
    setImportResult(null);
    try {
      const res = await fetch("/api/admin/scrape/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("tdj_token")}`,
        },
        body: JSON.stringify({ carrier: carrierName }),
      });
      const results: ScrapeResult[] = await res.json();
      if (results[0]) {
        setPreview(results[0]);
        // Select all by default
        setSelectedJobs(new Set(results[0].jobs.map((_, i) => i)));
      }
    } catch {
      setPreview({ carrier: carrierName, url: "", jobs: [], error: "Network error", scrapedAt: new Date().toISOString() });
    } finally {
      setScraping(null);
    }
  };

  const toggleJob = (i: number) => {
    setSelectedJobs((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const selectAll = () => setSelectedJobs(new Set((preview?.jobs ?? []).map((_, i) => i)));
  const selectNone = () => setSelectedJobs(new Set());

  const handleImport = async () => {
    if (!preview) return;
    const jobs = preview.jobs.filter((_, i) => selectedJobs.has(i));
    if (!jobs.length) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/admin/scrape/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("tdj_token")}`,
        },
        body: JSON.stringify({ jobs }),
      });
      const data = await res.json();
      setImportResult({ inserted: data.inserted, updated: data.updated });
      setPreview(null);
      setSelectedJobs(new Set());
      await loadCarriers();
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (carrierName: string) => {
    try {
      await fetch("/api/admin/scrape/carrier", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("tdj_token")}`,
        },
        body: JSON.stringify({ carrier: carrierName }),
      });
      setDeleteTarget(null);
      await loadCarriers();
    } catch {}
  };

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground-950">Job Aggregator</h1>
        <p className="mt-1 text-sm text-foreground-600">
          Scrape publicly available CDL job postings from carrier websites using their schema.org structured data.
          All sources are publicly accessible career pages — no authentication bypassed.
        </p>
      </div>

      {/* API Sources */}
      <div className="mb-6 rounded-xl border border-brand-border bg-brand-surface p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
            <i className="ri-cloud-line text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground-950">API Sources</p>
            <p className="text-xs text-foreground-500">Real job data from third-party APIs — legal, updated daily</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* JSearch — first because it aggregates the most sources */}
          <div className="rounded-lg border-2 border-brand-orange/40 bg-brand-bg p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground-950">JSearch (RapidAPI)</p>
                <p className="text-xs text-foreground-500">Indeed + LinkedIn + ZipRecruiter + Glassdoor</p>
              </div>
              <span className="rounded-full bg-brand-orange-light px-2.5 py-0.5 text-[10px] font-bold text-brand-orange">BEST</span>
            </div>
            {jsearchResult && (
              <div className="mb-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
                <i className="ri-check-line mr-1" />
                Imported {jsearchResult.total} jobs — {jsearchResult.inserted} new, {jsearchResult.updated} updated
              </div>
            )}
            {jsearchError && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
                {jsearchError}
              </div>
            )}
            <button
              onClick={runJSearch}
              disabled={jsearchRunning}
              className="w-full rounded-lg bg-brand-orange py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-orange-hover disabled:opacity-50"
            >
              {jsearchRunning ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="ri-loader-4-line animate-spin" /> Fetching CDL jobs...
                </span>
              ) : "Fetch + Import Jobs"}
            </button>
          </div>

          {/* Indeed RSS */}
          <div className="rounded-lg border border-brand-border bg-brand-bg p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground-950">Indeed RSS</p>
                <p className="text-xs text-foreground-500">Free · no key · 12 CDL queries</p>
              </div>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold text-green-700">FREE</span>
            </div>
            {indeedResult && (
              <div className="mb-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
                <i className="ri-check-line mr-1" />
                Imported {indeedResult.total} jobs — {indeedResult.inserted} new, {indeedResult.updated} updated
              </div>
            )}
            {indeedError && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
                {indeedError}
              </div>
            )}
            <button
              onClick={runIndeed}
              disabled={indeedRunning}
              className="w-full rounded-lg bg-primary-500 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
            >
              {indeedRunning ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="ri-loader-4-line animate-spin" /> Fetching CDL jobs...
                </span>
              ) : "Fetch + Import Jobs"}
            </button>
          </div>

          {/* Adzuna */}
          <div className="rounded-lg border border-brand-border bg-brand-bg p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground-950">Adzuna</p>
                <p className="text-xs text-foreground-500">CDL jobs across the US</p>
              </div>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold text-green-700">LIVE</span>
            </div>
            {adzunaResult && (
              <div className="mb-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
                <i className="ri-check-line mr-1" />
                Imported {adzunaResult.total} jobs — {adzunaResult.inserted} new, {adzunaResult.updated} updated
              </div>
            )}
            {adzunaError && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
                {adzunaError}
              </div>
            )}
            <button
              onClick={runAdzuna}
              disabled={adzunaRunning}
              className="w-full rounded-lg bg-primary-500 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
            >
              {adzunaRunning ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="ri-loader-4-line animate-spin" /> Fetching CDL jobs...
                </span>
              ) : "Fetch + Import Jobs"}
            </button>
          </div>

          {/* Jobicy */}
          <div className="rounded-lg border border-brand-border bg-brand-bg p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground-950">Jobicy</p>
                <p className="text-xs text-foreground-500">Free job API · no key required</p>
              </div>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold text-green-700">FREE</span>
            </div>
            {jobicyResult && (
              <div className="mb-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
                <i className="ri-check-line mr-1" />
                Imported {jobicyResult.total} jobs — {jobicyResult.inserted} new, {jobicyResult.updated} updated
              </div>
            )}
            {jobicyError && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
                {jobicyError}
              </div>
            )}
            <button
              onClick={runJobicy}
              disabled={jobicyRunning}
              className="w-full rounded-lg bg-primary-500 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
            >
              {jobicyRunning ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="ri-loader-4-line animate-spin" /> Fetching jobs...
                </span>
              ) : "Fetch + Import Jobs"}
            </button>
          </div>

          {/* USAJOBS */}
          <div className="rounded-lg border border-brand-border bg-brand-bg p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground-950">USAJOBS.gov</p>
                <p className="text-xs text-foreground-500">Federal CDL &amp; driving positions</p>
              </div>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold text-green-700">LIVE</span>
            </div>
            {usajobsResult && (
              <div className="mb-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
                <i className="ri-check-line mr-1" />
                Imported {usajobsResult.total} jobs — {usajobsResult.inserted} new, {usajobsResult.updated} updated
              </div>
            )}
            {usajobsError && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
                {usajobsError}
              </div>
            )}
            <button
              onClick={runUSAJobs}
              disabled={usajobsRunning}
              className="w-full rounded-lg bg-primary-500 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
            >
              {usajobsRunning ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="ri-loader-4-line animate-spin" /> Fetching federal jobs...
                </span>
              ) : "Fetch + Import Jobs"}
            </button>
          </div>

          {/* Careerjet */}
          <div className="rounded-lg border border-brand-border bg-brand-bg p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground-950">Careerjet</p>
                <p className="text-xs text-foreground-500">500+ US job boards aggregated</p>
              </div>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold text-green-700">LIVE</span>
            </div>
            {careerjetResult && (
              <div className="mb-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
                <i className="ri-check-line mr-1" />
                Imported {careerjetResult.total} jobs — {careerjetResult.inserted} new, {careerjetResult.updated} updated
              </div>
            )}
            {careerjetError && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
                {careerjetError}
              </div>
            )}
            <button
              onClick={runCareerjet}
              disabled={careerjetRunning}
              className="w-full rounded-lg bg-primary-500 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
            >
              {careerjetRunning ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="ri-loader-4-line animate-spin" /> Fetching CDL jobs...
                </span>
              ) : "Fetch + Import Jobs"}
            </button>
          </div>
        </div>
      </div>

      {/* Legal banner */}
      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <i className="ri-shield-check-line mt-0.5 text-blue-500 text-lg" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Legally Sound Aggregation</p>
            <p className="mt-0.5 text-xs text-blue-700">
              We extract schema.org/JobPosting structured data from public career pages — the same data Google Jobs reads.
              Facts are not copyrightable (Feist v. Rural Telephone, 1991). Scraping public pages is lawful (hiQ v. LinkedIn, 2022).
              Carriers are attributed and can claim/remove listings at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Import success */}
      {importResult && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <i className="ri-check-double-line text-green-600 text-lg" />
            <p className="text-sm font-semibold text-green-800">
              Import complete: {importResult.inserted} new jobs added, {importResult.updated} updated.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        {/* Carrier list */}
        <div>
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground-500 mb-3">Carrier Sources</h2>
          {loadingCarriers ? (
            <div className="flex items-center gap-2 py-8 text-sm text-foreground-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground-200 border-t-primary-500" />
              Loading carriers...
            </div>
          ) : (
            <div className="space-y-2">
              {carriers.map((carrier) => (
                <div
                  key={carrier.name}
                  className="rounded-xl border border-brand-border bg-brand-surface p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground-950 text-sm">{carrier.name}</p>
                        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold uppercase text-primary-600">
                          {carrier.defaultEquipment ?? "CDL"}
                        </span>
                        {carrier.jobCount > 0 && (
                          <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                            {carrier.jobCount} imported
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-foreground-400">{carrier.url}</p>
                      {carrier.lastScraped && (
                        <p className="mt-0.5 text-[11px] text-foreground-400">
                          Last scraped: {new Date(carrier.lastScraped).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {carrier.jobCount > 0 && (
                        <button
                          onClick={() => setDeleteTarget(carrier.name)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        onClick={() => handleScrape(carrier.name)}
                        disabled={scraping === carrier.name}
                        className="flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
                      >
                        {scraping === carrier.name ? (
                          <>
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            Scraping...
                          </>
                        ) : (
                          <>
                            <i className="ri-download-cloud-line" />
                            Scrape
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview panel */}
        <div>
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground-500 mb-3">Preview</h2>
          <div className="rounded-xl border border-brand-border bg-brand-surface">
            {!preview ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <i className="ri-search-2-line text-4xl text-foreground-200" />
                <p className="mt-3 text-sm text-foreground-400">
                  Click "Scrape" on any carrier to preview available jobs before importing.
                </p>
              </div>
            ) : preview.error ? (
              <div className="p-5">
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                  <i className="ri-error-warning-line mt-0.5 text-red-500" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Scrape failed for {preview.carrier}</p>
                    <p className="mt-1 text-xs text-red-600">{preview.error}</p>
                    <p className="mt-2 text-xs text-red-500">
                      This carrier's page may be JavaScript-rendered (React/Angular) and requires a headless browser.
                      Try visiting their site manually and checking for job RSS feeds.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Preview header */}
                <div className="border-b border-brand-border px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground-950 text-sm">{preview.carrier}</p>
                      <p className="text-xs text-foreground-500 mt-0.5">{preview.jobs.length} jobs found</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <button onClick={selectAll} className="text-primary-600 hover:underline">All</button>
                      <span className="text-foreground-300">·</span>
                      <button onClick={selectNone} className="text-primary-600 hover:underline">None</button>
                      <span className="text-foreground-300">·</span>
                      <span className="font-semibold text-foreground-700">{selectedJobs.size} selected</span>
                    </div>
                  </div>
                </div>

                {preview.jobs.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <i className="ri-file-unknown-line text-3xl text-foreground-200" />
                    <p className="mt-2 text-sm text-foreground-500">No schema.org JobPosting data found on this page.</p>
                    <p className="mt-1 text-xs text-foreground-400">This carrier's site may be fully JavaScript-rendered.</p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-[500px] overflow-y-auto divide-y divide-brand-border">
                      {preview.jobs.map((job, i) => (
                        <label
                          key={i}
                          className={`flex items-start gap-3 px-5 py-3 cursor-pointer transition-colors ${
                            selectedJobs.has(i) ? "bg-primary-50" : "hover:bg-background-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedJobs.has(i)}
                            onChange={() => toggleJob(i)}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-primary-500"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground-950 leading-tight">{job.title}</p>
                            <p className="text-xs text-foreground-500 mt-0.5">
                              {job.location}
                              {job.route_type && ` · ${job.route_type}`}
                              {job.equipment && ` · ${job.equipment}`}
                            </p>
                            {job.pay_rate && (
                              <p className="text-xs font-semibold text-green-700 mt-0.5">{job.pay_rate}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Import button */}
                    <div className="border-t border-brand-border p-4">
                      <button
                        onClick={handleImport}
                        disabled={importing || selectedJobs.size === 0}
                        className="w-full rounded-lg bg-green-600 py-3 text-sm font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {importing ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            Importing...
                          </span>
                        ) : (
                          `Import ${selectedJobs.size} Job${selectedJobs.size !== 1 ? "s" : ""} to Database`
                        )}
                      </button>
                      <p className="mt-2 text-center text-xs text-foreground-400">
                        Existing jobs (same title + location) will be updated, not duplicated.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-xl">
            <h3 className="font-heading text-lg font-bold text-foreground-950">Clear {deleteTarget} jobs?</h3>
            <p className="mt-2 text-sm text-foreground-600">
              This will delete all aggregated jobs from {deleteTarget} from your database. Jobs added manually with the same carrier name will not be affected.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-lg border border-brand-border py-2.5 text-sm font-semibold text-foreground-700 hover:bg-background-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
