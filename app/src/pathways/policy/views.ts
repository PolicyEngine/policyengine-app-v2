import { ViewList } from '@/pathways/core/types';
import { PolicyState, PolicyViewKey } from './types';
import PolicyCreateFrame from './frames/PolicyCreateFrame';
import PolicyParameterFrame from './frames/PolicyParameterFrame';
import PolicySubmitFrame from './frames/PolicySubmitFrame';

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
    component: PolicyCreateFrame,
    layoutType: 'standard',
    canProceed: (state) => state.label.trim().length > 0,
  },

  'select-parameters': {
    key: 'select-parameters',
    component: PolicyParameterFrame,
    layoutType: 'custom', // This frame has its own AppShell with parameter tree
  },

  submit: {
    key: 'submit',
    component: PolicySubmitFrame,
    layoutType: 'standard',
  },
};
