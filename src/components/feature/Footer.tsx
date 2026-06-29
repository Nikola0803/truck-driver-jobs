import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-brand-border bg-brand-bg px-6 py-12 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-1">
              <span className="font-heading text-lg font-bold text-brand-text">TruckDriverJobs</span>
              <span className="font-heading text-lg font-bold text-brand-orange">.co</span>
            </Link>
            <p className="mt-2 text-xs font-medium text-brand-orange">Est. 2016 &middot; Serving drivers for 10+ years</p>
            <p className="mt-3 text-xs leading-relaxed text-brand-text-secondary">
              Connecting CDL Class A drivers with high-paying, vetted trucking positions across the United States since 2016.
              Bilingual recruiters available.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Drivers</h4>
            <ul className="mt-3 space-y-2">
              <li><Link to="/" className="text-sm text-brand-text transition-colors hover:text-brand-orange">Browse Jobs</Link></li>
              <li><Link to="/blog" className="text-sm text-brand-text transition-colors hover:text-brand-orange">Blog</Link></li>
              <li><Link to="/signup" className="text-sm text-brand-text transition-colors hover:text-brand-orange">Create Profile</Link></li>
              <li><Link to="/login" className="text-sm text-brand-text transition-colors hover:text-brand-orange">Driver Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Fleets</h4>
            <ul className="mt-3 space-y-2">
              {["Post a Job", "Pricing", "Driver Leads", "Partner Login"].map((item) => (
                <li key={item}>
                  <Link to="/for-fleets" className="text-sm text-brand-text transition-colors hover:text-brand-orange">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Contact</h4>
            <ul className="mt-3 space-y-2">
              <li className="text-sm text-brand-text">
                <i className="ri-phone-line mr-2 text-brand-orange" />
                (855) 555-TRUCK
              </li>
              <li className="text-sm text-brand-text">
                <i className="ri-mail-line mr-2 text-brand-orange" />
                hello@truckdriverjobs.co
              </li>
              <li className="text-xs text-brand-text-secondary">
                <i className="ri-map-pin-line mr-1.5 text-brand-text-muted" />
                1200 Commerce St, Dallas, TX 75202
              </li>
              <li className="mt-3 flex gap-3">
                <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-border text-brand-text transition-colors hover:bg-brand-orange hover:text-white">
                  <i className="ri-facebook-fill" />
                </a>
                <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-border text-brand-text transition-colors hover:bg-brand-orange hover:text-white">
                  <i className="ri-instagram-line" />
                </a>
                <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-border text-brand-text transition-colors hover:bg-brand-orange hover:text-white">
                  <i className="ri-linkedin-fill" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-brand-border pt-6 text-center">
          <p className="text-xs text-brand-text-muted">
            &copy; 2016 &ndash; 2026 TruckDriverJobs.co. All rights reserved. Built for blue-collar heroes.
            Serving American, Mexican, and European drivers since day one.
          </p>
        </div>
      </div>
    </footer>
  );
}