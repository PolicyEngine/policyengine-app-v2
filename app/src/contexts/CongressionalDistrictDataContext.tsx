import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { useSelector } from 'react-redux';
import {
  fetchSocietyWideCalculation,
  SocietyWideCalculationResponse,
} from '@/api/societyWideCalculation';
import {
  buildDistrictLabelLookup,
  DistrictLabelLookup,
} from '@/adapters/congressional-district/congressionalDistrictDataAdapter';
import type { RootState } from '@/store';
import type { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';
import type { USCongressionalDistrictBreakdown } from '@/types/metadata/ReportOutputSocietyWideByCongressionalDistrict';
import { getUSStates } from '@/utils/regionStrategies';

/** Polling interval in milliseconds */
const POLL_INTERVAL_MS = 1000;

/** Maximum polling attempts per state before giving up */
const MAX_POLL_ATTEMPTS = 300; // 5 minutes at 1 second intervals

/** Expected number of states (50 states + DC) */
const EXPECTED_STATE_COUNT = 51;

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
interface FetchState {
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

type FetchAction =
  | { type: 'START_FETCH'; stateCodes: string[] }
  | { type: 'STATE_COMPLETED'; stateCode: string; data: StateDistrictData | null }
  | { type: 'STATE_ERRORED'; stateCode: string }
  | { type: 'RESET' };

function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case 'START_FETCH': {
      const loadingStates = new Set(action.stateCodes);
      return {
        stateResponses: new Map(),
        completedStates: new Set(),
        loadingStates,
        erroredStates: new Set(),
        hasStarted: true,
      };
    }
    case 'STATE_COMPLETED': {
      const newStateResponses = new Map(state.stateResponses);
      if (action.data) {
        newStateResponses.set(action.stateCode, action.data);
      }
      const newLoadingStates = new Set(state.loadingStates);
      newLoadingStates.delete(action.stateCode);
      const newCompletedStates = new Set(state.completedStates);
      newCompletedStates.add(action.stateCode);
      return {
        ...state,
        stateResponses: newStateResponses,
        loadingStates: newLoadingStates,
        completedStates: newCompletedStates,
      };
    }
    case 'STATE_ERRORED': {
      const newLoadingStates = new Set(state.loadingStates);
      newLoadingStates.delete(action.stateCode);
      const newErroredStates = new Set(state.erroredStates);
      newErroredStates.add(action.stateCode);
      return {
        ...state,
        loadingStates: newLoadingStates,
        erroredStates: newErroredStates,
      };
    }
    case 'RESET': {
      return {
        stateResponses: new Map(),
        completedStates: new Set(),
        loadingStates: new Set(),
        erroredStates: new Set(),
        hasStarted: false,
      };
    }
    default:
      return state;
  }
}

const initialState: FetchState = {
  stateResponses: new Map(),
  completedStates: new Set(),
  loadingStates: new Set(),
  erroredStates: new Set(),
  hasStarted: false,
};

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

const CongressionalDistrictDataContext = createContext<CongressionalDistrictDataContextValue | null>(null);

interface CongressionalDistrictDataProviderProps {
  children: React.ReactNode;
  reformPolicyId: string;
  baselinePolicyId: string;
  year: string;
  /** Region/geography for the report. If a state code (e.g., 'ca'), only fetches that state. */
  region?: string;
}

/**
 * Provider that manages congressional district data fetching.
 *
 * For national reports: Fetches data from all 51 states in parallel on-demand.
 * For state-level reports: Fetches only that state's data automatically on mount.
 *
 * Stores the raw district data which can be used by multiple visualization components.
 */
