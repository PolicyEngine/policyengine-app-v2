import { PolicyViewFlow } from '@/flows/policyViewFlow';
import PolicyCreationFrame from '@/frames/PolicyCreationFrame';
import PolicyParameterSelectorFrame from '@/frames/PolicyParameterSelectorFrame';
import PolicySubmitFrame from '@/frames/PolicySubmitFrame';
import HouseholdBuilderFrame from '@/frames/population/HouseholdBuilderFrame';
import SelectGeographicScopeFrame from '@/frames/population/SelectGeographicScopeFrame';
import SimulationCreationFrame from '@/frames/SimulationCreationFrame';
import SimulationSelectExistingPolicyFrame from '@/frames/SimulationSelectExistingPolicyFrame';
import SimulationSelectExistingPopulationFrame from '@/frames/SimulationSelectExistingPopulationFrame';
import SimulationSetupFrame from '@/frames/SimulationSetupFrame';
import SimulationSetupPolicyFrame from '@/frames/SimulationSetupPolicyFrame';
import SimulationSetupPopulationFrame from '@/frames/SimulationSetupPopulationFrame';
import SimulationSubmitFrame from '@/frames/SimulationSubmitFrame';
import PoliciesPage from '@/pages/Policies.page';
import PopulationsPage from '@/pages/Populations.page';
import SimulationsPage from '@/pages/Simulations.page';
import { PolicyCreationFlow } from './policyCreationFlow';
import { PopulationFlow } from './populationCreationFlow';
import { SimulationCreationFlow } from './simulationCreationFlow';
import { SimulationViewFlow } from './simulationViewFlow';

export const componentRegistry = {
  PolicyCreationFrame,
  PolicyParameterSelectorFrame,
  PolicySubmitFrame,
  PolicyReadView: PoliciesPage,
  SelectGeographicScopeFrame,
  HouseholdBuilderFrame,
  PopulationReadView: PopulationsPage,
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
  PopulationFlow,
  SimulationCreationFlow,
  SimulationViewFlow,
} as const;

export type ComponentKey = keyof typeof componentRegistry;
export type FlowKey = keyof typeof flowRegistry;
