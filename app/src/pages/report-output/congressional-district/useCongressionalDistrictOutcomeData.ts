import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useSelector } from 'react-redux';
import { normalizeDistrictId } from '@/adapters/congressional-district/congressionalDistrictDataAdapter';
import {
  fetchSocietyWideCalculation,
  type SocietyWideReportOutput,
} from '@/api/societyWideCalculation';
import {
  MAX_POLL_ATTEMPTS,
  POLL_INTERVAL_MS,
  useCongressionalDistrictData,
} from '@/contexts/congressional-district';
import type { RootState } from '@/store';
import { getUSCongressionalDistricts } from '@/utils/regionStrategies';

const DISTRICT_FETCH_CONCURRENCY = 12;
const DISTRICT_PREFIX = 'congressional_district/';

export type CongressionalDistrictOutcomeMetric = 'winner' | 'loser';

export interface DistrictOutcomeShares {
  winnerPct: number;
  loserPct: number;
  noChangePct: number;
}

interface DistrictTarget {
  region: string;
  geoId: string;
  label: string;
}

interface OutcomeFetchState {
  responses: Map<string, DistrictOutcomeShares>;
  completed: Set<string>;
  loading: Set<string>;
  errored: Set<string>;
  hasStarted: boolean;
}

type OutcomeFetchAction =
  | { type: 'START'; targets: string[] }
  | { type: 'COMPLETE'; geoId: string; data: DistrictOutcomeShares }
  | { type: 'ERROR'; geoId: string };

function outcomeFetchReducer(
  state: OutcomeFetchState,
  action: OutcomeFetchAction
): OutcomeFetchState {
  switch (action.type) {
    case 'START':
      return {
        responses: state.responses,
        completed: state.completed,
        loading: new Set(action.targets),
        errored: state.errored,
        hasStarted: true,
      };
    case 'COMPLETE': {
      const responses = new Map(state.responses);
      responses.set(action.geoId, action.data);

      const completed = new Set(state.completed);
      completed.add(action.geoId);

      const loading = new Set(state.loading);
      loading.delete(action.geoId);

      const errored = new Set(state.errored);
      errored.delete(action.geoId);

      return {
        responses,
        completed,
        loading,
        errored,
        hasStarted: state.hasStarted,
      };
    }
    case 'ERROR': {
      const loading = new Set(state.loading);
      loading.delete(action.geoId);

      const errored = new Set(state.errored);
      errored.add(action.geoId);

      return {
        responses: state.responses,
        completed: state.completed,
        loading,
        errored,
        hasStarted: state.hasStarted,
      };
    }
    default:
      return state;
  }
}

const initialOutcomeFetchState: OutcomeFetchState = {
  responses: new Map(),
  completed: new Set(),
  loading: new Set(),
  errored: new Set(),
  hasStarted: false,
};

export function extractDistrictOutcomeShares(
  output: SocietyWideReportOutput
): DistrictOutcomeShares | null {
  if (!('intra_decile' in output)) {
    return null;
  }

  const all = output.intra_decile?.all;
  if (!all) {
    return null;
  }

  return {
    winnerPct: (all['Gain more than 5%'] ?? 0) + (all['Gain less than 5%'] ?? 0),
    loserPct: (all['Lose more than 5%'] ?? 0) + (all['Lose less than 5%'] ?? 0),
    noChangePct: all['No change'] ?? 0,
  };
}

export function getDistrictOutcomeValue(
  shares: DistrictOutcomeShares,
  metric: CongressionalDistrictOutcomeMetric
): number {
  return metric === 'winner' ? shares.winnerPct : shares.loserPct;
}

export function useCongressionalDistrictOutcomeData(
  metric: CongressionalDistrictOutcomeMetric,
  enabled: boolean
) {
  const { reformPolicyId, baselinePolicyId, year, stateCode } = useCongressionalDistrictData();
  const regions = useSelector((state: RootState) => state.metadata.economyOptions.region);
  const [state, dispatch] = useReducer(outcomeFetchReducer, initialOutcomeFetchState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const districtTargets = useMemo<DistrictTarget[]>(() => {
    return getUSCongressionalDistricts(regions)
      .filter((district) => {
        if (!stateCode) {
          return true;
        }
        return district.stateAbbreviation?.toLowerCase() === stateCode.toLowerCase();
      })
      .map((district) => {
        const rawDistrictId = district.value.replace(DISTRICT_PREFIX, '');
        return {
          region: district.value,
          geoId: normalizeDistrictId(rawDistrictId),
          label: district.label,
        };
      });
  }, [regions, stateCode]);

  const pollDistrict = useCallback(
    async (target: DistrictTarget, signal: AbortSignal): Promise<void> => {
      let attempts = 0;

      while (attempts < MAX_POLL_ATTEMPTS) {
        if (signal.aborted) {
          return;
        }

        try {
          const response = await fetchSocietyWideCalculation(
            'us',
            reformPolicyId,
            baselinePolicyId,
            {
              region: target.region,
              time_period: year,
            }
          );

          if (response.status === 'ok' && response.result) {
            const shares = extractDistrictOutcomeShares(response.result);
            if (!shares) {
              dispatch({ type: 'ERROR', geoId: target.geoId });
              return;
            }
            dispatch({ type: 'COMPLETE', geoId: target.geoId, data: shares });
            return;
          }

          if (response.status === 'error') {
            dispatch({ type: 'ERROR', geoId: target.geoId });
            return;
          }

          attempts++;
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        } catch {
          dispatch({ type: 'ERROR', geoId: target.geoId });
          return;
        }
      }

      dispatch({ type: 'ERROR', geoId: target.geoId });
    },
    [baselinePolicyId, reformPolicyId, year]
  );

  const startFetch = useCallback(() => {
    if (state.hasStarted || districtTargets.length === 0) {
      return;
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    dispatch({
      type: 'START',
      targets: districtTargets.map((target) => target.geoId),
    });

    let nextIndex = 0;

    const worker = async () => {
      while (!abortController.signal.aborted) {
        const target = districtTargets[nextIndex];
        nextIndex += 1;

        if (!target) {
          return;
        }

        await pollDistrict(target, abortController.signal);
      }
    };

    const workerCount = Math.min(DISTRICT_FETCH_CONCURRENCY, districtTargets.length);
    for (let i = 0; i < workerCount; i += 1) {
      void worker();
    }
  }, [districtTargets, pollDistrict, state.hasStarted]);

  useEffect(() => {
    if (enabled) {
      startFetch();
    }
  }, [enabled, startFetch]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const mapData = useMemo(() => {
    return districtTargets.flatMap((target) => {
      const shares = state.responses.get(target.geoId);
      if (!shares) {
        return [];
      }

      return [
        {
          geoId: target.geoId,
          label: target.label,
          value: getDistrictOutcomeValue(shares, metric),
        },
      ];
    });
  }, [districtTargets, metric, state.responses]);

  const completedCount = state.completed.size;
  const errorCount = state.errored.size;
  const processedCount = completedCount + errorCount;
  const totalDistricts = districtTargets.length;

  return {
    mapData,
    completedCount,
    errorCount,
    hasStarted: state.hasStarted,
    isLoading: state.loading.size > 0,
    processedCount,
    startFetch,
    totalDistricts,
  };
}
