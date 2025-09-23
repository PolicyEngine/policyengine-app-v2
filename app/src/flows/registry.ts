import { PolicyViewFlow } from '@/flows/policyViewFlow';
import PolicyCreationFrame from '@/frames/policy/PolicyCreationFrame';
import PolicyParameterSelectorFrame from '@/frames/policy/PolicyParameterSelectorFrame';
import PolicySubmitFrame from '@/frames/policy/PolicySubmitFrame';
import GeographicConfirmationFrame from '@/frames/population/GeographicConfirmationFrame';
import HouseholdBuilderFrame from '@/frames/population/HouseholdBuilderFrame';
import SelectGeographicScopeFrame from '@/frames/population/SelectGeographicScopeFrame';
import SetPopulationLabelFrame from '@/frames/population/SetPopulationLabelFrame';
import ReportOutputFrame from '@/frames/report/ReportOutputFrame';
import ReportCreationFrame from '@/frames/report/ReportCreationFrame';
import ReportSelectExistingSimulationFrame from '@/frames/report/ReportSelectExistingSimulationFrame';
import ReportSelectSimulationFrame from '@/frames/report/ReportSelectSimulationFrame';
import ReportSetupFrame from '@/frames/report/ReportSetupFrame';
import ReportSubmitFrame from '@/frames/report/ReportSubmitFrame';
import SimulationCreationFrame from '@/frames/simulation/SimulationCreationFrame';
import SimulationSelectExistingPolicyFrame from '@/frames/simulation/SimulationSelectExistingPolicyFrame';
import SimulationSelectExistingPopulationFrame from '@/frames/simulation/SimulationSelectExistingPopulationFrame';
import SimulationSetupFrame from '@/frames/simulation/SimulationSetupFrame';
import SimulationSetupPolicyFrame from '@/frames/simulation/SimulationSetupPolicyFrame';
import SimulationSetupPopulationFrame from '@/frames/simulation/SimulationSetupPopulationFrame';
import SimulationSubmitFrame from '@/frames/simulation/SimulationSubmitFrame';
import PoliciesPage from '@/pages/Policies.page';
import PopulationsPage from '@/pages/Populations.page';
import ReportsPage from '@/pages/Reports.page';
import SimulationsPage from '@/pages/Simulations.page';
import { PolicyCreationFlow } from './policyCreationFlow';
import { PopulationCreationFlow } from './populationCreationFlow';
import { ReportCreationFlow } from './reportCreationFlow';
import { ReportViewFlow } from './reportViewFlow';
import { SimulationCreationFlow } from './simulationCreationFlow';
import { SimulationViewFlow } from './simulationViewFlow';

export const componentRegistry = {
  PolicyCreationFrame,
  PolicyParameterSelectorFrame,
  PolicySubmitFrame,
  PolicyReadView: PoliciesPage,
  SelectGeographicScopeFrame,
  SetPopulationLabelFrame,
  GeographicConfirmationFrame,
  HouseholdBuilderFrame,
  PopulationReadView: PopulationsPage,
  ReportOutputFrame,
  ReportCreationFrame,
  ReportSetupFrame,
  ReportSelectSimulationFrame,
  ReportSelectExistingSimulationFrame,
  ReportSubmitFrame,
  ReportReadView: ReportsPage,
  SimulationCreationFrame,
  SimulationSetupFrame,
  SimulationSubmitFrame,
  SimulationSetupPolicyFrame,
  SimulationSelectExistingPolicyFrame,
  SimulationReadView: SimulationsPage,
  SimulationSetupPopulationFrame,
  SimulationSelectExistingPopulationFrame,
} as const;

export const flowRegistry = {
  PolicyCreationFlow,
  PolicyViewFlow,
  PopulationCreationFlow,
  ReportCreationFlow,
  ReportViewFlow,
  SimulationCreationFlow,
  SimulationViewFlow,
} as const;

export type ComponentKey = keyof typeof componentRegistry;
export type FlowKey = keyof typeof flowRegistry;
