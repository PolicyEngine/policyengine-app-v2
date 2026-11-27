import type { QueryFunctionContext, QueryKey } from '@tanstack/react-query';
import { CalcStrategyFactory } from '@/libs/calculations/strategies/CalcStrategyFactory';
import type { CalcExecutionStrategy } from '@/libs/calculations/strategies/types';
import { calculationKeys } from '@/libs/queryKeys';
import type { CalcMetadata, CalcParams, CalcStatus } from '@/types/calculation';

/**
 * The query's status from its last poll, which the strategy reads to
 * outlast a failed poll. None when the query function is called without
 * React Query's context, as for CalcOrchestrator's first request.
 */
function cachedStatus(context?: QueryFunctionContext): CalcStatus | undefined {
  return context?.client.getQueryData<CalcStatus>(context.queryKey);
}

/**
 * A run's metadata, or how to build it for each request from the query's
 * last status: a run still computing can keep its start time.
 */
type MetadataForRequest = CalcMetadata | ((cached: CalcStatus | undefined) => CalcMetadata);

/**
 * What every calculation query polls with: each poll gives the strategy the
 * query's last status, so a computing run outlasts failed polls and keeps
 * its highest progress, and polling goes on while the tab is hidden, so a
 * run is followed to its end.
 */
function pollingQuery<TQueryKey extends QueryKey>(
  queryKey: TQueryKey,
  strategy: CalcExecutionStrategy,
  params: CalcParams,
  metadata: MetadataForRequest
) {
  return {
    queryKey,
    queryFn: async (context?: QueryFunctionContext) => {
      const cached = cachedStatus(context);
      return strategy.execute(
        params,
        typeof metadata === 'function' ? metadata(cached) : metadata,
        cached
      );
    },
    refetchIntervalInBackground: true,
  };
}

/**
 * Query factory for calculations
 * Creates TanStack Query options for calculation queries
 */
export const calculationQueries = {
  /**
   * Create query options for a report calculation
   */
  forReport: (reportId: string, metadata: CalcMetadata, params: CalcParams) => {
    const strategy = CalcStrategyFactory.getStrategy(metadata.calcType);

    return {
      ...pollingQuery(calculationKeys.byReportId(reportId), strategy, params, metadata),
      ...strategy.getRefetchConfig(),
      meta: { calcMetadata: metadata },
    };
  },

  /**
   * Create query options for a simulation calculation
   */
  forSimulation: (simulationId: string, metadata: CalcMetadata, params: CalcParams) => {
    const strategy = CalcStrategyFactory.getStrategy(metadata.calcType);

    return {
      ...pollingQuery(calculationKeys.bySimulationId(simulationId), strategy, params, metadata),
      ...strategy.getRefetchConfig(),
      meta: { calcMetadata: metadata },
    };
  },

  /**
   * Query options for a society-wide economy run that has no saved report
   * to write to, such as a report's other budget-window years or a tracked
   * bill, under the caller's own query key. It polls as a report's run
   * does, every `pollIntervalMs` while the run is pending. `metadata` may
   * be a function, called when each request is sent with the query's last
   * status, so a run still computing keeps its start time.
   */
  forEconomyRun: <TQueryKey extends QueryKey>({
    queryKey,
    params,
    metadata,
    pollIntervalMs,
  }: {
    queryKey: TQueryKey;
    params: CalcParams;
    metadata: MetadataForRequest;
    pollIntervalMs: number;
  }) => ({
    ...pollingQuery(queryKey, CalcStrategyFactory.getStrategy('societyWide'), params, metadata),
    refetchInterval: (query: { state: { data?: CalcStatus } }) =>
      query.state.data?.status === 'pending' ? pollIntervalMs : false,
    // A finished run doesn't change; the server caches it.
    staleTime: Infinity,
  }),
};
