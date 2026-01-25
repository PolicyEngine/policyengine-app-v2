/**
 * Type definitions for Congressional District data fetching
 */

import type { DistrictLabelLookup } from '@/adapters/congressional-district/congressionalDistrictDataAdapter';
import type { USCongressionalDistrictBreakdown } from '@/types/metadata/ReportOutputSocietyWideByCongressionalDistrict';

/** Polling interval in milliseconds */
export const POLL_INTERVAL_MS = 1000;

/** Maximum polling attempts per state before giving up */
export const MAX_POLL_ATTEMPTS = 300; // 5 minutes at 1 second intervals

/**
 * Raw state response containing district data from the API
 */
export interface StateDistrictData {
  stateCode: string;
  districts: USCongressionalDistrictBreakdown['districts'];
}

/**
 * Internal state managed by reducer
 */
export interface FetchState {
  /** Map of state code to district data */
  stateResponses: Map<string, StateDistrictData>;
  /** Set of state codes that have completed loading successfully */
  completedStates: Set<string>;
  /** Set of state codes currently being polled */
  loadingStates: Set<string>;
  /** Set of state codes that errored */
  erroredStates: Set<string>;
  /** Whether fetch has been started */
  hasStarted: boolean;
}

/**
 * Actions for the fetch reducer
 */
export type FetchAction =
  | { type: 'START_FETCH'; stateCodes: string[] }
  | { type: 'STATE_COMPLETED'; stateCode: string; data: StateDistrictData | null }
  | { type: 'STATE_ERRORED'; stateCode: string }
  | { type: 'RESET' };

/**
 * Context value with state and utility functions
 */
export interface CongressionalDistrictDataContextValue {
  /** Map of state code to district data */
  stateResponses: Map<string, StateDistrictData>;
  /** Number of states that have completed successfully */
  completedCount: number;
  /** Number of states currently being polled */
  loadingCount: number;
  /** Total number of districts loaded across all completed states */
  totalDistrictsLoaded: number;
  /** Total number of states expected (51 for national, 1 for state-level) */
  totalStates: number;
  /** Whether all states have finished (completed or errored) */
  isComplete: boolean;
  /** Whether any states are still loading */
  isLoading: boolean;
  /** Whether fetch has been started */
  hasStarted: boolean;
  /** Number of states that errored */
  errorCount: number;
  /** Label lookup for district display names */
  labelLookup: DistrictLabelLookup;
  /** Whether this is a state-level report (single state) vs national */
  isStateLevelReport: boolean;
  /** The region code for state-level reports (e.g., 'ca', 'dc'), null for national */
  stateCode: string | null;
  /** Start fetching data (no-op if already started) */
  startFetch: () => void;
  /** Validate that all expected states have loaded successfully */
  validateAllLoaded: () => boolean;
  /** Get list of all completed state codes */
  getCompletedStates: () => string[];
  /** Get list of all loading state codes */
  getLoadingStates: () => string[];
}

/**
 * Props for the CongressionalDistrictDataProvider
 */
export interface CongressionalDistrictDataProviderProps {
  children: React.ReactNode;
  reformPolicyId: string;
  baselinePolicyId: string;
  year: string;
  /** Region/geography for the report. If a state code (e.g., 'state/ca'), only fetches that state. */
  region?: string;
}
