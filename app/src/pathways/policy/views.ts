import { ViewList } from '@/pathways/core/types';
import { PolicyState, PolicyViewKey } from './types';
import PolicyCreateView from './views/PolicyCreateView';
import PolicyParameterView from './views/PolicyParameterView';
import PolicySubmitView from './views/PolicySubmitView';

/**
 * All views available in the policy pathway.
 *
 * These views are exported as individual, reusable units that can be:
 * - Used in the standard policy pathway (PolicyPathwayWrapper)
 * - Cherry-picked for custom pathways
 * - Spread into other pathway configurations
 *
 * Each view defines:
 * - The component to render
 * - What layout type it needs (standard vs custom)
 * - Optional validation before proceeding to next step
 */
export const POLICY_VIEWS: ViewList<PolicyViewKey, PolicyState> = {
  create: {
    key: 'create',
    component: PolicyCreateView,
    layoutType: 'standard',
    canProceed: (state) => state.label.trim().length > 0,
  },

  'select-parameters': {
    key: 'select-parameters',
    component: PolicyParameterView,
    layoutType: 'custom', // This view has its own AppShell with parameter tree
  },

  submit: {
    key: 'submit',
    component: PolicySubmitView,
    layoutType: 'standard',
  },
};
