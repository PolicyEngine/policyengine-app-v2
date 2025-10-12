import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/Home.page';
import PoliciesPage from './pages/Policies.page';
import PopulationsPage from './pages/Populations.page';
import ReportOutputPage from './pages/ReportOutput.page';
import ReportsPage from './pages/Reports.page';
import SimulationsPage from './pages/Simulations.page';
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
                  path: 'report-output/:reportId',
                  element: <ReportOutputPage />,
                  children: [
                    {
                      path: ':subpage',
                      element: <ReportOutputPage />,
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
              element: <Layout />,
              children: [
                {
                  index: true,
                  // TODO: Move HomePage out of Layout once actual static homepage is merged
                  // Currently HomePage has calculator navigation buttons so needs Layout
                  element: <HomePage />,
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
                  path: 'populations',
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
        // Static pages - no Layout wrapper needed, no metadata needed
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
  {
    basename: import.meta.env.BASE_URL,
  }
);

export function Router() {
  return <RouterProvider router={router} />;
}
