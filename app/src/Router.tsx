import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/Home.page';
import PoliciesPage from './pages/Policies.page';
import PopulationsPage from './pages/Populations.page';
import SimulationsPage from './pages/Simulations.page';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Navigate to="/us" replace />,
    },
    {
      path: '/:countryId',
      element: <Layout />,
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
