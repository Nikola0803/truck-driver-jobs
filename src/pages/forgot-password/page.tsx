import { useState } from "react";
import { Link } from "react-router-dom";
import { db } from "@/lib/db";
import Navbar from "@/components/feature/Navbar";
import SeoHead from "@/components/feature/SeoHead";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const { error: err } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text">
      <SeoHead
        title="Reset Your Password"
        description="Forgot your TruckDriverJobs.co password? Enter your email and we will send you a reset link."
      />
      <Navbar />
      <div className="mx-auto max-w-md px-6 py-12 md:px-10">
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange-light">
              <i className="ri-lock-unlock-line text-2xl text-brand-orange" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-brand-text">
              Reset Password
            </h1>
            <p className="mt-2 text-sm text-brand-text-secondary">
              Enter your email and we will send you a link to reset your password
            </p>
          </div>

          {success ? (
            <div className="mt-6 text-center">
              <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
                Check your email! We have sent a password reset link to{" "}
                <span className="font-semibold">{email}</span>.
              </div>
              <p className="text-sm text-brand-text-secondary">
                Did not receive it?{" "}
                <button
                  onClick={() => setSuccess(false)}
                  className="font-semibold text-brand-orange hover:underline"
                >
                  Try again
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none transition-colors focus:border-brand-orange"
                  placeholder="driver@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-brand-orange py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-orange-hover disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-brand-text-secondary">
              Remember your password?{" "}
              <Link
                to="/login"
                className="font-semibold text-brand-orange hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}