import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import FlowRouter from './components/FlowRouter';
import Layout from './components/Layout';
import StaticLayout from './components/StaticLayout';
import { PolicyCreationFlow } from './flows/policyCreationFlow';
import { PopulationCreationFlow } from './flows/populationCreationFlow';
import { ReportCreationFlow } from './flows/reportCreationFlow';
import { SimulationCreationFlow } from './flows/simulationCreationFlow';
import DonatePage from './pages/Donate.page';
import LandingPage from './pages/Landing.page';
import PoliciesPage from './pages/Policies.page';
import PopulationsPage from './pages/Populations.page';
import PrivacyPage from './pages/Privacy.page';
import ReportOutputPage from './pages/ReportOutput.page';
import ReportsPage from './pages/Reports.page';
import SimulationsPage from './pages/Simulations.page';
import SupportersPage from './pages/Supporters.page';
import TeamPage from './pages/Team.page';
import TermsPage from './pages/Terms.page';
import { CountryGuard } from './routing/guards/CountryGuard';
import { MetadataGuard } from './routing/guards/MetadataGuard';
import { MetadataLazyLoader } from './routing/guards/MetadataLazyLoader';

const router = createBrowserRouter(
  [
    {
      path: '/',
      // TODO: Replace with dynamic default country based on user location/preferences
      element: <Navigate to="/us" replace />,
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
              element: <Layout />,
              children: [
                {
                  path: 'report-output/:reportId/:subpage?/:view?',
                  element: <ReportOutputPage />,
                },
              ],
            },
          ],
        },
        {
          path: 'home',
          index: true,
          element: <LandingPage />,
        },
        // Routes that benefit from metadata but don't require it (lazy loader)
        {
          element: <MetadataLazyLoader />,
          children: [
            {
              element: <Layout />,
              children: [
                {
                  index: true,
                  element: <Navigate to="reports" replace />,
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
                  path: 'populations',
                  element: <PopulationsPage />,
                },
                {
                  path: 'populations/create',
                  element: <FlowRouter flow={PopulationCreationFlow} returnPath="populations" />,
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
          ],
        },
        // Routes that don't need metadata at all (no guard)
        {
          element: <Layout />,
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
