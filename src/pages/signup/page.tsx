import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/feature/Navbar";
import SeoHead from "@/components/feature/SeoHead";
export default function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasCdl, setHasCdl] = useState(true);
  const [cdlState, setCdlState] = useState("");
  const [experience, setExperience] = useState("");
  const [driverType, setDriverType] = useState("company_driver");
  const [preferredRoute, setPreferredRoute] = useState("");
  const [preferredEquipment, setPreferredEquipment] = useState("");
  const [homeTimePreference, setHomeTimePreference] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const { error: err } = await signUp(email, password, {
      full_name: fullName,
      phone,
      has_cdl: hasCdl,
      cdl_state: cdlState,
      experience,
      driver_type: driverType,
      preferred_route: preferredRoute,
      preferred_equipment: preferredEquipment,
      home_time_preference: homeTimePreference,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      navigate("/");
    }
  };

  const usStates = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  ];

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text">
      <SeoHead
        title="Create Your Driver Profile - Join Our CDL Network"
        description="Create a free TruckDriverJobs.co profile to unlock full job details, apply in 30 seconds, and get matched with top carriers. No resume needed."
        keywords="CDL driver signup, truck driver registration, create driver profile, join CDL network"
      />
      <Navbar />
      <div className="mx-auto max-w-2xl px-6 py-12 md:px-10">
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange-light">
              <i className="ri-user-add-line text-2xl text-brand-orange" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-brand-text">
              Join Our Driver Network
            </h1>
            <p className="mt-2 text-sm text-brand-text-secondary">
              Create your free profile to unlock full job details and get matched with top carriers
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Account Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none focus:border-brand-orange"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none focus:border-brand-orange"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none focus:border-brand-orange"
                  placeholder="driver@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none focus:border-brand-orange"
                  placeholder="Min 6 characters"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none focus:border-brand-orange"
                placeholder="Confirm your password"
              />
            </div>

            <div className="border-t border-brand-border pt-5">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-text">
                CDL & Experience
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
                    Do you have a Class A CDL?
                  </label>
                  <select
                    value={hasCdl ? "yes" : "no"}
                    onChange={(e) => setHasCdl(e.target.value === "yes")}
                    className="w-full rounded-lg border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none focus:border-brand-orange"
                  >
                    <option value="yes">Yes, I have a Class A CDL</option>
                    <option value="no">No, I need help getting one</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
                    CDL State
                  </label>
                  <select
                    value={cdlState}
                    onChange={(e) => setCdlState(e.target.value)}
                    className="w-full rounded-lg border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none focus:border-brand-orange"
                  >
                    <option value="">Select state</option>
                    {usStates.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
                    Years of Experience
                  </label>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full rounded-lg border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none focus:border-brand-orange"
                  >
                    <option value="">Select experience</option>
                    <option value="No experience">No experience (CDL student)</option>
                    <option value="Less than 1 year">Less than 1 year</option>
                    <option value="1-3 years">1-3 years</option>
                    <option value="3+ years">3+ years</option>
                    <option value="5+ years">5+ years</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
                    Driver Type
                  </label>
                  <select
                    value={driverType}
                    onChange={(e) => setDriverType(e.target.value)}
                    className="w-full rounded-lg border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none focus:border-brand-orange"
                  >
                    <option value="company_driver">Company Driver</option>
                    <option value="owner_operator">Owner-Operator</option>
                    <option value="team_driver">Team Driver</option>
                    <option value="student">Student / New CDL</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-brand-border pt-5">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-text">
                Job Preferences
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
                    Preferred Route Type
                  </label>
                  <select
                    value={preferredRoute}
                    onChange={(e) => setPreferredRoute(e.target.value)}
                    className="w-full rounded-lg border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none focus:border-brand-orange"
                  >
                    <option value="">Any route type</option>
                    <option value="OTR">OTR (Over the Road)</option>
                    <option value="Regional">Regional</option>
                    <option value="Dedicated">Dedicated</option>
                    <option value="Local">Local</option>
                    <option value="Team">Team</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
                    Preferred Equipment
                  </label>
                  <select
                    value={preferredEquipment}
                    onChange={(e) => setPreferredEquipment(e.target.value)}
                    className="w-full rounded-lg border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none focus:border-brand-orange"
                  >
                    <option value="">Any equipment</option>
                    <option value="Dry Van">Dry Van</option>
                    <option value="Reefer">Reefer</option>
                    <option value="Flatbed">Flatbed</option>
                    <option value="Step Deck">Step Deck</option>
                    <option value="Tanker">Tanker</option>
                    <option value="Chassis">Chassis / Container</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
                    Home Time Preference
                  </label>
                  <select
                    value={homeTimePreference}
                    onChange={(e) => setHomeTimePreference(e.target.value)}
                    className="w-full rounded-lg border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none focus:border-brand-orange"
                  >
                    <option value="">Any schedule</option>
                    <option value="Home Daily">Home Daily</option>
                    <option value="Home Weekly">Home Weekly</option>
                    <option value="Home Every Weekend">Home Every Weekend</option>
                    <option value="Home Every 10-14 Days">Home Every 10-14 Days</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
                    Minimum Weekly Pay Goal
                  </label>
                  <select
                    className="w-full rounded-lg border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none focus:border-brand-orange"
                  >
                    <option value="">Any pay</option>
                    <option value="1000">$1,000+/week</option>
                    <option value="1200">$1,200+/week</option>
                    <option value="1500">$1,500+/week</option>
                    <option value="1800">$1,800+/week</option>
                    <option value="2000">$2,000+/week</option>
                    <option value="2500">$2,500+/week</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-orange py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-orange-hover disabled:opacity-50"
            >
              {loading ? "Creating profile..." : "CREATE FREE PROFILE"}
            </button>

            <p className="text-center text-xs text-brand-text-muted">
              By signing up, you agree to our terms and consent to being contacted by our recruiters and partner carriers.
            </p>
          </form>

          <div className="mt-6 border-t border-brand-border pt-6 text-center">
            <p className="text-sm text-brand-text-secondary">
              Already have an account?{" "}
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