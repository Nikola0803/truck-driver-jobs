import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/feature/Navbar";
import SeoHead from "@/components/feature/SeoHead";

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text">
      <SeoHead
        title="Driver Login"
        description="Log in to your TruckDriverJobs.co account to access full job details, apply to positions, and manage your saved jobs and applications."
      />
      <Navbar />
      <div className="mx-auto max-w-md px-6 py-12 md:px-10">
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange-light">
              <i className="ri-truck-line text-2xl text-brand-orange" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-brand-text">
              Driver Login
            </h1>
            <p className="mt-2 text-sm text-brand-text-secondary">
              Access your personalized job matches and applications
            </p>
          </div>

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
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none transition-colors focus:border-brand-orange"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-orange py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-orange-hover disabled:opacity-50"
            >
              {loading ? "Signing in..." : "SIGN IN"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-brand-text-secondary">
              New driver?{" "}
              <Link
                to="/signup"
                className="font-semibold text-brand-orange hover:underline"
              >
                Create an account
              </Link>
            </p>
            <p className="mt-2 text-sm text-brand-text-secondary">
              Forgot your password?{" "}
              <Link
                to="/forgot-password"
                className="font-semibold text-brand-orange hover:underline"
              >
                Reset it
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}