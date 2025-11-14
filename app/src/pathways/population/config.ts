import { PathwayConfig } from '@/pathways/core/types';
import { PopulationState, PopulationViewKey } from './types';

/**
 * Navigation configuration for the population pathway.
 *
 * This defines the flow between views with conditional branching:
 * 1. select-scope -> set-label (always)
 * 2. set-label -> build-household (if household type) OR confirm-geographic (if geography type)
 * 3. build-household -> completion (household path)
 * 4. confirm-geographic -> completion (geographic path)
 *
 * The branching logic is implemented via dynamic transitions based on state.type:
 * - If state.type is 'household', user selected household scope -> go to build-household
 * - If state.type is 'geography', user selected geographic scope -> go to confirm-geographic
 *
 * This config can be:
 * - Used as-is in PopulationPathwayWrapper
 * - Modified for conditional routing
 * - Merged with other pathway configs for composite flows
 */
export const POPULATION_PATHWAY_CONFIG: PathwayConfig<PopulationViewKey, PopulationState> = {
  initialView: 'select-scope',

  transitions: {
    'select-scope': {
      next: 'set-label',
    },

    'set-label': {
      // Dynamic transition based on population type
      next: (state: PopulationState): PopulationViewKey => {
        if (state.type === 'household') {
          return 'build-household';
        }
        // Default to geography if type is 'geography' or undefined
        return 'confirm-geographic';
      },
      back: 'select-scope',
    },

    'build-household': {
      back: 'set-label',
    },

    'confirm-geographic': {
      back: 'set-label',
    },
  },
};
