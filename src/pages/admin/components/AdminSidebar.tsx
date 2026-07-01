import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const CRM_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: "ri-dashboard-line", end: true },
  { to: "/admin/leads", label: "AI Leads", icon: "ri-sparkling-line" },
  { to: "/admin/campaigns", label: "Campaigns", icon: "ri-megaphone-line" },
  { to: "/admin/groups", label: "Groups", icon: "ri-group-line" },
  { to: "/admin/queue", label: "Queue", icon: "ri-stack-line" },
  { to: "/admin/drivers", label: "Drivers", icon: "ri-user-line" },
  { to: "/admin/analytics", label: "Analytics", icon: "ri-bar-chart-2-line" },
];

const SITE_ITEMS = [
  { to: "/admin/jobs", label: "Jobs", icon: "ri-briefcase-line" },
  { to: "/admin/scraper", label: "Aggregator", icon: "ri-download-cloud-line" },
  { to: "/admin/blog", label: "Blog Posts", icon: "ri-article-line" },
  { to: "/admin/seo", label: "SEO Pages", icon: "ri-search-line" },
  { to: "/admin/users", label: "Users", icon: "ri-shield-user-line" },
];

export default function AdminSidebar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-brand-border bg-brand-surface">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-brand-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
          <i className="ri-truck-line text-white text-sm" />
        </div>
        <div>
          <p className="text-xs font-bold text-foreground-950 leading-tight">TruckDriverJobs</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary-500 leading-tight">Admin</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* CRM Section */}
        <div>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-foreground-400">Recruitment CRM</p>
          <ul className="space-y-0.5">
            {CRM_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-primary-50 text-primary-600"
                        : "text-foreground-600 hover:bg-background-100 hover:text-foreground-950"
                    }`
                  }
                >
                  <i className={`${item.icon} text-base`} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Website Section */}
        <div>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-foreground-400">Website Manager</p>
          <ul className="space-y-0.5">
            {SITE_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-accent-100 text-accent-700"
                        : "text-foreground-600 hover:bg-background-100 hover:text-foreground-950"
                    }`
                  }
                >
                  <i className={`${item.icon} text-base`} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t border-brand-border px-3 py-4 space-y-1">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground-600 transition-colors hover:bg-background-100 hover:text-foreground-950"
        >
          <i className="ri-external-link-line text-base" />
          View Site
        </a>
        <button
          onClick={() => { signOut(); navigate("/"); }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground-600 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <i className="ri-logout-box-line text-base" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}