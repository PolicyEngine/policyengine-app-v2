import { PolicyViewFlow } from '@/flows/policyViewFlow';
import PolicyCreationFrame from '@/frames/PolicyCreationFrame';
import PolicyParameterSelectorFrame from '@/frames/PolicyParameterSelectorFrame';
import PolicySubmitFrame from '@/frames/PolicySubmitFrame';
import PoliciesPage from '@/pages/Policies.page';
import { PolicyCreationFlow } from './policyCreationFlow';

export const componentRegistry = {
  PolicyCreationFrame,
  PolicyParameterSelectorFrame,
  PolicySubmitFrame,
  PolicyReadView: PoliciesPage,
} as const;

export const flowRegistry = {
  PolicyCreationFlow,
  PolicyViewFlow,
} as const;

export type ComponentKey = keyof typeof componentRegistry;
export type FlowKey = keyof typeof flowRegistry;
