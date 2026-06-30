import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/db";
import Navbar from "@/components/feature/Navbar";
import Footer from "@/components/feature/Footer";
import SeoHead from "@/components/feature/SeoHead";
import { jobs } from "@/mocks/jobs";

interface SavedJob {
  id: number;
  job_id: number;
  created_at: string;
}

interface Application {
  id: number;
  job_id: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const statusStyles: Record<string, string> = {
  submitted: "bg-blue-50 text-blue-600 border-blue-200",
  reviewed: "bg-yellow-50 text-yellow-600 border-yellow-200",
  contacted: "bg-brand-orange-light text-brand-orange border-brand-orange/20",
  hired: "bg-green-50 text-green-600 border-green-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
};

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  reviewed: "Under Review",
  contacted: "Contacted",
  hired: "Hired",
  rejected: "Not Selected",
};

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "saved" | "applications">("overview");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    const [savedRes, appsRes] = await Promise.all([
      db.from("saved_jobs").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      db.from("applications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
    ]);
    setSavedJobs(savedRes.data ?? []);
    setApplications(appsRes.data ?? []);
    setLoading(false);
  };

  const removeSavedJob = async (id: number) => {
    await db.from("saved_jobs").delete().eq("id", id);
    setSavedJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const getJobById = (jobId: number) => jobs.find((j) => Number(j.id) === jobId);

  const profileCompletion = () => {
    const fields = [
      profile?.full_name,
      profile?.phone,
      profile?.experience,
      profile?.driver_type,
      profile?.preferred_route,
      profile?.preferred_equipment,
      profile?.home_time_preference,
      profile?.min_pay_expectation,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text">
      <SeoHead
        title="Driver Dashboard"
        description="Your TruckDriverJobs.co driver dashboard. View saved jobs, application history, and profile."
      />
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-brand-text md:text-4xl">
            Driver <span className="text-brand-orange">Dashboard</span>
          </h1>
          <p className="mt-2 text-sm text-brand-text-secondary">
            Welcome back, {profile?.full_name || "Driver"}. Here is everything you need to land your next job.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange-light">
                <i className="ri-bookmark-line text-brand-orange" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-text">{savedJobs.length}</p>
                <p className="text-xs text-brand-text-secondary">Saved Jobs</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange-light">
                <i className="ri-send-plane-line text-brand-orange" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-text">{applications.length}</p>
                <p className="text-xs text-brand-text-secondary">Applications Sent</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange-light">
                <i className="ri-user-star-line text-brand-orange" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-text">{profileCompletion()}%</p>
                <p className="text-xs text-brand-text-secondary">Profile Complete</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange-light">
                <i className="ri-briefcase-line text-brand-orange" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-text">{jobs.length}</p>
                <p className="text-xs text-brand-text-secondary">Jobs Available</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-brand-border bg-brand-surface p-1 w-fit">
          {[
            { id: "overview", label: "Overview", icon: "ri-dashboard-line" },
            { id: "saved", label: `Saved Jobs (${savedJobs.length})`, icon: "ri-bookmark-line" },
            { id: "applications", label: `Applications (${applications.length})`, icon: "ri-send-plane-line" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-brand-orange text-white"
                  : "text-brand-text-secondary hover:text-brand-text"
              }`}
            >
              <i className={tab.icon} />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Profile Card */}
                <div className="rounded-xl border border-brand-border bg-brand-surface p-6 lg:col-span-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange-light">
                      <i className="ri-user-line text-xl text-brand-orange" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold text-brand-text">
                        {profile?.full_name || "Your Profile"}
                      </h3>
                      <p className="text-xs text-brand-text-secondary">{profile?.driver_type?.replace("_", " ") || "Driver"}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Experience", value: profile?.experience || "Not set" },
                      { label: "CDL", value: profile?.has_cdl ? `Class A (${profile?.cdl_state || "State not set"})` : "No CDL on file" },
                      { label: "Preferred Route", value: profile?.preferred_route || "Not set" },
                      { label: "Equipment", value: profile?.preferred_equipment || "Not set" },
                      { label: "Home Time", value: profile?.home_time_preference || "Not set" },
                      { label: "Min Pay Goal", value: profile?.min_pay_expectation || "Not set" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-xs text-brand-text-secondary">{item.label}</span>
                        <span className="text-sm font-medium text-brand-text">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-brand-text-secondary">Profile completion</span>
                      <span className="font-bold text-brand-orange">{profileCompletion()}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-brand-bg">
                      <div
                        className="h-2 rounded-full bg-brand-orange transition-all"
                        style={{ width: `${profileCompletion()}%` }}
                      />
                    </div>
                  </div>
                  <Link
                    to="#"
                    onClick={() => alert("Profile edit coming soon!")}
                    className="mt-4 block w-full rounded-lg border border-brand-border py-2 text-center text-sm font-semibold text-brand-text transition-colors hover:border-brand-orange hover:text-brand-orange"
                  >
                    Edit Profile
                  </Link>
                </div>

                {/* Recent Saved */}
                <div className="rounded-xl border border-brand-border bg-brand-surface p-6 lg:col-span-2">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-heading text-lg font-bold text-brand-text">Recent Saved Jobs</h3>
                    <button
                      onClick={() => setActiveTab("saved")}
                      className="text-sm font-semibold text-brand-orange hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  {savedJobs.length === 0 ? (
                    <div className="rounded-lg bg-brand-bg p-8 text-center">
                      <i className="ri-bookmark-line text-3xl text-brand-text-muted" />
                      <p className="mt-2 text-sm font-semibold text-brand-text">No saved jobs yet</p>
                      <p className="mt-1 text-xs text-brand-text-secondary">Browse jobs and click the bookmark icon to save them here.</p>
                      <Link
                        to="/jobs"
                        className="mt-4 inline-block rounded-lg bg-brand-orange px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-orange-hover"
                      >
                        Browse Jobs
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedJobs.slice(0, 3).map((saved) => {
                        const job = getJobById(saved.job_id);
                        if (!job) return null;
                        return (
                          <div key={saved.id} className="flex items-center justify-between rounded-lg border border-brand-border bg-brand-bg p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange-light">
                                <i className="ri-truck-line text-brand-orange" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-brand-text">{job.title}</p>
                                <p className="text-xs text-brand-text-secondary">{job.location} &middot; {job.payRate}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/jobs/${job.id}`}
                                className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-text transition-colors hover:border-brand-orange hover:text-brand-orange"
                              >
                                View
                              </Link>
                              <button
                                onClick={() => removeSavedJob(saved.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border text-brand-text-muted transition-colors hover:border-red-300 hover:text-red-500"
                                title="Remove"
                              >
                                <i className="ri-delete-bin-line" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Applications */}
                <div className="rounded-xl border border-brand-border bg-brand-surface p-6 lg:col-span-3">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-heading text-lg font-bold text-brand-text">Recent Applications</h3>
                    <button
                      onClick={() => setActiveTab("applications")}
                      className="text-sm font-semibold text-brand-orange hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  {applications.length === 0 ? (
                    <div className="rounded-lg bg-brand-bg p-8 text-center">
                      <i className="ri-send-plane-line text-3xl text-brand-text-muted" />
                      <p className="mt-2 text-sm font-semibold text-brand-text">No applications yet</p>
                      <p className="mt-1 text-xs text-brand-text-secondary">Apply to jobs and track your progress here.</p>
                      <Link
                        to="/jobs"
                        className="mt-4 inline-block rounded-lg bg-brand-orange px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-orange-hover"
                      >
                        Find Jobs
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {applications.slice(0, 3).map((app) => {
                        const job = getJobById(app.job_id);
                        return (
                          <div key={app.id} className="flex flex-col gap-3 rounded-lg border border-brand-border bg-brand-bg p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange-light">
                                <i className="ri-truck-line text-brand-orange" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-brand-text">{job?.title || `Job #${app.job_id}`}</p>
                                <p className="text-xs text-brand-text-secondary">
                                  Applied {new Date(app.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusStyles[app.status] || "bg-brand-bg text-brand-text-muted"}`}>
                                {statusLabels[app.status] || app.status}
                              </span>
                              <Link
                                to={`/jobs/${app.job_id}`}
                                className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-text transition-colors hover:border-brand-orange hover:text-brand-orange"
                              >
                                View Job
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SAVED JOBS TAB */}
            {activeTab === "saved" && (
              <div className="rounded-xl border border-brand-border bg-brand-surface p-6">
                <h3 className="font-heading text-lg font-bold text-brand-text mb-4">Saved Jobs</h3>
                {savedJobs.length === 0 ? (
                  <div className="rounded-lg bg-brand-bg p-10 text-center">
                    <i className="ri-bookmark-line text-4xl text-brand-text-muted" />
                    <p className="mt-3 text-sm font-semibold text-brand-text">No saved jobs yet</p>
                    <p className="mt-1 text-xs text-brand-text-secondary">Browse jobs and click the bookmark icon to save them here.</p>
                    <Link
                      to="/jobs"
                      className="mt-4 inline-block rounded-lg bg-brand-orange px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-orange-hover"
                    >
                      Browse Jobs
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedJobs.map((saved) => {
                      const job = getJobById(saved.job_id);
                      if (!job) return null;
                      return (
                        <div key={saved.id} className="flex flex-col gap-3 rounded-lg border border-brand-border bg-brand-bg p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange-light">
                              <i className="ri-truck-line text-brand-orange" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-brand-text">{job.title}</p>
                              <p className="text-xs text-brand-text-secondary">{job.company} &middot; {job.location} &middot; {job.payRate}</p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                <span className="rounded-full bg-brand-surface px-2 py-0.5 text-[10px] font-medium text-brand-text-secondary border border-brand-border">{job.routeType}</span>
                                <span className="rounded-full bg-brand-surface px-2 py-0.5 text-[10px] font-medium text-brand-text-secondary border border-brand-border">{job.equipment}</span>
                                <span className="rounded-full bg-brand-surface px-2 py-0.5 text-[10px] font-medium text-brand-text-secondary border border-brand-border">{job.homeTime}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/jobs/${job.id}`}
                              className="rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text transition-colors hover:border-brand-orange hover:text-brand-orange"
                            >
                              View Job
                            </Link>
                            <button
                              onClick={() => removeSavedJob(saved.id)}
                              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* APPLICATIONS TAB */}
            {activeTab === "applications" && (
              <div className="rounded-xl border border-brand-border bg-brand-surface p-6">
                <h3 className="font-heading text-lg font-bold text-brand-text mb-4">Application History</h3>
                {applications.length === 0 ? (
                  <div className="rounded-lg bg-brand-bg p-10 text-center">
                    <i className="ri-send-plane-line text-4xl text-brand-text-muted" />
                    <p className="mt-3 text-sm font-semibold text-brand-text">No applications yet</p>
                    <p className="mt-1 text-xs text-brand-text-secondary">Apply to jobs and track your progress here.</p>
                    <Link
                      to="/jobs"
                      className="mt-4 inline-block rounded-lg bg-brand-orange px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-orange-hover"
                    >
                      Find Jobs
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.map((app) => {
                      const job = getJobById(app.job_id);
                      return (
                        <div key={app.id} className="rounded-lg border border-brand-border bg-brand-bg p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange-light">
                                <i className="ri-truck-line text-brand-orange" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-brand-text">{job?.title || `Job #${app.job_id}`}</p>
                                <p className="text-xs text-brand-text-secondary">
                                  {job?.company} &middot; Applied {new Date(app.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusStyles[app.status] || "bg-brand-bg text-brand-text-muted"}`}>
                                {statusLabels[app.status] || app.status}
                              </span>
                              <Link
                                to={`/jobs/${app.job_id}`}
                                className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-text transition-colors hover:border-brand-orange hover:text-brand-orange"
                              >
                                View Job
                              </Link>
                            </div>
                          </div>
                          {app.notes && (
                            <div className="mt-3 rounded-md bg-brand-orange-light p-3">
                              <p className="text-xs font-semibold text-brand-orange">Recruiter Note</p>
                              <p className="text-xs text-brand-text-secondary">{app.notes}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}