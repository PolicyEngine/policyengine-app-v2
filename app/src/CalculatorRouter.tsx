/**
 * Router for the Calculator app (app.policyengine.org)
 * Contains only the interactive calculator functionality
 */
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import PathwayLayout from './components/PathwayLayout';
import StandardLayout from './components/StandardLayout';
import { CountryGuard } from './routing/guards/CountryGuard';
import { MetadataGuard } from './routing/guards/MetadataGuard';
import { MetadataLazyLoader } from './routing/guards/MetadataLazyLoader';
import { RedirectToCountry } from './routing/RedirectToCountry';

// Lazy-loaded pages
const DashboardPage = lazy(() => import('./pages/Dashboard.page'));
const PoliciesPage = lazy(() => import('./pages/Policies.page'));
const PopulationsPage = lazy(() => import('./pages/Populations.page'));
const ReportOutputPage = lazy(() => import('./pages/ReportOutput.page'));
const ReportsPage = lazy(() => import('./pages/Reports.page'));
const SimulationsPage = lazy(() => import('./pages/Simulations.page'));

// Lazy-loaded pathway wrappers
const PolicyPathwayWrapper = lazy(() => import('./pathways/policy/PolicyPathwayWrapper'));
const PopulationPathwayWrapper = lazy(
  () => import('./pathways/population/PopulationPathwayWrapper')
);
const ReportPathwayWrapper = lazy(() => import('./pathways/report/ReportPathwayWrapper'));
const SimulationPathwayWrapper = lazy(
  () => import('./pathways/simulation/SimulationPathwayWrapper')
);

/**
 * Layout wrapper that renders StandardLayout with Outlet for nested routes.
 * This allows the app shell (header, sidebar) to remain visible while
 * child guards like MetadataGuard show their loading states.
 * Suspense boundary catches lazy-loaded page components.
 */
function StandardLayoutOutlet() {
  return (
    <StandardLayout>
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </StandardLayout>
  );
}

/**
 * Suspense wrapper for pathway routes rendered inside PathwayLayout's Outlet.
 */
function SuspenseOutlet() {
  return (
    <Suspense fallback={null}>
      <Outlet />
    </Suspense>
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
        // Routes with standard layout that need metadata (blocking)
        // Layout is OUTSIDE the guard so app shell remains visible during loading
        {
          element: <StandardLayoutOutlet />,
          children: [
            {
              element: <MetadataGuard />,
              children: [
                {
                  path: 'report-output/:reportId/:subpage?/:view?',
                  element: <ReportOutputPage />,
                },
              ],
            },
          ],
        },
        // Pathway routes that need metadata (blocking)
        // Pathways manage their own AppShell layouts - do NOT wrap in StandardLayoutOutlet
        // This allows views like PolicyParameterSelectorView to use custom AppShell configurations
        {
          element: <MetadataGuard />,
          children: [
            {
              element: <PathwayLayout />,
              children: [
                {
                  element: <SuspenseOutlet />,
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
