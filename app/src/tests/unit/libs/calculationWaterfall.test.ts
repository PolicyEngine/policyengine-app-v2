import { describe, test, expect, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { calculationQueries } from '@/libs/queryOptions/calculations';
import { fetchReportById } from '@/api/report';
import { fetchSimulationById } from '@/api/simulation';
import {
  CALCULATION_QUERY_TEST_REPORT_ID,
  CALCULATION_QUERY_TEST_COUNTRY_ID,
  HOUSEHOLD_REPORT,
  ECONOMY_REPORT,
  HOUSEHOLD_SIM_BASELINE,
  HOUSEHOLD_SIM_REFORM,
  ECONOMY_SIM_SUBNATIONAL,
  ECONOMY_SIM_NATIONAL,
  HOUSEHOLD_META_WITH_REFORM,
  ECONOMY_META_SUBNATIONAL,
  ECONOMY_META_NATIONAL,
  HOUSEHOLD_CALCULATION_RESULT,
  ECONOMY_CALCULATION_RESULT,
  COMPUTING_STATUS,
  OK_STATUS,
  createMockCalculationManager,
  CALCULATION_QUERY_ERRORS,
} from '@/tests/fixtures/libs/queryOptions/calculationMocks';

// Mock API functions
vi.mock('@/api/report');
vi.mock('@/api/simulation');
vi.mock('@/api/economy');
vi.mock('@/api/reportCalculations');

// Mock calculation manager
const mockManager = createMockCalculationManager();

vi.mock('@/libs/calculations', () => ({
  getCalculationManager: vi.fn(() => mockManager),
}));

describe('Calculation Waterfall Reconstruction', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Reset mock manager methods
    mockManager.startCalculation.mockReset();
    mockManager.fetchCalculation.mockReset();
    mockManager.startCalculation.mockResolvedValue(undefined);
  });

  describe('waterfall reconstruction when metadata is missing', () => {
    test('given no query client then throws error', async () => {
      // Given - no queryClient provided
      const queryOptions = calculationQueries.forReport(
        CALCULATION_QUERY_TEST_REPORT_ID,
        undefined,
        undefined,
        CALCULATION_QUERY_TEST_COUNTRY_ID
      );

      // When/Then
      await expect(queryOptions.queryFn()).rejects.toThrow(
        CALCULATION_QUERY_ERRORS.NO_QUERY_CLIENT
      );

      // Verify no API calls were made
      expect(fetchReportById).not.toHaveBeenCalled();
      expect(fetchSimulationById).not.toHaveBeenCalled();
      expect(mockManager.fetchCalculation).not.toHaveBeenCalled();
    });

    test('given no metadata and no cache when fetching then reconstructs from report and simulations', async () => {
      // Given
      (fetchReportById as any).mockResolvedValueOnce(HOUSEHOLD_REPORT);
      (fetchSimulationById as any).mockResolvedValueOnce(HOUSEHOLD_SIM_BASELINE);
      (fetchSimulationById as any).mockResolvedValueOnce(HOUSEHOLD_SIM_REFORM);
      mockManager.fetchCalculation.mockResolvedValueOnce(HOUSEHOLD_CALCULATION_RESULT);

      // When
      const queryOptions = calculationQueries.forReport(
        CALCULATION_QUERY_TEST_REPORT_ID,
        undefined,
        queryClient,
        CALCULATION_QUERY_TEST_COUNTRY_ID
      );
      const result = await queryOptions.queryFn();

      // Then
      expect(fetchReportById).toHaveBeenCalledWith(
        CALCULATION_QUERY_TEST_COUNTRY_ID,
        CALCULATION_QUERY_TEST_REPORT_ID
      );
      expect(fetchSimulationById).toHaveBeenCalledWith(
        CALCULATION_QUERY_TEST_COUNTRY_ID,
        HOUSEHOLD_REPORT.simulation_1_id
      );
      expect(fetchSimulationById).toHaveBeenCalledWith(
        CALCULATION_QUERY_TEST_COUNTRY_ID,
        HOUSEHOLD_REPORT.simulation_2_id
      );
      expect(mockManager.startCalculation).toHaveBeenCalledWith(
        CALCULATION_QUERY_TEST_REPORT_ID,
        HOUSEHOLD_META_WITH_REFORM
      );
      expect(mockManager.fetchCalculation).toHaveBeenCalledWith(HOUSEHOLD_META_WITH_REFORM);
      expect(result).toEqual(HOUSEHOLD_CALCULATION_RESULT);

      // Verify metadata was cached
      const cachedMeta = queryClient.getQueryData(['calculation-meta', CALCULATION_QUERY_TEST_REPORT_ID]);
      expect(cachedMeta).toEqual(HOUSEHOLD_META_WITH_REFORM);
    });

    test('given economy simulation then reconstructs with region for subnational', async () => {
      // Given
      (fetchReportById as any).mockResolvedValueOnce(ECONOMY_REPORT);
      (fetchSimulationById as any).mockResolvedValueOnce(ECONOMY_SIM_SUBNATIONAL);
      mockManager.fetchCalculation.mockResolvedValueOnce(ECONOMY_CALCULATION_RESULT);

      // When
      const queryOptions = calculationQueries.forReport(
        CALCULATION_QUERY_TEST_REPORT_ID,
        undefined,
        queryClient,
        CALCULATION_QUERY_TEST_COUNTRY_ID
      );
      const result = await queryOptions.queryFn();

      // Then
      expect(fetchReportById).toHaveBeenCalledWith(
        CALCULATION_QUERY_TEST_COUNTRY_ID,
        CALCULATION_QUERY_TEST_REPORT_ID
      );
      expect(fetchSimulationById).toHaveBeenCalledWith(
        CALCULATION_QUERY_TEST_COUNTRY_ID,
        ECONOMY_REPORT.simulation_1_id
      );
      expect(mockManager.startCalculation).toHaveBeenCalledWith(
        CALCULATION_QUERY_TEST_REPORT_ID,
        ECONOMY_META_SUBNATIONAL
      );
      expect(mockManager.fetchCalculation).toHaveBeenCalledWith(ECONOMY_META_SUBNATIONAL);
      expect(result).toEqual(ECONOMY_CALCULATION_RESULT);
    });

    test('given no country ID when attempting waterfall then throws error', async () => {
      // Given - no country ID provided
      const queryOptions = calculationQueries.forReport(
        CALCULATION_QUERY_TEST_REPORT_ID,
        undefined,
        queryClient,
        undefined
      );

      // When/Then
      await expect(queryOptions.queryFn()).rejects.toThrow(
        CALCULATION_QUERY_ERRORS.NO_COUNTRY_ID(CALCULATION_QUERY_TEST_REPORT_ID)
      );

      // Verify no API calls were made
      expect(fetchReportById).not.toHaveBeenCalled();
      expect(fetchSimulationById).not.toHaveBeenCalled();
      expect(mockManager.fetchCalculation).not.toHaveBeenCalled();
    });

    test('given waterfall fails then throws descriptive error', async () => {
      // Given
      const fetchError = new Error('Network error');
      (fetchReportById as any).mockRejectedValueOnce(fetchError);

      // When
      const queryOptions = calculationQueries.forReport(
        CALCULATION_QUERY_TEST_REPORT_ID,
        undefined,
        queryClient,
        CALCULATION_QUERY_TEST_COUNTRY_ID
      );

      // Then
      await expect(queryOptions.queryFn()).rejects.toThrow(
        CALCULATION_QUERY_ERRORS.WATERFALL_FAILED(
          CALCULATION_QUERY_TEST_REPORT_ID,
          'Error: Network error'
        )
      );
    });

    test('given national geography then region is undefined', async () => {
      // Given
      (fetchReportById as any).mockResolvedValueOnce(ECONOMY_REPORT);
      (fetchSimulationById as any).mockResolvedValueOnce(ECONOMY_SIM_NATIONAL);
      mockManager.fetchCalculation.mockResolvedValueOnce(ECONOMY_CALCULATION_RESULT);

      // When
      const queryOptions = calculationQueries.forReport(
        CALCULATION_QUERY_TEST_REPORT_ID,
        undefined,
        queryClient,
        CALCULATION_QUERY_TEST_COUNTRY_ID
      );
      await queryOptions.queryFn();

      // Then
      expect(mockManager.fetchCalculation).toHaveBeenCalledWith(ECONOMY_META_NATIONAL);
    });

    test('given parallel simulation fetches then both complete successfully', async () => {
      // Given
      (fetchReportById as any).mockResolvedValueOnce(HOUSEHOLD_REPORT);
      (fetchSimulationById as any)
        .mockImplementationOnce(() =>
          new Promise(resolve => setTimeout(() => resolve(HOUSEHOLD_SIM_BASELINE), 10))
        )
        .mockImplementationOnce(() =>
          new Promise(resolve => setTimeout(() => resolve(HOUSEHOLD_SIM_REFORM), 5))
        );
      mockManager.fetchCalculation.mockResolvedValueOnce(OK_STATUS);

      // When
      const queryOptions = calculationQueries.forReport(
        CALCULATION_QUERY_TEST_REPORT_ID,
        undefined,
        queryClient,
        CALCULATION_QUERY_TEST_COUNTRY_ID
      );
      await queryOptions.queryFn();

      // Then - verify both simulations were fetched
      expect(fetchSimulationById).toHaveBeenCalledTimes(2);
      expect(fetchSimulationById).toHaveBeenCalledWith(
        CALCULATION_QUERY_TEST_COUNTRY_ID,
        HOUSEHOLD_REPORT.simulation_1_id
      );
      expect(fetchSimulationById).toHaveBeenCalledWith(
        CALCULATION_QUERY_TEST_COUNTRY_ID,
        HOUSEHOLD_REPORT.simulation_2_id
      );
    });
  });

  describe('metadata caching and reuse', () => {
    test('given metadata exists in cache then skips waterfall', async () => {
      // Given
      queryClient.setQueryData(
        ['calculation-meta', CALCULATION_QUERY_TEST_REPORT_ID],
        HOUSEHOLD_META_WITH_REFORM
      );
      mockManager.fetchCalculation.mockResolvedValueOnce(HOUSEHOLD_CALCULATION_RESULT);

      // When
      const queryOptions = calculationQueries.forReport(
        CALCULATION_QUERY_TEST_REPORT_ID,
        undefined,
        queryClient,
        CALCULATION_QUERY_TEST_COUNTRY_ID
      );
      const result = await queryOptions.queryFn();

      // Then
      expect(fetchReportById).not.toHaveBeenCalled();
      expect(fetchSimulationById).not.toHaveBeenCalled();
      expect(mockManager.startCalculation).toHaveBeenCalledWith(
        CALCULATION_QUERY_TEST_REPORT_ID,
        HOUSEHOLD_META_WITH_REFORM
      );
      expect(mockManager.fetchCalculation).toHaveBeenCalledWith(HOUSEHOLD_META_WITH_REFORM);
      expect(result).toEqual(HOUSEHOLD_CALCULATION_RESULT);
    });

    test('given metadata provided directly then skips cache and waterfall', async () => {
      // Given
      mockManager.fetchCalculation.mockResolvedValueOnce(HOUSEHOLD_CALCULATION_RESULT);

      // When
      const queryOptions = calculationQueries.forReport(
        CALCULATION_QUERY_TEST_REPORT_ID,
        HOUSEHOLD_META_WITH_REFORM,
        queryClient,
        CALCULATION_QUERY_TEST_COUNTRY_ID
      );
      const result = await queryOptions.queryFn();

      // Then
      expect(fetchReportById).not.toHaveBeenCalled();
      expect(fetchSimulationById).not.toHaveBeenCalled();
      expect(mockManager.startCalculation).toHaveBeenCalledWith(
        CALCULATION_QUERY_TEST_REPORT_ID,
        HOUSEHOLD_META_WITH_REFORM
      );
      expect(mockManager.fetchCalculation).toHaveBeenCalledWith(HOUSEHOLD_META_WITH_REFORM);
      expect(result).toEqual(HOUSEHOLD_CALCULATION_RESULT);
    });
  });

  describe('refetchInterval behavior', () => {
    test('given computing status then returns 1000ms interval', () => {
      // Given
      const queryOptions = calculationQueries.forReport(
        CALCULATION_QUERY_TEST_REPORT_ID,
        undefined,
        queryClient,
        CALCULATION_QUERY_TEST_COUNTRY_ID
      );
      const mockQuery = {
        state: {
          data: COMPUTING_STATUS,
        },
      } as any;

      // When
      const interval = queryOptions.refetchInterval(mockQuery);

      // Then
      expect(interval).toBe(1000);
    });

    test('given ok status then returns false', () => {
      // Given
      const queryOptions = calculationQueries.forReport(
        CALCULATION_QUERY_TEST_REPORT_ID,
        undefined,
        queryClient,
        CALCULATION_QUERY_TEST_COUNTRY_ID
      );
      const mockQuery = {
        state: {
          data: ECONOMY_CALCULATION_RESULT,
        },
      } as any;

      // When
      const interval = queryOptions.refetchInterval(mockQuery);

      // Then
      expect(interval).toBe(false);
    });

    test('given household data without status then returns false', () => {
      // Given
      const queryOptions = calculationQueries.forReport(
        CALCULATION_QUERY_TEST_REPORT_ID,
        undefined,
        queryClient,
        CALCULATION_QUERY_TEST_COUNTRY_ID
      );
      const mockQuery = {
        state: {
          data: {
            household_id: 'household123',
            baseline_net_income: 50000,
            reform_net_income: 52000,
          },
        },
      } as any;

      // When
      const interval = queryOptions.refetchInterval(mockQuery);

      // Then
      expect(interval).toBe(false);
    });
  });
});