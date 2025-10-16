import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculationQueries } from '@/libs/queries/calculationQueries';
import { calculationKeys } from '@/libs/queryKeys';
import { mockEconomyCalcParams, mockCalcMetadata } from '@/tests/fixtures/types/calculationFixtures';
import { STRATEGY_TEST_CONSTANTS } from '@/tests/fixtures/libs/calculations/strategyFixtures';

// Mock the strategy factory
vi.mock('@/libs/calculations/strategies/CalcStrategyFactory', () => ({
  CalcStrategyFactory: {
    getStrategy: vi.fn(),
  },
}));

describe('calculationQueries', () => {
  let mockStrategy: any;

  beforeEach(async () => {
    const module = await import('@/libs/calculations/strategies/CalcStrategyFactory');
    const CalcStrategyFactory = module.CalcStrategyFactory;

    mockStrategy = {
      execute: vi.fn(),
      getRefetchConfig: vi.fn().mockReturnValue({
        refetchInterval: STRATEGY_TEST_CONSTANTS.ECONOMY_REFETCH_INTERVAL_MS,
        staleTime: Infinity,
      }),
    };

    CalcStrategyFactory.getStrategy = vi.fn().mockReturnValue(mockStrategy);
    vi.clearAllMocks();
  });

  describe('forReport', () => {
    it('given report params then returns correct query options', () => {
      // Given
      const reportId = 'report-123';
      const metadata = mockCalcMetadata({ calcType: 'economy' });
      const params = mockEconomyCalcParams();

      // When
      const result = calculationQueries.forReport(reportId, metadata, params);

      // Then
      expect(result.queryKey).toEqual(calculationKeys.byReportId(reportId));
      expect(result.refetchInterval).toBe(STRATEGY_TEST_CONSTANTS.ECONOMY_REFETCH_INTERVAL_MS);
      expect(result.staleTime).toBe(Infinity);
      expect(result.meta).toEqual({ calcMetadata: metadata });
    });

    it('given economy type then uses economy strategy', async () => {
      // Given
      const { CalcStrategyFactory } = await import('@/libs/calculations/strategies/CalcStrategyFactory');
      const reportId = 'report-123';
      const metadata = mockCalcMetadata({ calcType: 'economy' });
      const params = mockEconomyCalcParams();

      // When
      calculationQueries.forReport(reportId, metadata, params);

      // Then
      expect(CalcStrategyFactory.getStrategy).toHaveBeenCalledWith('economy');
    });

    it('given household type then uses household strategy', async () => {
      // Given
      const { CalcStrategyFactory } = await import('@/libs/calculations/strategies/CalcStrategyFactory');
      const reportId = 'report-123';
      const metadata = mockCalcMetadata({ calcType: 'household' });
      const params = mockEconomyCalcParams();

      // When
      calculationQueries.forReport(reportId, metadata, params);

      // Then
      expect(CalcStrategyFactory.getStrategy).toHaveBeenCalledWith('household');
    });

    it('given queryFn called then executes strategy', async () => {
      // Given
      const reportId = 'report-123';
      const metadata = mockCalcMetadata({ calcType: 'economy' });
      const params = mockEconomyCalcParams();
      const queryOptions = calculationQueries.forReport(reportId, metadata, params);

      // When
      await queryOptions.queryFn();

      // Then
      expect(mockStrategy.execute).toHaveBeenCalledWith(params);
    });
  });

  describe('forSimulation', () => {
    it('given simulation params then returns correct query options', () => {
      // Given
      const simulationId = 'sim-456';
      const metadata = mockCalcMetadata({ calcType: 'household', targetType: 'simulation' });
      const params = mockEconomyCalcParams();

      // When
      const result = calculationQueries.forSimulation(simulationId, metadata, params);

      // Then
      expect(result.queryKey).toEqual(calculationKeys.bySimulationId(simulationId));
      expect(result.refetchInterval).toBe(STRATEGY_TEST_CONSTANTS.ECONOMY_REFETCH_INTERVAL_MS);
      expect(result.staleTime).toBe(Infinity);
      expect(result.meta).toEqual({ calcMetadata: metadata });
    });

    it('given economy type then uses economy strategy', async () => {
      // Given
      const { CalcStrategyFactory } = await import('@/libs/calculations/strategies/CalcStrategyFactory');
      const simulationId = 'sim-456';
      const metadata = mockCalcMetadata({ calcType: 'economy', targetType: 'simulation' });
      const params = mockEconomyCalcParams();

      // When
      calculationQueries.forSimulation(simulationId, metadata, params);

      // Then
      expect(CalcStrategyFactory.getStrategy).toHaveBeenCalledWith('economy');
    });

    it('given queryFn called then executes strategy', async () => {
      // Given
      const simulationId = 'sim-456';
      const metadata = mockCalcMetadata({ calcType: 'household', targetType: 'simulation' });
      const params = mockEconomyCalcParams();
      const queryOptions = calculationQueries.forSimulation(simulationId, metadata, params);

      // When
      await queryOptions.queryFn();

      // Then
      expect(mockStrategy.execute).toHaveBeenCalledWith(params);
    });
  });
});
