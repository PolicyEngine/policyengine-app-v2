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
// Old monolithic file preserved but not used - see ./pages/ReportBuilder.page.tsx
import ReportBuilderPage from './pages/reportBuilder/ReportBuilderPage';
import {
  PathwayVariationsHub,
  NumberedStepsVariant,
  GuidedFunnelVariant,
  TimelineVariant,
  ChecklistVariant,
  FocusedFlowVariant,
  ReportConfigVariant,
} from './pages/reportBuilder/pathwayVariations';
import ReportOutputPage from './pages/ReportOutput.page';
import ReportsPage from './pages/Reports.page';
import SimulationsPage from './pages/Simulations.page';
import PolicyPathwayWrapper from './pathways/policy/PolicyPathwayWrapper';
import PopulationPathwayWrapper from './pathways/population/PopulationPathwayWrapper';
import ReportPathwayWrapper from './pathways/report/ReportPathwayWrapper';
import SimulationPathwayWrapper from './pathways/simulation/SimulationPathwayWrapper';
import { CountryGuard } from './routing/guards/CountryGuard';
import { MetadataGuard } from './routing/guards/MetadataGuard';
import { MetadataLazyLoader } from './routing/guards/MetadataLazyLoader';
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
                  path: 'report-builder',
                  element: <ReportBuilderPage />,
                },
                {
                  path: 'report-builder/variants',
                  element: <PathwayVariationsHub />,
                },
                {
                  path: 'report-builder/variants/numbered-steps',
                  element: <NumberedStepsVariant />,
                },
                {
                  path: 'report-builder/variants/guided-funnel',
                  element: <GuidedFunnelVariant />,
                },
                {
                  path: 'report-builder/variants/timeline',
                  element: <TimelineVariant />,
                },
                {
                  path: 'report-builder/variants/checklist',
                  element: <ChecklistVariant />,
                },
                {
                  path: 'report-builder/variants/focused-flow',
                  element: <FocusedFlowVariant />,
                },
                {
                  path: 'report-builder/variants/report-config',
                  element: <ReportConfigVariant />,
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
