import PolicyCreationFrame from '@/frames/PolicyCreationFrame';
import PolicyParameterSelectorFrame from '@/frames/PolicyParameterSelectorFrame';
import { PolicyCreationFlow } from './policyCreationFlow';
import PoliciesPage from '@/pages/Policies.page';
import { PolicyViewFlow } from '@/flows/policyViewFlow';
import PolicySubmitFrame from '@/frames/PolicySubmitFrame';

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
