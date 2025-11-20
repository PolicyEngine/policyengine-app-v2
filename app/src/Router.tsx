import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import PathwayLayout from './components/PathwayLayout';
import StandardLayout from './components/StandardLayout';
import StaticLayout from './components/StaticLayout';
import DashboardPage from './pages/Dashboard.page';
import DonatePage from './pages/Donate.page';
import HomePage from './pages/Home.page';
import PoliciesPage from './pages/Policies.page';
import PopulationsPage from './pages/Populations.page';
import PrivacyPage from './pages/Privacy.page';
import ReportOutputPage from './pages/ReportOutput.page';
import ReportsPage from './pages/Reports.page';
import RICTCCalculatorPage from './pages/RICTCCalculator.page';
import SimulationsPage from './pages/Simulations.page';
import SupportersPage from './pages/Supporters.page';
import TeamPage from './pages/Team.page';
import TermsPage from './pages/Terms.page';
import PolicyPathwayWrapper from './pathways/policy/PolicyPathwayWrapper';
import PopulationPathwayWrapper from './pathways/population/PopulationPathwayWrapper';
import ReportPathwayWrapper from './pathways/report/ReportPathwayWrapper';
import SimulationPathwayWrapper from './pathways/simulation/SimulationPathwayWrapper';
import { CountryGuard } from './routing/guards/CountryGuard';
import { MetadataGuard } from './routing/guards/MetadataGuard';
import { MetadataLazyLoader } from './routing/guards/MetadataLazyLoader';
import { USOnlyGuard } from './routing/guards/USOnlyGuard';
import { RedirectToCountry } from './routing/RedirectToCountry';
import { RedirectToLegacy } from './routing/RedirectToLegacy';

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
              element: (
                <StandardLayout>
                  <Outlet />
                </StandardLayout>
              ),
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
              element: (
                <StandardLayout>
                  <Outlet />
                </StandardLayout>
              ),
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
                  path: 'simulations',
                  element: <SimulationsPage />,
                },
                {
                  path: 'households',
                  element: <PopulationsPage />,
                },
                {
                  path: 'policies',
                  element: <PoliciesPage />,
                },
                {
                  path: 'account',
                  element: <div>Account settings page</div>,
                },
              ],
            },
            // Pathway routes that manage their own layouts
            {
              element: <PathwayLayout />,
              children: [
                {
                  path: 'reports/create',
                  element: <ReportPathwayWrapper />,
                },
                {
                  path: 'simulations/create',
                  element: <SimulationPathwayWrapper />,
                },
                {
                  path: 'households/create',
                  element: <PopulationPathwayWrapper />,
                },
                {
                  path: 'policies/create',
                  element: <PolicyPathwayWrapper />,
                },
              ],
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
          ],
        },
        // US-only routes
        {
          element: <USOnlyGuard />,
          children: [
            {
              element: <StaticLayout />,
              children: [
                {
                  path: 'rhode-island-ctc-calculator',
                  element: <RICTCCalculatorPage />,
                },
              ],
            },
          ],
        },
        // Legacy routes - redirect to legacy.policyengine.org
        {
          children: [
            // Research routes
            {
              path: 'research',
              element: <RedirectToLegacy />,
            },
            {
              path: 'research/:postName',
              element: <RedirectToLegacy />,
            },
            {
              path: 'blog/:postName',
              element: <RedirectToLegacy />,
            },
            // Generic app routes
            {
              path: 'obbba-household-explorer',
              element: <RedirectToLegacy />,
            },
            {
              path: 'obbba-household-by-household',
              element: <RedirectToLegacy />,
            },
            {
              path: 'two-child-limit-comparison',
              element: <RedirectToLegacy />,
            },
            // Country-specific legacy routes (must come before :appName catch-all)
            {
              path: 'cec',
              element: <RedirectToLegacy />,
            },
            {
              path: '2024-manifestos',
              element: <RedirectToLegacy />,
            },
            {
              path: 'trafwa-ctc-calculator',
              element: <RedirectToLegacy />,
            },
            {
              path: 'state-eitcs-ctcs',
              element: <RedirectToLegacy />,
            },
            {
              path: 'child-tax-credit-2024-election-calculator',
              element: <RedirectToLegacy />,
            },
            {
              path: 'child-tax-credit-calculator',
              element: <RedirectToLegacy />,
            },
            {
              path: 'givecalc',
              element: <RedirectToLegacy />,
            },
            {
              path: 'aca-calc',
              element: <RedirectToLegacy />,
            },
            {
              path: '2024-election-calculator',
              element: <RedirectToLegacy />,
            },
            {
              path: 'salternative',
              element: <RedirectToLegacy />,
            },
            // Generic catch-all for any other app (must be last)
            {
              path: ':appName',
              element: <RedirectToLegacy />,
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
