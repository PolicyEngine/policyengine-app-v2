/**
 * Router for the Calculator app (app.policyengine.org)
 * Contains only the interactive calculator functionality
 */
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import PathwayLayout from './components/PathwayLayout';
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
import { CoreMetadataGuard } from './routing/guards/CoreMetadataGuard';
import { ParametersGuard } from './routing/guards/ParametersGuard';
import { RedirectToCountry } from './routing/RedirectToCountry';

/**
 * Layout wrapper that renders StandardLayout with Outlet for nested routes.
 * This allows the app shell (header, sidebar) to remain visible while
 * child guards like MetadataGuard show their loading states.
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
        // All routes need core metadata (variables + datasets)
        {
          element: <CoreMetadataGuard />,
          children: [
            // Routes that also need parameters (policy editing, reports)
            {
              element: <ParametersGuard />,
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
                {
                  element: <PathwayLayout />,
                  children: [
                    {
                      path: 'policies/create',
                      element: <PolicyPathwayWrapper />,
                    },
                  ],
                },
              ],
            },
            // Routes that only need core metadata
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
            // Pathway routes (core metadata only)
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
