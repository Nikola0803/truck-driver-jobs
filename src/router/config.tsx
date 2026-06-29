import type { RouteObject } from "react-router-dom";
import AuthGuard from "@/components/feature/AuthGuard";
import AdminGuard from "@/components/feature/AdminGuard";
import AdminLayout from "@/pages/admin/components/AdminLayout";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import JobsList from "../pages/jobs/page";
import JobDetail from "../pages/job-detail/page";
import Login from "../pages/login/page";
import Signup from "../pages/signup/page";
import ForgotPassword from "../pages/forgot-password/page";
import Blog from "../pages/blog/page";
import BlogPost from "../pages/blog-post/page";
import ForFleets from "../pages/for-fleets/page";
import Dashboard from "../pages/dashboard/page";
import AdminDashboard from "../pages/admin/dashboard/page";
import AdminDrivers from "../pages/admin/drivers/page";
import CampaignsList from "../pages/admin/campaigns/page";
import CampaignDetail from "../pages/admin/campaigns/detail/page";
import GroupsList from "../pages/admin/groups/page";
import QueuePage from "../pages/admin/queue/page";
import AnalyticsPage from "../pages/admin/analytics/page";
import BlogManager from "../pages/admin/blog/page";
import SeoPages from "../pages/admin/seo/page";
import AdminJobs from "../pages/admin/jobs/page";
import ScraperPage from "../pages/admin/scraper/page";
import PrivacyPolicy from "../pages/privacy/page";
import MatchPage from "../pages/match/page";
import AdminLeads from "../pages/admin/leads/page";
import CdlJobsPage from "../pages/cdl-jobs/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/jobs",
    element: <JobsList />,
  },
  {
    path: "/jobs/:id",
    element: <JobDetail />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/dashboard",
    element: (
      <AuthGuard>
        <Dashboard />
      </AuthGuard>
    ),
  },
  {
    path: "/admin",
    element: (
      <AdminGuard>
        <AdminLayout />
      </AdminGuard>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "drivers", element: <AdminDrivers /> },
      { path: "campaigns", element: <CampaignsList /> },
      { path: "campaigns/:id", element: <CampaignDetail /> },
      { path: "groups", element: <GroupsList /> },
      { path: "queue", element: <QueuePage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "jobs", element: <AdminJobs /> },
      { path: "blog", element: <BlogManager /> },
      { path: "seo", element: <SeoPages /> },
      { path: "scraper", element: <ScraperPage /> },
      { path: "leads", element: <AdminLeads /> },
    ],
  },
  {
    path: "/blog",
    element: <Blog />,
  },
  {
    path: "/blog/:slug",
    element: <BlogPost />,
  },
  {
    path: "/for-fleets",
    element: <ForFleets />,
  },
  {
    path: "/privacy",
    element: <PrivacyPolicy />,
  },
  {
    path: "/match",
    element: <MatchPage />,
  },
  {
    path: "/cdl-jobs/:slug",
    element: <CdlJobsPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;