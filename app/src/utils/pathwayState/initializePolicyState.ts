import { PolicyStateProps } from '@/types/pathwayState';

/**
 * Creates an empty PolicyStateProps object with default values
 *
 * Used to initialize policy state in PathwayWrappers.
 * Matches the default state from policyReducer.ts but as a plain object.
 */
export function initializePolicyState(): PolicyStateProps {
  return {
    id: undefined,
    label: null,
    parameters: [],
  };
}
