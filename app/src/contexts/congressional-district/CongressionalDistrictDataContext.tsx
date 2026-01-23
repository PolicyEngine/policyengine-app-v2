/**
 * Congressional District Data Context
 *
 * Provides centralized management of congressional district data fetching.
 * For national reports: Fetches data from all 51 states in parallel on-demand.
 * For state-level reports: Fetches only that state's data automatically on mount.
 */

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
import { buildDistrictLabelLookup } from '@/adapters/congressional-district/congressionalDistrictDataAdapter';
import type { RootState } from '@/store';
import type { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';
import { getUSStates } from '@/utils/regionStrategies';

import type {
  StateDistrictData,
  CongressionalDistrictDataContextValue,
  CongressionalDistrictDataProviderProps,
} from './types';
import { POLL_INTERVAL_MS, MAX_POLL_ATTEMPTS } from './types';
import { fetchReducer, initialFetchState } from './reducer';
import {
  isStateLevelRegion,
  extractStateCode,
  getStateCodesToFetch,
  calculateTotalDistrictsLoaded,
  computeFetchStatus,
  validateAllStatesLoaded,
} from './utils';

const CongressionalDistrictDataContext =
  createContext<CongressionalDistrictDataContextValue | null>(null);

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

  // Extract all state codes from metadata (e.g., ['state/al', 'state/ak', ...])
  const allStateCodes = useMemo(() => {
    const states = getUSStates(regions);
    return states.map((s) => s.value);
  }, [regions]);

  // Determine if this is a state-level report
  const isStateLevelReport = useMemo(() => isStateLevelRegion(region), [region]);

  // Get the list of state codes to fetch
  const stateCodes = useMemo(
    () => getStateCodesToFetch(isStateLevelReport, region, allStateCodes),
    [isStateLevelReport, region, allStateCodes]
  );

  // Build district label lookup from metadata
  const labelLookup = useMemo(() => buildDistrictLabelLookup(regions), [regions]);

  // Use reducer for atomic state updates
  const [state, dispatch] = useReducer(fetchReducer, initialFetchState);

  // Track active polling to allow cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Poll a single state until it completes or errors
  const pollState = useCallback(
    async (stateCode: string, signal: AbortSignal): Promise<void> => {
      let attempts = 0;

      while (attempts < MAX_POLL_ATTEMPTS) {
        if (signal.aborted) return;

        try {
          const response: SocietyWideCalculationResponse = await fetchSocietyWideCalculation(
            'us',
            reformPolicyId,
            baselinePolicyId,
            { region: stateCode, time_period: year }
          );

          if (response.status === 'ok' && response.result) {
            const result = response.result as ReportOutputSocietyWideUS;
            const districtData = result.congressional_district_impact;

            const stateData: StateDistrictData | null = districtData?.districts
              ? { stateCode, districts: districtData.districts }
              : null;

            dispatch({ type: 'STATE_COMPLETED', stateCode, data: stateData });
            return;
          }

          if (response.status === 'error') {
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

  // Start fetching congressional district data for all states in parallel
  const startFetch = useCallback(() => {
    if (state.hasStarted) return;

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

  // Auto-start fetching for state-level reports
  useEffect(() => {
    if (isStateLevelReport && !state.hasStarted && stateCodes.length > 0) {
      startFetch();
    }
  }, [isStateLevelReport, state.hasStarted, stateCodes.length, startFetch]);

  // Compute derived values
  const { completedCount, loadingCount, errorCount, isLoading, isComplete } =
    computeFetchStatus(state);

  const totalDistrictsLoaded = useMemo(
    () => calculateTotalDistrictsLoaded(state.stateResponses),
    [state.stateResponses]
  );

  // Utility functions
  const validateAllLoaded = useCallback(
    () => validateAllStatesLoaded(state.completedStates, stateCodes.length),
    [state.completedStates, stateCodes.length]
  );

  const getCompletedStates = useCallback(
    () => Array.from(state.completedStates),
    [state.completedStates]
  );

  const getLoadingStates = useCallback(
    () => Array.from(state.loadingStates),
    [state.loadingStates]
  );

  // Extract state code for state-level reports
  const stateCodeValue = useMemo(
    () => (isStateLevelReport ? extractStateCode(region) : null),
    [isStateLevelReport, region]
  );

  // Build context value
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
 *
 * @throws Error if used outside of CongressionalDistrictDataProvider
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
