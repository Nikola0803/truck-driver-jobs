import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setAccountOpen(false);
  }, [location]);

  const isHome = location.pathname === "/";

  const handleFindJobs = () => {
    navigate("/jobs");
  };

  const handleMouseEnter = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
    setAccountOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => {
      setAccountOpen(false);
    }, 250);
  };

  return (
    <nav className={`w-full transition-all ${scrolled && isHome ? "fixed top-0 z-50 bg-brand-surface/95 backdrop-blur-sm border-b border-brand-border" : "bg-transparent"}`}>
      <div className="mx-auto max-w-7xl px-6 py-4 md:px-10">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1">
            <span className="font-heading text-xl font-bold tracking-tight text-brand-text">
              TruckDriverJobs
            </span>
            <span className="font-heading text-xl font-bold tracking-tight text-brand-orange">
              .co
            </span>
            <span className="ml-2 hidden rounded-full border border-brand-border bg-brand-orange-light px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-orange lg:inline-block">
              Est. 2016
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-6 md:flex">
            <button
              onClick={handleFindJobs}
              className="text-sm font-semibold text-brand-text-secondary transition-colors hover:text-brand-text whitespace-nowrap"
            >
              Find Jobs
            </button>
            <Link
              to="/blog"
              className="text-sm font-semibold text-brand-text-secondary transition-colors hover:text-brand-text whitespace-nowrap"
            >
              Blog
            </Link>
            <Link
              to="/for-fleets"
              className="text-sm font-semibold text-brand-text-secondary transition-colors hover:text-brand-text whitespace-nowrap"
            >
              For Fleets
            </Link>
            <Link
              to="/for-fleets"
              className="rounded-lg border border-brand-orange px-4 py-2 text-sm font-semibold text-brand-orange transition-colors hover:bg-brand-orange hover:text-white whitespace-nowrap"
            >
              Post a Job
            </Link>

            {user ? (
              <div className="relative" onMouseLeave={handleMouseLeave}>
                <button
                  onClick={() => setAccountOpen(!accountOpen)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-border bg-brand-orange-light text-brand-orange transition-colors hover:border-brand-orange"
                  aria-label="Account menu"
                  onMouseEnter={handleMouseEnter}
                >
                  <i className="ri-user-line text-lg" />
                </button>

                {/* Account Dropdown */}
                {accountOpen && (
                  <div
                    className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-brand-border bg-brand-surface shadow-lg"
                    onMouseEnter={handleMouseEnter}
                  >
                    <div className="px-4 py-3 border-b border-brand-border">
                      <p className="text-sm font-bold text-brand-text truncate">
                        {user.email?.split("@")[0]}
                      </p>
                      <p className="text-xs text-brand-text-muted truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex flex-col p-2">
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-brand-text-secondary transition-colors hover:bg-brand-bg hover:text-brand-text"
                      >
                        <i className="ri-dashboard-line text-brand-text-muted" />
                        Dashboard
                      </Link>
                      <Link
                        to="/jobs"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-brand-text-secondary transition-colors hover:bg-brand-bg hover:text-brand-text"
                      >
                        <i className="ri-briefcase-line text-brand-text-muted" />
                        Browse Jobs
                      </Link>
                      <Link
                        to="/blog"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-brand-text-secondary transition-colors hover:bg-brand-bg hover:text-brand-text"
                      >
                        <i className="ri-article-line text-brand-text-muted" />
                        Blog
                      </Link>
                      <div className="my-1 border-t border-brand-border" />
                      <button
                        onClick={() => {
                          signOut();
                          navigate("/");
                        }}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
                      >
                        <i className="ri-logout-box-line text-red-400" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-brand-text-secondary transition-colors hover:text-brand-text whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="rounded-lg bg-brand-orange px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-orange-hover whitespace-nowrap"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="flex h-9 w-9 items-center justify-center md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <i className="ri-menu-3-line text-xl text-brand-text" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-brand-border bg-brand-surface px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                setMobileOpen(false);
                handleFindJobs();
              }}
              className="text-left text-sm font-semibold text-brand-text-secondary"
            >
              Find Jobs
            </button>
            <Link
              to="/blog"
              className="text-sm font-semibold text-brand-text-secondary"
              onClick={() => setMobileOpen(false)}
            >
              Blog
            </Link>
            <Link
              to="/for-fleets"
              className="text-sm font-semibold text-brand-text-secondary"
              onClick={() => setMobileOpen(false)}
            >
              For Fleets
            </Link>
            <Link
              to="/for-fleets"
              className="text-sm font-semibold text-brand-orange"
              onClick={() => setMobileOpen(false)}
            >
              Post a Job
            </Link>
            {user ? (
              <>
                <div className="border-t border-brand-border pt-3" />
                <Link
                  to="/dashboard"
                  className="text-sm font-semibold text-brand-text-secondary"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    signOut();
                    navigate("/");
                  }}
                  className="text-left text-sm font-semibold text-red-500"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <div className="border-t border-brand-border pt-3" />
                <Link
                  to="/login"
                  className="text-sm font-semibold text-brand-text-secondary"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="rounded-lg bg-brand-orange px-4 py-2 text-center text-sm font-bold text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}