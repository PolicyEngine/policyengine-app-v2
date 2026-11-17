import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CalcStrategyFactory } from '@/libs/calculations/strategies/CalcStrategyFactory';
import { calculationQueries } from '@/libs/queries/calculationQueries';
import { calculationKeys } from '@/libs/queryKeys';
import {
  cachedQueryOf,
  createMockStrategy,
  mockCachedComputingStatus,
  mockHouseholdMetadata,
  mockHouseholdParams,
  mockSocietyWideMetadata,
  mockSocietyWideParams,
  TEST_CALC_IDS,
  TEST_ECONOMY_RUN_POLL_INTERVAL_MS,
  TEST_ECONOMY_RUN_QUERY_KEY,
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

    it('given queryFn executed without a context then calls strategy execute with no cached status', async () => {
      // Given
      const metadata = mockSocietyWideMetadata();
      const params = mockSocietyWideParams();

      const queryOptions = calculationQueries.forReport(TEST_CALC_IDS.REPORT_123, metadata, params);

      // When
      const result = await queryOptions.queryFn();

      // Then
      expect(mockStrategy.execute).toHaveBeenCalledWith(params, metadata, undefined);
      expect(result).toEqual({
        status: 'complete',
        result: { data: 'test' },
      });
    });
    it('given a status in the cache then queryFn passes it to the strategy', async () => {
      // Given
      const queryClient = new QueryClient();
      const metadata = mockSocietyWideMetadata();
      const params = mockSocietyWideParams();
      const queryOptions = calculationQueries.forReport(TEST_CALC_IDS.REPORT_123, metadata, params);
      const cachedStatus = mockCachedComputingStatus(metadata);
      queryClient.setQueryData(queryOptions.queryKey, cachedStatus);

      // When
      // A poll refetches whatever the strategy's staleTime, as staleTime 0 makes fetchQuery do.
      await queryClient.fetchQuery({ ...queryOptions, staleTime: 0 });

      // Then
      expect(mockStrategy.execute).toHaveBeenCalledWith(params, metadata, cachedStatus);
    });

    it('given a report then its query keeps polling while the tab is hidden', () => {
      // When
      const queryOptions = calculationQueries.forReport(
        TEST_CALC_IDS.REPORT_123,
        mockSocietyWideMetadata(),
        mockSocietyWideParams()
      );

      // Then
      expect(queryOptions.refetchIntervalInBackground).toBe(true);
    });
  });

  describe('forEconomyRun', () => {
    const economyRunOptions = () =>
      calculationQueries.forEconomyRun({
        queryKey: TEST_ECONOMY_RUN_QUERY_KEY,
        metadata: mockSocietyWideMetadata(),
        params: mockSocietyWideParams(),
        pollIntervalMs: TEST_ECONOMY_RUN_POLL_INTERVAL_MS,
      });

    it('given an economy run then it is polled at its interval only while pending', () => {
      // When
      const queryOptions = economyRunOptions();

      // Then
      expect(CalcStrategyFactory.getStrategy).toHaveBeenCalledWith('societyWide');
      expect(queryOptions.queryKey).toEqual(TEST_ECONOMY_RUN_QUERY_KEY);
      expect(queryOptions.refetchInterval(cachedQueryOf({ status: 'pending' }))).toBe(
        TEST_ECONOMY_RUN_POLL_INTERVAL_MS
      );
      expect(queryOptions.refetchInterval(cachedQueryOf({ status: 'complete' }))).toBe(false);
      expect(queryOptions.refetchInterval(cachedQueryOf({ status: 'error' }))).toBe(false);
      expect(queryOptions.refetchInterval(cachedQueryOf(undefined))).toBe(false);
    });

    it('given an economy run then it keeps polling while the tab is hidden, and never goes stale', () => {
      // When
      const queryOptions = economyRunOptions();

      // Then
      expect(queryOptions.refetchIntervalInBackground).toBe(true);
      expect(queryOptions.staleTime).toBe(Infinity);
    });

    it('given a status in the cache then queryFn passes it to the strategy', async () => {
      // Given
      const queryClient = new QueryClient();
      const queryOptions = economyRunOptions();
      const cachedStatus = mockCachedComputingStatus(mockSocietyWideMetadata());
      queryClient.setQueryData(queryOptions.queryKey, cachedStatus);

      // When
      await queryClient.fetchQuery({ ...queryOptions, staleTime: 0 });

      // Then
      expect(mockStrategy.execute).toHaveBeenCalledWith(
        mockSocietyWideParams(),
        expect.objectContaining({ calcType: 'societyWide' }),
        cachedStatus
      );
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

    it('given queryFn executed without a context then calls strategy execute with no cached status', async () => {
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
      expect(mockStrategy.execute).toHaveBeenCalledWith(params, metadata, undefined);
      expect(result).toEqual({
        status: 'complete',
        result: { data: 'test' },
      });
    });

    it('given a status in the cache then queryFn passes it to the strategy', async () => {
      // Given
      const queryClient = new QueryClient();
      const metadata = mockHouseholdMetadata(TEST_CALC_IDS.SIM_456);
      const params = mockHouseholdParams(TEST_CALC_IDS.SIM_456);
      const queryOptions = calculationQueries.forSimulation(
        TEST_CALC_IDS.SIM_456,
        metadata,
        params
      );
      const cachedStatus = mockCachedComputingStatus(metadata);
      queryClient.setQueryData(queryOptions.queryKey, cachedStatus);

      // When
      // A poll refetches whatever the strategy's staleTime, as staleTime 0 makes fetchQuery do.
      await queryClient.fetchQuery({ ...queryOptions, staleTime: 0 });

      // Then
      expect(mockStrategy.execute).toHaveBeenCalledWith(params, metadata, cachedStatus);
    });
  });
});
