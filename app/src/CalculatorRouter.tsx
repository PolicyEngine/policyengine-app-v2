/**
 * Router for the Calculator app (app.policyengine.org)
 * Contains only the interactive calculator functionality
 */
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useParams } from 'react-router-dom';
import PathwayLayout from './components/PathwayLayout';
import StandardLayout from './components/StandardLayout';
import NotFoundPage from './pages/NotFound.page';
import PoliciesPage from './pages/Policies.page';
import PopulationsPage from './pages/Populations.page';
import ModalPathwayDebugPage from './pages/reportBuilder/ModalPathwayDebugPage';
import ModifyReportPage from './pages/reportBuilder/ModifyReportPage';
import ReportBuilderPage from './pages/reportBuilder/ReportBuilderPage';
import ReportOutputPage from './pages/ReportOutput.page';
import ReportsPage from './pages/Reports.page';
import SimulationsPage from './pages/Simulations.page';
import PolicyPathwayWrapper from './pathways/policy/PolicyPathwayWrapper';
import PopulationPathwayWrapper from './pathways/population/PopulationPathwayWrapper';
import SimulationPathwayWrapper from './pathways/simulation/SimulationPathwayWrapper';
import { CountryGuard } from './routing/guards/CountryGuard';
import { MetadataGuard } from './routing/guards/MetadataGuard';
import { MetadataLazyLoader } from './routing/guards/MetadataLazyLoader';
import { RedirectToCountry } from './routing/RedirectToCountry';

/** Bridges react-router useParams to ModifyReportPage's prop interface. */
function ModifyReportPageRoute() {
  const { userReportId } = useParams<{ userReportId: string }>();
  return <ModifyReportPage userReportId={userReportId} />;
}

/** Bridges report-output config params to ModifyReportPage's prop interface. */
function ReportConfigPageRoute() {
  const { reportId } = useParams<{ reportId: string }>();
  return <ModifyReportPage userReportId={reportId} />;
}

/** Bridges react-router useParams to ReportOutputPage's prop interface. */
function ReportOutputRoute() {
  const { reportId, subpage, view } = useParams<{
    reportId: string;
    subpage?: string;
    view?: string;
  }>();
  return <ReportOutputPage reportId={reportId} subpage={subpage} view={view} />;
}

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
                  path: 'report-output/:reportId/config',
                  element: <ReportConfigPageRoute />,
                },
                {
                  path: 'report-output/:reportId/:subpage?/:view?',
                  element: <ReportOutputRoute />,
                },
                {
                  path: 'reports/modal-debug',
                  element: <ModalPathwayDebugPage />,
                },
              ],
            },
            // Pathway routes - pathways manage their own layouts
            {
              element: <PathwayLayout />,
              children: [
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
        // Routes that benefit from metadata but don't require it (lazy loader)
        {
          element: <MetadataLazyLoader />,
          children: [
            {
              element: <StandardLayoutOutlet />,
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
                  path: 'reports/create',
                  element: <ReportBuilderPage />,
                },
                {
                  path: 'reports/create/:userReportId',
                  element: <ModifyReportPageRoute />,
                },
                {
                  path: 'account',
                  element: <div>Account settings page</div>,
                },
              ],
            },
          ],
        },
        // Catch-all 404 - outside AppShell, no metadata required
        {
          path: '*',
          element: <NotFoundPage />,
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
