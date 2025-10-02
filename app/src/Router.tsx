import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import ReportOutputFrame from './frames/report/ReportOutputFrame';
import HomePage from './pages/Home.page';
import PoliciesPage from './pages/Policies.page';
import PopulationsPage from './pages/Populations.page';
import ReportOutputPageDemo from './pages/ReportOutputDemo.page';
import SimulationsPage from './pages/Simulations.page';
import { CountryGuard } from './routing/guards/CountryGuard';

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
        // Calculator/app pages - wrapped in Layout for sidebar/header
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
              element: <div>Reports page</div>,
            },
            // Note: This is a temporary debug path for viewing report outputs
            {
              path: 'report-output/:reportId',
              element: <ReportOutputFrame />,
            },
            // Demo path for new ReportOutputPage component
            {
              path: 'report-output-demo',
              element: <ReportOutputPageDemo />,
            },
            {
              path: 'simulations',
              element: <SimulationsPage />,
            },
            {
              path: 'configurations',
              element: <div>Configurations page</div>,
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
        // Static pages - no Layout wrapper needed
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
