import { PolicyViewFlow } from '@/flows/policyViewFlow';
import PolicyCreationFrame from '@/frames/PolicyCreationFrame';
import PolicyParameterSelectorFrame from '@/frames/PolicyParameterSelectorFrame';
import PolicySubmitFrame from '@/frames/PolicySubmitFrame';
import HouseholdBuilderFrame from '@/frames/population/HouseholdBuilderFrame';
import SelectGeographicScopeFrame from '@/frames/population/SelectGeographicScopeFrame';
import PoliciesPage from '@/pages/Policies.page';
import { PolicyCreationFlow } from './policyCreationFlow';
import { PopulationFlow } from './populationCreationFlow';

export const componentRegistry = {
  PolicyCreationFrame,
  PolicyParameterSelectorFrame,
  PolicySubmitFrame,
  PolicyReadView: PoliciesPage,
  SelectGeographicScopeFrame,
  HouseholdBuilderFrame,
} as const;

export const flowRegistry = {
  PolicyCreationFlow,
  PolicyViewFlow,
  PopulationFlow,
} as const;

export type ComponentKey = keyof typeof componentRegistry;
export type FlowKey = keyof typeof flowRegistry;
