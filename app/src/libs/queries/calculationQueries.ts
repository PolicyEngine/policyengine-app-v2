import type { QueryFunctionContext } from '@tanstack/react-query';
import { CalcStrategyFactory } from '@/libs/calculations/strategies/CalcStrategyFactory';
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
      queryKey: calculationKeys.byReportId(reportId),
      queryFn: async (context?: QueryFunctionContext) => {
        return strategy.execute(params, metadata, cachedStatus(context));
      },
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
      queryKey: calculationKeys.bySimulationId(simulationId),
      queryFn: async (context?: QueryFunctionContext) => {
        return strategy.execute(params, metadata, cachedStatus(context));
      },
      ...strategy.getRefetchConfig(),
      meta: { calcMetadata: metadata },
    };
  },
};
