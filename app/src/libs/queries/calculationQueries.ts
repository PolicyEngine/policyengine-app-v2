import { CalcStrategyFactory } from '@/libs/calculations/strategies/CalcStrategyFactory';
import { calculationKeys } from '@/libs/queryKeys';
import type { CalcMetadata, CalcParams } from '@/types/calculation';

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
      queryFn: async () => {
        return strategy.execute(params, metadata);
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
      queryFn: async () => {
        return strategy.execute(params, metadata);
      },
      ...strategy.getRefetchConfig(),
      meta: { calcMetadata: metadata },
    };
  },
};
