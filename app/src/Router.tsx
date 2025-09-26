import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import ReportOutputFrame from './frames/report/ReportOutputFrame';
import DatasetsPage from './pages/Datasets.page';
import DynamicsPage from './pages/Dynamics.page';
import HomePage from './pages/Home.page';
import PoliciesPage from './pages/Policies.page';
import ReportsPage from './pages/Reports.page';
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
      // CountryGuard wraps Layout directly instead of using Outlet pattern.
      // This keeps the structure simple - guard is just a validation wrapper,
      // not a route layer. Avoids extra nesting in route config.
      element: (
        <CountryGuard>
          <Layout />
        </CountryGuard>
      ),
      children: [
        {
          index: true,
          element: <HomePage />,
        },
        {
          path: 'policies',
          element: <PoliciesPage />,
        },
        {
          path: 'dynamics',
          element: <DynamicsPage />,
        },
        {
          path: 'datasets',
          element: <DatasetsPage />,
        },
        {
          path: 'simulations',
          element: <SimulationsPage />,
        },
        {
          path: 'reports',
          element: <ReportsPage />,
        },
        {
          path: 'reportOutput/:reportId',
          element: <ReportOutputFrame />,
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
