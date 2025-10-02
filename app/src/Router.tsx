import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import ReportOutputFrame from './frames/report/ReportOutputFrame';
import DatasetsPage from './pages/Datasets.page';
import DatasetDetailPage from './pages/DatasetDetail.page';
import DynamicsPage from './pages/Dynamics.page';
import DynamicDetailPage from './pages/DynamicDetail.page';
import HomePage from './pages/Home.page';
import PoliciesPage from './pages/Policies.page';
import PolicyDetailPage from './pages/PolicyDetail.page';
import ReportsPage from './pages/Reports.page';
import ReportEditorPage from './pages/ReportEditor.page';
import SimulationsPage from './pages/Simulations.page';
import SimulationDetailPage from './pages/SimulationDetail.page';
import UserDetailPage from './pages/UserDetail.page';
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
          path: 'policy/:policyId',
          element: <PolicyDetailPage />,
        },
        {
          path: 'dynamics',
          element: <DynamicsPage />,
        },
        {
          path: 'dynamic/:dynamicId',
          element: <DynamicDetailPage />,
        },
        {
          path: 'datasets',
          element: <DatasetsPage />,
        },
        {
          path: 'dataset/:datasetId',
          element: <DatasetDetailPage />,
        },
        {
          path: 'simulations',
          element: <SimulationsPage />,
        },
        {
          path: 'simulation/:simulationId',
          element: <SimulationDetailPage />,
        },
        {
          path: 'reports',
          element: <ReportsPage />,
        },
        {
          path: 'report/:reportId',
          element: <ReportEditorPage />,
        },
        {
          path: 'reportOutput/:reportId',
          element: <ReportOutputFrame />,
        },
        {
          path: 'user/:userId',
          element: <UserDetailPage />,
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
