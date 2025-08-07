import { PolicyViewFlow } from '@/flows/policyViewFlow';
import PolicyCreationFrame from '@/frames/PolicyCreationFrame';
import PolicyParameterSelectorFrame from '@/frames/PolicyParameterSelectorFrame';
import PolicySubmitFrame from '@/frames/PolicySubmitFrame';
import SimulationCreationFrame from '@/frames/SimulationCreationFrame';
import SimulationSelectExistingPolicyFrame from '@/frames/SimulationSelectExistingPolicyFrame';
import SimulationSetupFrame from '@/frames/SimulationSetupFrame';
import SimulationSetupPolicyFrame from '@/frames/SimulationSetupPolicyFrame';
import SimulationSubmitFrame from '@/frames/SimulationSubmitFrame';
import PoliciesPage from '@/pages/Policies.page';
import SimulationsPage from '@/pages/Simulations.page';
import { PolicyCreationFlow } from './policyCreationFlow';
import { SimulationCreationFlow } from './simulationCreationFlow';
import { SimulationViewFlow } from './simulationViewFlow';

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
  SimulationViewFlow,
} as const;

export type ComponentKey = keyof typeof componentRegistry;
export type FlowKey = keyof typeof flowRegistry;
