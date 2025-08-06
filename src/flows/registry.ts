import { PolicyViewFlow } from '@/flows/policyViewFlow';
import PolicyCreationFrame from '@/frames/PolicyCreationFrame';
import PolicyParameterSelectorFrame from '@/frames/PolicyParameterSelectorFrame';
import PolicySubmitFrame from '@/frames/PolicySubmitFrame';
import PoliciesPage from '@/pages/Policies.page';
import { PolicyCreationFlow } from './policyCreationFlow';
import SimulationCreationFrame from '@/frames/SimulationCreationFrame';
import SimulationSetupFrame from '@/frames/SimulationSetupFrame';
import SimulationSubmitFrame from '@/frames/SimulationSubmitFrame';
import SimulationsPage from '@/pages/Simulations.page';
import SimulationSetupPolicyFrame from '@/frames/SimulationSetupPolicyFrame';
import SimulationSelectExistingPolicyFrame from '@/frames/SimulationSelectExistingPolicyFrame';
import { SimulationCreationFlow } from './simulationCreationFlow';

export const componentRegistry = {
  PolicyCreationFrame,
  PolicyParameterSelectorFrame,
  PolicySubmitFrame,
  PolicyReadView: PoliciesPage,
  SimulationCreationFrame,
  SimulationSetupFrame,
  SimulationSubmitFrame,
  SimulationSetupPolicyFrame,
  SimulationSelectExistingPolicyFrame,
  SimulationReadView: SimulationsPage,
} as const;

export const flowRegistry = {
  PolicyCreationFlow,
  PolicyViewFlow,
  SimulationCreationFlow,
} as const;

export type ComponentKey = keyof typeof componentRegistry;
export type FlowKey = keyof typeof flowRegistry;
