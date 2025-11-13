import { PathwayConfig } from '@/pathways/core/types';
import { PolicyViewKey } from './types';

/**
 * Navigation configuration for the policy pathway.
 *
 * This defines the flow between views:
 * 1. create -> select-parameters
 * 2. select-parameters -> submit (or back to create)
 * 3. submit -> completion (or back to select-parameters)
 *
 * This config can be:
 * - Used as-is in PolicyPathwayWrapper
 * - Modified for conditional routing (e.g., skip parameter selection)
 * - Merged with other pathway configs for composite flows
 */
export const POLICY_PATHWAY_CONFIG: PathwayConfig<PolicyViewKey> = {
  initialView: 'create',

  transitions: {
    create: {
      next: 'select-parameters',
    },

    'select-parameters': {
      next: 'submit',
      back: 'create',
    },

    submit: {
      back: 'select-parameters',
    },
  },
};
