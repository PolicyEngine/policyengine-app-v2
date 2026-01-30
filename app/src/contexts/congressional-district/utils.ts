/**
 * Utility functions for congressional district data processing
 */

import type { FetchState, StateDistrictData } from './types';

/** Prefix used for state region codes in the API */
const STATE_REGION_PREFIX = 'state/';

/**
 * Check if a region string represents a state-level report.
 * State regions have the format 'state/ca', 'state/dc', etc.
 *
 * @param region - The region string to check
 * @returns True if this is a state-level region
 */
export function isStateLevelRegion(region: string | undefined): boolean {
  if (!region) {
    return false;
  }
  return region.toLowerCase().startsWith(STATE_REGION_PREFIX);
}

/**
 * Extract the state code from a region string.
 * Strips the 'state/' prefix if present.
 *
 * @param region - The region string (e.g., 'state/ca' or 'ca')
 * @returns The state code (e.g., 'ca'), or null if region is falsy
 *
 * @example
 * extractStateCode('state/ca') // returns 'ca'
 * extractStateCode('state/dc') // returns 'dc'
 * extractStateCode('ca') // returns 'ca'
 * extractStateCode(undefined) // returns null
 */
export function extractStateCode(region: string | undefined): string | null {
  if (!region) {
    return null;
  }
  const regionLower = region.toLowerCase();
  return regionLower.startsWith(STATE_REGION_PREFIX)
    ? regionLower.slice(STATE_REGION_PREFIX.length)
    : regionLower;
}

/**
 * Get the list of state codes to fetch based on whether this is a
 * state-level or national report.
 *
 * @param isStateLevelReport - Whether this is a single-state report
 * @param region - The region string for state-level reports
 * @param allStateCodes - All available state codes for national reports
 * @returns Array of state codes to fetch
 */
export function getStateCodesToFetch(
  isStateLevelReport: boolean,
  region: string | undefined,
  allStateCodes: string[]
): string[] {
  if (isStateLevelReport && region) {
    return [region.toLowerCase()];
  }
  return allStateCodes;
}

/**
 * Calculate the total number of districts loaded across all completed states.
 *
 * @param stateResponses - Map of state code to district data
 * @returns Total count of districts
 */
export function calculateTotalDistrictsLoaded(
  stateResponses: Map<string, StateDistrictData>
): number {
  let count = 0;
  stateResponses.forEach((data) => {
    count += data.districts.length;
  });
  return count;
}

/**
 * Derive computed values from fetch state.
 *
 * @param state - The current fetch state
 * @returns Computed boolean values
 */
export function computeFetchStatus(state: FetchState): {
  completedCount: number;
  loadingCount: number;
  errorCount: number;
  isLoading: boolean;
  isComplete: boolean;
} {
  const completedCount = state.completedStates.size;
  const loadingCount = state.loadingStates.size;
  const errorCount = state.erroredStates.size;
  const isLoading = loadingCount > 0;
  const isComplete = state.hasStarted && loadingCount === 0;

  return {
    completedCount,
    loadingCount,
    errorCount,
    isLoading,
    isComplete,
  };
}

/**
 * Check if all expected states have loaded successfully.
 *
 * @param completedStates - Set of completed state codes
 * @param expectedCount - Expected number of states
 * @returns True if all states have completed
 */
export function validateAllStatesLoaded(
  completedStates: Set<string>,
  expectedCount: number
): boolean {
  return completedStates.size >= expectedCount;
}
