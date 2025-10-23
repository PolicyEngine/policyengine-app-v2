import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CalcStrategyFactory } from '@/libs/calculations/strategies/CalcStrategyFactory';
import { calculationQueries } from '@/libs/queries/calculationQueries';
import { calculationKeys } from '@/libs/queryKeys';
import {
  createMockStrategy,
  mockHouseholdMetadata,
  mockHouseholdParams,
  mockSocietyWideMetadata,
  mockSocietyWideParams,
  TEST_CALC_IDS,
} from '@/tests/fixtures/libs/queries/calculationQueriesMocks';

// Mock the strategy factory
vi.mock('@/libs/calculations/strategies/CalcStrategyFactory');

describe('calculationQueries', () => {
  let mockStrategy: ReturnType<typeof createMockStrategy>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStrategy = createMockStrategy();
    (CalcStrategyFactory.getStrategy as any).mockReturnValue(mockStrategy);
  });

  describe('forReport', () => {
    it('given report metadata then creates query options', () => {
      // Given
      const metadata = mockSocietyWideMetadata();
      const params = mockSocietyWideParams();

      // When
      const queryOptions = calculationQueries.forReport(TEST_CALC_IDS.REPORT_123, metadata, params);

      // Then
      expect(CalcStrategyFactory.getStrategy).toHaveBeenCalledWith('societyWide');
      expect(queryOptions.queryKey).toEqual(calculationKeys.byReportId(TEST_CALC_IDS.REPORT_123));
      expect(queryOptions.refetchInterval).toBe(2000);
      expect(queryOptions.meta).toEqual({ calcMetadata: metadata });
    });

    it('given household metadata then uses household strategy', () => {
      // Given
      const metadata = mockHouseholdMetadata(TEST_CALC_IDS.REPORT_456);
      const params = mockHouseholdParams(TEST_CALC_IDS.REPORT_456);

      mockStrategy = createMockStrategy(false);
      (CalcStrategyFactory.getStrategy as any).mockReturnValue(mockStrategy);

      // When
      const queryOptions = calculationQueries.forReport(TEST_CALC_IDS.REPORT_456, metadata, params);

      // Then
      expect(CalcStrategyFactory.getStrategy).toHaveBeenCalledWith('household');
      expect(queryOptions.refetchInterval).toBe(false);
    });

    it('given queryFn executed then calls strategy execute', async () => {
      // Given
      const metadata = mockSocietyWideMetadata();
      const params = mockSocietyWideParams();

      const queryOptions = calculationQueries.forReport(TEST_CALC_IDS.REPORT_123, metadata, params);

      // When
      const result = await queryOptions.queryFn();

      // Then
      expect(mockStrategy.execute).toHaveBeenCalledWith(params, metadata);
      expect(result).toEqual({
        status: 'complete',
        result: { data: 'test' },
      });
    });
  });

  describe('forSimulation', () => {
    it('given simulation metadata then creates query options', () => {
      // Given
      const metadata = mockHouseholdMetadata(TEST_CALC_IDS.SIM_123);
      const params = mockHouseholdParams(TEST_CALC_IDS.SIM_123);

      mockStrategy.getRefetchConfig.mockReturnValue({ refetchInterval: false });

      // When
      const queryOptions = calculationQueries.forSimulation(
        TEST_CALC_IDS.SIM_123,
        metadata,
        params
      );

      // Then
      expect(CalcStrategyFactory.getStrategy).toHaveBeenCalledWith('household');
      expect(queryOptions.queryKey).toEqual(calculationKeys.bySimulationId(TEST_CALC_IDS.SIM_123));
      expect(queryOptions.refetchInterval).toBe(false);
      expect(queryOptions.meta).toEqual({ calcMetadata: metadata });
    });

    it('given queryFn executed then calls strategy execute', async () => {
      // Given
      const metadata = mockHouseholdMetadata(TEST_CALC_IDS.SIM_456);
      const params = mockHouseholdParams(TEST_CALC_IDS.SIM_456);

      const queryOptions = calculationQueries.forSimulation(
        TEST_CALC_IDS.SIM_456,
        metadata,
        params
      );

      // When
      const result = await queryOptions.queryFn();

      // Then
      expect(mockStrategy.execute).toHaveBeenCalledWith(params, metadata);
      expect(result).toEqual({
        status: 'complete',
        result: { data: 'test' },
      });
    });
  });
});
