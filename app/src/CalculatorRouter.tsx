/**
 * Router for the Calculator app (app.policyengine.org)
 * Contains only the interactive calculator functionality
 */
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import StandardLayout from './components/StandardLayout';
import DashboardPage from './pages/Dashboard.page';
import PoliciesPage from './pages/Policies.page';
import PopulationsPage from './pages/Populations.page';
import ReportOutputPage from './pages/ReportOutput.page';
import ReportsPage from './pages/Reports.page';
import SimulationsPage from './pages/Simulations.page';
import PolicyPathwayWrapper from './pathways/policy/PolicyPathwayWrapper';
import PopulationPathwayWrapper from './pathways/population/PopulationPathwayWrapper';
import ReportPathwayWrapper from './pathways/report/ReportPathwayWrapper';
import SimulationPathwayWrapper from './pathways/simulation/SimulationPathwayWrapper';
import { CountryGuard } from './routing/guards/CountryGuard';
import { MetadataGuard } from './routing/guards/MetadataGuard';
import { MetadataLazyLoader } from './routing/guards/MetadataLazyLoader';
import { RedirectToCountry } from './routing/RedirectToCountry';

/**
 * Layout wrapper that renders StandardLayout with Outlet for nested routes.
 * This allows the app shell (header, sidebar) to remain visible while
 * child routes render their content.
 */
function StandardLayoutOutlet() {
  return (
    <StandardLayout>
      <Outlet />
    </StandardLayout>
  );
}

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <RedirectToCountry />,
    },
    {
      path: '/:countryId',
      element: <CountryGuard />,
      children: [
        // All routes that require metadata (single guard, single fetch)
        {
          element: <MetadataGuard />,
          children: [
            // Report output - uses StandardLayout for sidebar + navbar
            {
              element: <StandardLayoutOutlet />,
              children: [
                {
                  path: 'report-output/:reportId/:subpage?/:view?',
                  element: <ReportOutputPage />,
                },
              ],
            },
            // Pathway routes - pathways manage their own layouts
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
        // Routes that benefit from metadata but don't require it (lazy loader)
        {
          element: <MetadataLazyLoader />,
          children: [
            {
              element: <StandardLayoutOutlet />,
              children: [
                {
                  index: true,
                  element: <DashboardPage />,
                },
                {
                  path: 'dashboard',
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
          ],
        },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
);

export function CalculatorRouter() {
  return <RouterProvider router={router} />;
}
