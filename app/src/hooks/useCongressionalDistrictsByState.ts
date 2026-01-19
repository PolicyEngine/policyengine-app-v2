import { useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  fetchSocietyWideCalculation,
  SocietyWideCalculationResponse,
} from '@/api/societyWideCalculation';
import {
  buildDistrictLabelLookup,
  transformDistrictData,
  DistrictLabelLookup,
} from '@/adapters/congressional-district/congressionalDistrictDataAdapter';
import type { ChoroplethDataPoint } from '@/components/visualization/USDistrictChoroplethMap';
import type { RootState } from '@/store';
import type { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';
import { getUSStates } from '@/utils/regionStrategies';

/** Polling interval in milliseconds */
const POLL_INTERVAL_MS = 1000;

/** Maximum polling attempts per state before giving up */
const MAX_POLL_ATTEMPTS = 300; // 5 minutes at 1 second intervals

/**
 * State for tracking parallel congressional district fetch progress
 */
export interface CongressionalDistrictFetchState {
  /** Accumulated district data points for the choropleth map */
  districts: ChoroplethDataPoint[];
  /** Number of states that have completed (success or error) */
  completedStates: number;
  /** Number of states currently computing */
  computingStates: number;
  /** Total number of states being fetched */
  totalStates: number;
  /** Whether fetching is currently in progress */
  isLoading: boolean;
  /** List of state codes that encountered errors */
  errors: string[];
}

interface UseCongressionalDistrictsByStateParams {
  reformPolicyId: string;
  baselinePolicyId: string;
  year: string;
  /** Which value field to extract: 'average_household_income_change' or 'relative_household_income_change' */
  valueField: 'average_household_income_change' | 'relative_household_income_change';
}

/**
 * Hook to fetch congressional district data by making parallel state-level API requests.
 *
 * Instead of relying on a single nationwide calculation with district breakdowns,
 * this hook fires 51 parallel requests (one per state + DC) and progressively
 * accumulates district data as each state completes.
 *
 * Each state request is polled until it returns status: 'ok' or 'error'.
 * Districts are added to the map as soon as each state's calculation completes.
 */
export function useCongressionalDistrictsByState({
  reformPolicyId,
  baselinePolicyId,
  year,
  valueField,
}: UseCongressionalDistrictsByStateParams) {
  // Get regions from Redux metadata to extract US states
  const regions = useSelector((state: RootState) => state.metadata.economyOptions.region);

  // Extract state codes from metadata (e.g., ['al', 'ak', 'az', ...])
  const stateCodes = useMemo(() => {
    const states = getUSStates(regions);
    return states.map((s) => s.value);
  }, [regions]);

  // Build district label lookup from metadata (for display labels)
  const labelLookup = useMemo(() => buildDistrictLabelLookup(regions), [regions]);

  // Track fetch state
  const [state, setState] = useState<CongressionalDistrictFetchState>({
    districts: [],
    completedStates: 0,
    computingStates: 0,
    totalStates: stateCodes.length,
    isLoading: false,
    errors: [],
  });

  // Track active polling to allow cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Process a successful state response and extract district data
   */
  const processStateResponse = useCallback(
    (response: SocietyWideCalculationResponse, labelLookupMap: DistrictLabelLookup) => {
      if (response.status !== 'ok' || !response.result) {
        return [];
      }

      const result = response.result as ReportOutputSocietyWideUS;
      if (!result.congressional_district_impact) {
        return [];
      }

      return transformDistrictData(result.congressional_district_impact, valueField, labelLookupMap);
    },
    [valueField]
  );

  /**
   * Poll a single state until it completes or errors
   */
  const pollState = useCallback(
    async (stateCode: string, signal: AbortSignal): Promise<void> => {
      let attempts = 0;

      // Mark state as computing
      setState((prev) => ({
        ...prev,
        computingStates: prev.computingStates + 1,
      }));

      while (attempts < MAX_POLL_ATTEMPTS) {
        if (signal.aborted) {
          // Polling was cancelled
          setState((prev) => ({
            ...prev,
            computingStates: Math.max(0, prev.computingStates - 1),
          }));
          return;
        }

        try {
          const response = await fetchSocietyWideCalculation('us', reformPolicyId, baselinePolicyId, {
            region: stateCode,
            time_period: year,
          });

          if (response.status === 'ok') {
            // Calculation complete - extract districts and update state
            const newDistricts = processStateResponse(response, labelLookup);

            setState((prev) => {
              const newCompletedStates = prev.completedStates + 1;
              const newComputingStates = Math.max(0, prev.computingStates - 1);
              return {
                ...prev,
                districts: [...prev.districts, ...newDistricts],
                completedStates: newCompletedStates,
                computingStates: newComputingStates,
                isLoading: newCompletedStates < prev.totalStates,
              };
            });
            return;
          } else if (response.status === 'error') {
            // Calculation failed
            console.error(
              `[useCongressionalDistrictsByState] State ${stateCode} calculation failed:`,
              response.error
            );

            setState((prev) => {
              const newCompletedStates = prev.completedStates + 1;
              const newComputingStates = Math.max(0, prev.computingStates - 1);
              return {
                ...prev,
                errors: [...prev.errors, stateCode],
                completedStates: newCompletedStates,
                computingStates: newComputingStates,
                isLoading: newCompletedStates < prev.totalStates,
              };
            });
            return;
          }

          // status === 'computing' - wait and poll again
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        } catch (error) {
          console.error(
            `[useCongressionalDistrictsByState] Failed to fetch state ${stateCode}:`,
            error
          );

          setState((prev) => {
            const newCompletedStates = prev.completedStates + 1;
            const newComputingStates = Math.max(0, prev.computingStates - 1);
            return {
              ...prev,
              errors: [...prev.errors, stateCode],
              completedStates: newCompletedStates,
              computingStates: newComputingStates,
              isLoading: newCompletedStates < prev.totalStates,
            };
          });
          return;
        }
      }

      // Max attempts reached
      console.error(
        `[useCongressionalDistrictsByState] State ${stateCode} timed out after ${MAX_POLL_ATTEMPTS} attempts`
      );

      setState((prev) => {
        const newCompletedStates = prev.completedStates + 1;
        const newComputingStates = Math.max(0, prev.computingStates - 1);
        return {
          ...prev,
          errors: [...prev.errors, stateCode],
          completedStates: newCompletedStates,
          computingStates: newComputingStates,
          isLoading: newCompletedStates < prev.totalStates,
        };
      });
    },
    [reformPolicyId, baselinePolicyId, year, labelLookup, processStateResponse]
  );

  /**
   * Fetch congressional district data for all US states in parallel.
   * Each state is polled independently until complete.
   * Results are accumulated progressively as each state completes.
   */
  const fetchAllStates = useCallback(async () => {
    if (stateCodes.length === 0) {
      console.warn('[useCongressionalDistrictsByState] No state codes available from metadata');
      return;
    }

    // Cancel any existing polling
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this fetch session
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Reset state and start loading
    setState({
      districts: [],
      completedStates: 0,
      computingStates: 0,
      totalStates: stateCodes.length,
      isLoading: true,
      errors: [],
    });

    // Fire all state polling in parallel
    // Each state polls independently until complete
    stateCodes.forEach((stateCode) => {
      pollState(stateCode, abortController.signal);
    });
  }, [stateCodes, pollState]);

  /**
   * Cancel all pending polling
   */
  const cancelFetch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isLoading: false,
      computingStates: 0,
    }));
  }, []);

  return {
    state,
    fetchAllStates,
    cancelFetch,
    /** Number of states available (should be 51 for US) */
    stateCount: stateCodes.length,
  };
}
