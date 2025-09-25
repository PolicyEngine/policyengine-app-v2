import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import ReportOutputFrame from './frames/report/ReportOutputFrame';
import HomePage from './pages/Home.page';
import PoliciesPage from './pages/Policies.page';
import PopulationsPage from './pages/Populations.page';
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
          path: 'reports',
          element: <div>Reports page</div>,
        },
        {
          path: 'reportOutput/:reportId',
          element: <ReportOutputFrame />,
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
          path: 'methodology',
          element: <div>Methodology page</div>,
        },
        {
          path: 'account',
          element: <div>Account settings page</div>,
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
