import { describe, test, expect, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { calculationQueries } from '@/libs/queryOptions/calculations';
import { fetchReportById } from '@/api/report';
import { fetchSimulationById } from '@/api/simulation';
import { fetchCalculationWithMeta } from '@/api/reportCalculations';

// Mock API functions
vi.mock('@/api/report');
vi.mock('@/api/simulation');
vi.mock('@/api/reportCalculations');

describe('Calculation Waterfall Reconstruction', () => {
  let queryClient: QueryClient;
  const mockReportId = '123';
  const mockCountryId = 'us';

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  describe('waterfall reconstruction when metadata is missing', () => {
    test('given no metadata and no cache when fetching then reconstructs from report and simulations', async () => {
      // Given
      const mockReport = {
        id: 123,
        country_id: 'us',
        simulation_1_id: 'sim1',
        simulation_2_id: 'sim2',
        api_version: 'v1',
        status: 'complete',
        output: null,
      };

      const mockSim1 = {
        id: 1,
        country_id: 'us',
        population_type: 'household',
        population_id: 'household123',
        policy_id: 'policy1',
        api_version: 'v1',
      };

      const mockSim2 = {
        id: 2,
        country_id: 'us',
        population_type: 'household',
        population_id: 'household123',
        policy_id: 'policy2',
        api_version: 'v1',
      };

      const mockCalculationResult = {
        household_id: 'household123',
        baseline_net_income: 50000,
        reform_net_income: 52000,
      };

      (fetchReportById as any).mockResolvedValueOnce(mockReport);
      (fetchSimulationById as any).mockResolvedValueOnce(mockSim1);
      (fetchSimulationById as any).mockResolvedValueOnce(mockSim2);
      (fetchCalculationWithMeta as any).mockResolvedValueOnce(mockCalculationResult);

      // When
      const queryOptions = calculationQueries.forReport(mockReportId, undefined, queryClient, mockCountryId);
      const result = await queryOptions.queryFn();

      // Then
      expect(fetchReportById).toHaveBeenCalledWith('us', '123');
      expect(fetchSimulationById).toHaveBeenCalledWith('us', 'sim1');
      expect(fetchSimulationById).toHaveBeenCalledWith('us', 'sim2');
      expect(fetchCalculationWithMeta).toHaveBeenCalledWith({
        type: 'household',
        countryId: 'us',
        policyIds: {
          baseline: 'policy1',
          reform: 'policy2',
        },
        populationId: 'household123',
        region: undefined,
      });
      expect(result).toEqual(mockCalculationResult);

      // Verify metadata was cached
      const cachedMeta = queryClient.getQueryData(['calculation-meta', mockReportId]);
      expect(cachedMeta).toEqual({
        type: 'household',
        countryId: 'us',
        policyIds: {
          baseline: 'policy1',
          reform: 'policy2',
        },
        populationId: 'household123',
        region: undefined,
      });
    });

    test('given economy simulation then reconstructs with region for subnational', async () => {
      // Given
      const mockReport = {
        id: 123,
        country_id: 'us',
        simulation_1_id: 'sim1',
        simulation_2_id: null,
        api_version: 'v1',
        status: 'complete',
        output: null,
      };

      const mockSim1 = {
        id: 1,
        country_id: 'us',
        population_type: 'geography',
        population_id: 'ca', // California
        policy_id: 'policy1',
        api_version: 'v1',
      };

      const mockCalculationResult = {
        status: 'ok',
        result: { budget: { budgetary_impact: 1000000 } },
      };

      (fetchReportById as any).mockResolvedValueOnce(mockReport);
      (fetchSimulationById as any).mockResolvedValueOnce(mockSim1);
      (fetchCalculationWithMeta as any).mockResolvedValueOnce(mockCalculationResult);

      // When
      const queryOptions = calculationQueries.forReport(mockReportId, undefined, queryClient, mockCountryId);
      const result = await queryOptions.queryFn();

      // Then
      expect(fetchReportById).toHaveBeenCalledWith('us', '123');
      expect(fetchSimulationById).toHaveBeenCalledWith('us', 'sim1');
      expect(fetchCalculationWithMeta).toHaveBeenCalledWith({
        type: 'economy',
        countryId: 'us',
        policyIds: {
          baseline: 'policy1',
          reform: undefined,
        },
        populationId: 'ca',
        region: 'ca', // Subnational, so region is set
      });
      expect(result).toEqual(mockCalculationResult);
    });

    test('given no country ID when attempting waterfall then throws error', async () => {
      // Given - no country ID provided
      const queryOptions = calculationQueries.forReport(mockReportId, undefined, queryClient, undefined);

      // When/Then
      await expect(queryOptions.queryFn()).rejects.toThrow(
        `Country ID required for metadata reconstruction of report ${mockReportId}`
      );

      // Verify no API calls were made
      expect(fetchReportById).not.toHaveBeenCalled();
      expect(fetchSimulationById).not.toHaveBeenCalled();
      expect(fetchCalculationWithMeta).not.toHaveBeenCalled();
    });

    test('given waterfall fails then throws descriptive error', async () => {
      // Given
      const fetchError = new Error('Network error');
      (fetchReportById as any).mockRejectedValueOnce(fetchError);

      // When
      const queryOptions = calculationQueries.forReport(mockReportId, undefined, queryClient, mockCountryId);

      // Then
      await expect(queryOptions.queryFn()).rejects.toThrow(
        `Failed to reconstruct metadata for report ${mockReportId}: Error: Network error`
      );
    });

    test('given national geography then region is undefined', async () => {
      // Given
      const mockReport = {
        id: 123,
        country_id: 'us',
        simulation_1_id: 'sim1',
        simulation_2_id: null,
        api_version: 'v1',
        status: 'complete',
        output: null,
      };

      const mockSim1 = {
        id: 1,
        country_id: 'us',
        population_type: 'geography',
        population_id: 'us', // National
        policy_id: 'policy1',
        api_version: 'v1',
      };

      const mockCalculationResult = {
        status: 'ok',
        result: { budget: { budgetary_impact: 1000000 } },
      };

      (fetchReportById as any).mockResolvedValueOnce(mockReport);
      (fetchSimulationById as any).mockResolvedValueOnce(mockSim1);
      (fetchCalculationWithMeta as any).mockResolvedValueOnce(mockCalculationResult);

      // When
      const queryOptions = calculationQueries.forReport(mockReportId, undefined, queryClient, mockCountryId);
      await queryOptions.queryFn();

      // Then
      expect(fetchCalculationWithMeta).toHaveBeenCalledWith({
        type: 'economy',
        countryId: 'us',
        policyIds: {
          baseline: 'policy1',
          reform: undefined,
        },
        populationId: 'us',
        region: undefined, // National, so no region
      });
    });

    test('given parallel simulation fetches then both complete successfully', async () => {
      // Given
      const mockReport = {
        id: 123,
        country_id: 'us',
        simulation_1_id: 'sim1',
        simulation_2_id: 'sim2',
        api_version: 'v1',
        status: 'complete',
        output: null,
      };

      const mockSim1 = {
        id: 1,
        country_id: 'us',
        population_type: 'household',
        population_id: 'household123',
        policy_id: 'policy1',
        api_version: 'v1',
      };

      const mockSim2 = {
        id: 2,
        country_id: 'us',
        population_type: 'household',
        population_id: 'household123',
        policy_id: 'policy2',
        api_version: 'v1',
      };

      // Simulate parallel fetching with delays
      (fetchReportById as any).mockResolvedValueOnce(mockReport);
      (fetchSimulationById as any)
        .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve(mockSim1), 10)))
        .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve(mockSim2), 5)));
      (fetchCalculationWithMeta as any).mockResolvedValueOnce({});

      // When
      const queryOptions = calculationQueries.forReport(mockReportId, undefined, queryClient, mockCountryId);
      await queryOptions.queryFn();

      // Then - verify both simulations were fetched
      expect(fetchSimulationById).toHaveBeenCalledTimes(2);
      expect(fetchSimulationById).toHaveBeenCalledWith('us', 'sim1');
      expect(fetchSimulationById).toHaveBeenCalledWith('us', 'sim2');
    });
  });

  describe('metadata caching and reuse', () => {
    test('given metadata exists in cache then skips waterfall', async () => {
      // Given
      const cachedMeta = {
        type: 'household' as const,
        countryId: 'us' as any,
        policyIds: {
          baseline: 'policy1',
          reform: 'policy2',
        },
        populationId: 'household123',
        region: undefined,
      };
      queryClient.setQueryData(['calculation-meta', mockReportId], cachedMeta);

      const mockCalculationResult = {
        household_id: 'household123',
        baseline_net_income: 50000,
        reform_net_income: 52000,
      };
      (fetchCalculationWithMeta as any).mockResolvedValueOnce(mockCalculationResult);

      // When
      const queryOptions = calculationQueries.forReport(mockReportId, undefined, queryClient, mockCountryId);
      const result = await queryOptions.queryFn();

      // Then
      expect(fetchReportById).not.toHaveBeenCalled();
      expect(fetchSimulationById).not.toHaveBeenCalled();
      expect(fetchCalculationWithMeta).toHaveBeenCalledWith(cachedMeta);
      expect(result).toEqual(mockCalculationResult);
    });

    test('given metadata provided directly then skips cache and waterfall', async () => {
      // Given
      const providedMeta = {
        type: 'household' as const,
        countryId: 'us' as any,
        policyIds: {
          baseline: 'policy1',
          reform: 'policy2',
        },
        populationId: 'household123',
        region: undefined,
      };

      const mockCalculationResult = {
        household_id: 'household123',
        baseline_net_income: 50000,
        reform_net_income: 52000,
      };
      (fetchCalculationWithMeta as any).mockResolvedValueOnce(mockCalculationResult);

      // When
      const queryOptions = calculationQueries.forReport(mockReportId, providedMeta, queryClient, mockCountryId);
      const result = await queryOptions.queryFn();

      // Then
      expect(fetchReportById).not.toHaveBeenCalled();
      expect(fetchSimulationById).not.toHaveBeenCalled();
      expect(fetchCalculationWithMeta).toHaveBeenCalledWith(providedMeta);
      expect(result).toEqual(mockCalculationResult);
    });
  });

  describe('refetchInterval behavior', () => {
    test('given computing status then returns 1000ms interval', () => {
      // Given
      const queryOptions = calculationQueries.forReport(mockReportId, undefined, queryClient, mockCountryId);
      const mockQuery = {
        state: {
          data: {
            status: 'computing',
            result: null,
          },
        },
      } as any;

      // When
      const interval = queryOptions.refetchInterval(mockQuery);

      // Then
      expect(interval).toBe(1000);
    });

    test('given ok status then returns false', () => {
      // Given
      const queryOptions = calculationQueries.forReport(mockReportId, undefined, queryClient, mockCountryId);
      const mockQuery = {
        state: {
          data: {
            status: 'ok',
            result: { budget: { budgetary_impact: 1000000 } },
          },
        },
      } as any;

      // When
      const interval = queryOptions.refetchInterval(mockQuery);

      // Then
      expect(interval).toBe(false);
    });

    test('given household data without status then returns false', () => {
      // Given
      const queryOptions = calculationQueries.forReport(mockReportId, undefined, queryClient, mockCountryId);
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