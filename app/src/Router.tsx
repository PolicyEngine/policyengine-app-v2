import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import FlowRouter from './components/FlowRouter';
import AppLayout from './components/AppLayout';
import PathwayLayout from './components/PathwayLayout';
import StaticLayout from './components/StaticLayout';
import { PolicyCreationFlow } from './flows/policyCreationFlow';
import { PopulationCreationFlow } from './flows/populationCreationFlow';
import { ReportCreationFlow } from './flows/reportCreationFlow';
import { SimulationCreationFlow } from './flows/simulationCreationFlow';
import AppPage from './pages/AppPage';
import BlogPage from './pages/Blog.page';
import DashboardPage from './pages/Dashboard.page';
import DonatePage from './pages/Donate.page';
import HomePage from './pages/Home.page';
import PoliciesPage from './pages/Policies.page';
import PopulationsPage from './pages/Populations.page';
import PrivacyPage from './pages/Privacy.page';
import ReportOutputPage from './pages/ReportOutput.page';
import ReportsPage from './pages/Reports.page';
import ResearchPage from './pages/Research.page';
import SimulationsPage from './pages/Simulations.page';
import SupportersPage from './pages/Supporters.page';
import TeamPage from './pages/Team.page';
import TermsPage from './pages/Terms.page';
import { CountryAppGuard } from './routing/guards/CountryAppGuard';
import { CountryGuard } from './routing/guards/CountryGuard';
import { MetadataGuard } from './routing/guards/MetadataGuard';
import { MetadataLazyLoader } from './routing/guards/MetadataLazyLoader';
import { RedirectToCountry } from './routing/RedirectToCountry';
import ReportPathwayWrapper from './pathways/report/ReportPathwayWrapper';
import SimulationPathwayWrapper from './pathways/simulation/SimulationPathwayWrapper';
import PopulationPathwayWrapper from './pathways/population/PopulationPathwayWrapper';

const router = createBrowserRouter(
  [
    {
      path: '/',
      // Dynamically detect and redirect to user's country
      element: <RedirectToCountry />,
    },
    {
      path: '/:countryId',
      element: <CountryGuard />,
      children: [
        // Routes that need metadata immediately (blocking guard)
        {
          element: <MetadataGuard />,
          children: [
            {
              element: <AppLayout />,
              children: [
                {
                  path: 'report-output/:reportId/:subpage?/:view?',
                  element: <ReportOutputPage />,
                },
              ],
            },
          ],
        },
        // Routes that benefit from metadata but don't require it (lazy loader)
        {
          element: <MetadataLazyLoader />,
          children: [
            // Regular routes with standard layout
            {
              element: <AppLayout />,
              children: [
                {
                  path: 'dashboard',
                  // TODO: Build dashboard page
                  element: <DashboardPage />,
                },
                {
                  path: 'reports',
                  element: <ReportsPage />,
                },
                {
                  path: 'reports/create',
                  element: <FlowRouter flow={ReportCreationFlow} returnPath="reports" />,
                },
                {
                  path: 'simulations',
                  element: <SimulationsPage />,
                },
                {
                  path: 'simulations/create',
                  element: <FlowRouter flow={SimulationCreationFlow} returnPath="simulations" />,
                },
                {
                  path: 'households',
                  element: <PopulationsPage />,
                },
                {
                  path: 'households/create',
                  element: <FlowRouter flow={PopulationCreationFlow} returnPath="households" />,
                },
                {
                  path: 'policies',
                  element: <PoliciesPage />,
                },
                {
                  path: 'policies/create',
                  element: <FlowRouter flow={PolicyCreationFlow} returnPath="policies" />,
                },
                {
                  path: 'account',
                  element: <div>Account settings page</div>,
                },
              ],
            },
            // V2 Pathway routes that manage their own layouts
            {
              element: <PathwayLayout />,
              children: [
                {
                  path: 'reports/create-v2',
                  element: <ReportPathwayWrapper />,
                },
                {
                  path: 'simulations/create-v2',
                  element: <SimulationPathwayWrapper />,
                },
                {
                  path: 'households/create-v2',
                  element: <PopulationPathwayWrapper />,
                },
              ],
            },
          ],
        },
        // Routes that don't need metadata at all (no guard)
        {
          element: <AppLayout />,
          children: [
            {
              path: 'configurations',
              element: <div>Configurations page</div>,
            },
          ],
        },
        // Static pages - use StaticLayout, no metadata needed
        {
          element: <StaticLayout />,
          children: [
            {
              index: true,
              element: <HomePage />,
            },
            {
              path: 'donate',
              element: <DonatePage />,
            },
            {
              path: 'supporters',
              element: <SupportersPage />,
            },
            {
              path: 'team',
              element: <TeamPage />,
            },
            {
              path: 'privacy',
              element: <PrivacyPage />,
            },
            {
              path: 'terms',
              element: <TermsPage />,
            },
            {
              path: 'methodology',
              element: <div>Methodology page</div>,
            },
            {
              path: 'support',
              element: <div>Support page</div>,
            },
            {
              path: 'research',
              element: <ResearchPage />,
            },
            {
              path: 'research/:slug',
              element: <BlogPage />,
            },
          ],
        },
        // Interactive app routes - use StaticLayout with CountryAppGuard
        {
          element: <CountryAppGuard />,
          children: [
            {
              element: <StaticLayout />,
              children: [
                {
                  path: ':slug',
                  element: <AppPage />,
                },
              ],
            },
          ],
        },
        // Legacy routes - redirect old blog URLs to new research URLs
        {
          children: [
            {
              path: 'blog/:postName',
              element: <Navigate to="research/:postName" replace />,
            },
          ],
        },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
);

export function Router() {
  return <RouterProvider router={router} />;
}
