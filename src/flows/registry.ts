import PolicyCreationFrame from '@/frames/PolicyCreationFrame';
import PolicyParameterSelectorFrame from '@/frames/PolicyParameterSelectorFrame';
import { PolicyCreationFlow } from './policyCreationFlow';

export const componentRegistry = {
  PolicyCreationFrame,
  PolicyParameterSelectorFrame,
} as const;

export const flowRegistry = {
  PolicyCreationFlow,
} as const;

export type ComponentKey = keyof typeof componentRegistry;
export type FlowKey = keyof typeof flowRegistry;
