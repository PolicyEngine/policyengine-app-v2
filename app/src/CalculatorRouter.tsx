/**
 * Router for the Calculator app (app.policyengine.org)
 * Contains only the interactive calculator functionality
 */
import { lazy } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import PathwayLayout from './components/PathwayLayout';
import StandardLayout from './components/StandardLayout';
import DashboardPage from './pages/Dashboard.page';
import NotFoundPage from './pages/NotFound.page';
import { CountryGuard } from './routing/guards/CountryGuard';
import { MetadataGuard } from './routing/guards/MetadataGuard';
import { MetadataLazyLoader } from './routing/guards/MetadataLazyLoader';
import { RedirectToCountry } from './routing/RedirectToCountry';
import SuspenseOutlet from './routing/SuspenseOutlet';

// Lazy-loaded page components — only fetched when the route is visited
const PoliciesPage = lazy(() => import('./pages/Policies.page'));
const PopulationsPage = lazy(() => import('./pages/Populations.page'));
const ReportOutputPage = lazy(() => import('./pages/ReportOutput.page'));
const ReportsPage = lazy(() => import('./pages/Reports.page'));
const SimulationsPage = lazy(() => import('./pages/Simulations.page'));
const ReportBuilderPage = lazy(() => import('./pages/reportBuilder/ReportBuilderPage'));
const ModifyReportPage = lazy(() => import('./pages/reportBuilder/ModifyReportPage'));
const PolicyEditingConceptsPage = lazy(
  () => import('./pages/policyEditingConcepts/PolicyEditingConcepts.page')
);
const PolicyEditingConceptPage = lazy(
  () => import('./pages/policyEditingConcepts/PolicyEditingConceptPage')
);
const PlaygroundPage = lazy(() => import('./pages/playground/PlaygroundPage'));

// Lazy-loaded pathway wrappers — heavy components with their own sub-routes
const PolicyPathwayWrapper = lazy(() => import('./pathways/policy/PolicyPathwayWrapper'));
const PopulationPathwayWrapper = lazy(
  () => import('./pathways/population/PopulationPathwayWrapper')
);
const SimulationPathwayWrapper = lazy(
  () => import('./pathways/simulation/SimulationPathwayWrapper')
);

/**
 * Layout wrapper that renders StandardLayout with Outlet for nested routes.
 * This allows the app shell (header, sidebar) to remain visible while
 * child routes render their content.
 */
function StandardLayoutOutlet() {
  return (
    <StandardLayout>
      <SuspenseOutlet />
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
                  element: <ModifyReportPage />,
                },
                {
                  path: 'policy-editing-concepts',
                  element: <PolicyEditingConceptsPage />,
                },
                {
                  path: 'policy-editing-concepts/:conceptId',
                  element: <PolicyEditingConceptPage />,
                },
                {
                  path: 'playground',
                  element: <PlaygroundPage />,
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