export function CongressionalDistrictDataProvider({
  children,
  reformPolicyId,
  baselinePolicyId,
  year,
  region,
}: CongressionalDistrictDataProviderProps) {
  // Get regions from Redux metadata to extract US states
  const regions = useSelector((state: RootState) => state.metadata.economyOptions.region);

  // Extract all state codes from metadata (e.g., ['al', 'ak', 'az', ...])
  const allStateCodes = useMemo(() => {
    const states = getUSStates(regions);
    return states.map((s) => s.value);
  }, [regions]);

  // Determine if this is a state-level report (region starts with 'state/')
  // Region format is 'state/ca', 'state/dc', etc.
  const isStateLevelReport = useMemo(() => {
    if (!region) return false;
    return region.toLowerCase().startsWith('state/');
  }, [region]);

  // For state-level reports, only fetch that state; otherwise fetch all states
  const stateCodes = useMemo(() => {
    if (isStateLevelReport && region) {
      return [region.toLowerCase()];
    }
    return allStateCodes;
  }, [isStateLevelReport, region, allStateCodes]);

  // Build district label lookup from metadata (for display labels)
  const labelLookup = useMemo(() => buildDistrictLabelLookup(regions), [regions]);

  // Use reducer for atomic state updates
  const [state, dispatch] = useReducer(fetchReducer, initialState);

  // Track active polling to allow cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Poll a single state until it completes or errors
   */
  const pollState = useCallback(
    async (stateCode: string, signal: AbortSignal): Promise<void> => {
      let attempts = 0;

      while (attempts < MAX_POLL_ATTEMPTS) {
        if (signal.aborted) {
          return;
        }

        try {
          const response: SocietyWideCalculationResponse = await fetchSocietyWideCalculation(
            'us',
            reformPolicyId,
            baselinePolicyId,
            {
              region: stateCode,
              time_period: year,
            }
          );

          if (response.status === 'ok' && response.result) {
            // Calculation complete - extract district data
            const result = response.result as ReportOutputSocietyWideUS;
            const districtData = result.congressional_district_impact;

            const stateData: StateDistrictData | null = districtData?.districts
              ? { stateCode, districts: districtData.districts }
              : null;

            dispatch({ type: 'STATE_COMPLETED', stateCode, data: stateData });
            return;
          } else if (response.status === 'error') {
            console.error(
              `[CongressionalDistrictDataProvider] State ${stateCode} calculation failed:`,
              response.error
            );
            dispatch({ type: 'STATE_ERRORED', stateCode });
            return;
          }

          // status === 'computing' - wait and poll again
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        } catch (error) {
          console.error(
            `[CongressionalDistrictDataProvider] Failed to fetch state ${stateCode}:`,
            error
          );
          dispatch({ type: 'STATE_ERRORED', stateCode });
          return;
        }
      }

      // Max attempts reached
      console.error(
        `[CongressionalDistrictDataProvider] State ${stateCode} timed out after ${MAX_POLL_ATTEMPTS} attempts`
      );
      dispatch({ type: 'STATE_ERRORED', stateCode });
    },
    [reformPolicyId, baselinePolicyId, year]
  );

  /**
   * Start fetching congressional district data for all US states in parallel.
   * No-op if already started.
   */
  const startFetch = useCallback(() => {
    if (state.hasStarted) {
      return;
    }

    if (stateCodes.length === 0) {
      console.warn('[CongressionalDistrictDataProvider] No state codes available from metadata');
      return;
    }

    // Cancel any existing polling
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this fetch session
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Initialize state with all states as loading
    dispatch({ type: 'START_FETCH', stateCodes });

    // Fire all state polling in parallel
    stateCodes.forEach((stateCode) => {
      pollState(stateCode, abortController.signal);
    });
  }, [state.hasStarted, stateCodes, pollState]);

  // Auto-start fetching for state-level reports (single state, fast)
  useEffect(() => {
    if (isStateLevelReport && !state.hasStarted && stateCodes.length > 0) {
      startFetch();
    }
  }, [isStateLevelReport, state.hasStarted, stateCodes.length, startFetch]);

  // Computed values
  const completedCount = state.completedStates.size;
  const loadingCount = state.loadingStates.size;
  const errorCount = state.erroredStates.size;
  const isLoading = state.loadingStates.size > 0;
  const isComplete = state.hasStarted && state.loadingStates.size === 0;

  const totalDistrictsLoaded = useMemo(() => {
    let count = 0;
    state.stateResponses.forEach((data) => {
      count += data.districts.length;
    });
    return count;
  }, [state.stateResponses]);

  /**
   * Validate that all expected states have loaded successfully
   * (51 for national reports, 1 for state-level reports)
   */
  const validateAllLoaded = useCallback(() => {
    return state.completedStates.size >= stateCodes.length;
  }, [state.completedStates, stateCodes.length]);

  /**
   * Get list of all completed state codes
   */
  const getCompletedStates = useCallback(() => {
    return Array.from(state.completedStates);
  }, [state.completedStates]);

  /**
   * Get list of all loading state codes
   */
  const getLoadingStates = useCallback(() => {
    return Array.from(state.loadingStates);
  }, [state.loadingStates]);

  // Compute stateCode for state-level reports (stripped of 'state/' prefix)
  // e.g., 'state/dc' becomes 'dc', 'state/ca' becomes 'ca'
  const stateCodeValue = useMemo(() => {
    if (!isStateLevelReport || !region) return null;
    const regionLower = region.toLowerCase();
    return regionLower.startsWith('state/') ? regionLower.slice(6) : regionLower;
  }, [isStateLevelReport, region]);

  const contextValue = useMemo<CongressionalDistrictDataContextValue>(
    () => ({
      stateResponses: state.stateResponses,
      completedCount,
      loadingCount,
      totalDistrictsLoaded,
      totalStates: stateCodes.length,
      isComplete,
      isLoading,
      hasStarted: state.hasStarted,
      errorCount,
      labelLookup,
      isStateLevelReport,
      stateCode: stateCodeValue,
      startFetch,
      validateAllLoaded,
      getCompletedStates,
      getLoadingStates,
    }),
    [
      state.stateResponses,
      state.hasStarted,
      completedCount,
      loadingCount,
      totalDistrictsLoaded,
      stateCodes.length,
      isComplete,
      isLoading,
      errorCount,
      labelLookup,
      isStateLevelReport,
      stateCodeValue,
      startFetch,
      validateAllLoaded,
      getCompletedStates,
      getLoadingStates,
    ]
  );

  return (
    <CongressionalDistrictDataContext.Provider value={contextValue}>
      {children}
    </CongressionalDistrictDataContext.Provider>
  );
}

/**
 * Hook to access congressional district data context.
 * Must be used within a CongressionalDistrictDataProvider.
 */
export function useCongressionalDistrictData(): CongressionalDistrictDataContextValue {
  const context = useContext(CongressionalDistrictDataContext);
  if (!context) {
    throw new Error(
      'useCongressionalDistrictData must be used within a CongressionalDistrictDataProvider'
    );
  }
  return context;
}
