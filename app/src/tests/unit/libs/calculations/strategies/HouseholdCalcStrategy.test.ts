import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HouseholdCalcStrategy } from '@/libs/calculations/strategies/HouseholdCalcStrategy';
import { mockHouseholdSuccessResponse } from '@/tests/fixtures/libs/calculations/strategyFixtures';
import { mockHouseholdCalcParams } from '@/tests/fixtures/types/calculationFixtures';

// Mock the household API
vi.mock('@/api/householdCalculation', () => ({
  fetchHouseholdCalculation: vi.fn(),
}));

describe('HouseholdCalcStrategy', () => {
  let strategy: HouseholdCalcStrategy;
  let mockFetchHouseholdCalculation: any;

  beforeEach(async () => {
    strategy = new HouseholdCalcStrategy();

    const householdModule = await import('@/api/householdCalculation');
    mockFetchHouseholdCalculation = householdModule.fetchHouseholdCalculation as any;

    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('given valid params then calls API with correct parameters', async () => {
      // Given
      const params = mockHouseholdCalcParams();
      mockFetchHouseholdCalculation.mockResolvedValue(mockHouseholdSuccessResponse());

      // When
      await strategy.execute(params, {
        calcId: 'test',
        calcType: 'household',
        targetType: 'simulation',
        startedAt: Date.now(),
      });

      // Then
      expect(mockFetchHouseholdCalculation).toHaveBeenCalledWith(
        params.countryId,
        params.populationId,
        params.policyIds.baseline
      );
    });

    it('given successful API call then returns complete status with result', async () => {
      // Given
      const params = mockHouseholdCalcParams();
      const mockResult = mockHouseholdSuccessResponse();
      mockFetchHouseholdCalculation.mockResolvedValue(mockResult);

      // When
      const result = await strategy.execute(params, {
        calcId: 'test',
        calcType: 'household',
        targetType: 'simulation',
        startedAt: Date.now(),
      });

      // Then
      expect(result.status).toBe('complete');
      expect(result.result).toEqual(mockResult);
      expect(result.metadata.calcType).toBe('household');
      expect(result.metadata.targetType).toBe('simulation');
    });

    it('given API error then returns error status', async () => {
      // Given
      const params = mockHouseholdCalcParams();
      const mockError = new Error('API request failed');
      mockFetchHouseholdCalculation.mockRejectedValue(mockError);

      // When
      const result = await strategy.execute(params, {
        calcId: 'test',
        calcType: 'household',
        targetType: 'simulation',
        startedAt: Date.now(),
      });

      // Then
      expect(result.status).toBe('error');
      expect(result.error).toEqual({
        code: 'HOUSEHOLD_CALC_FAILED',
        message: 'API request failed',
        retryable: true,
      });
      expect(result.metadata.calcType).toBe('household');
    });

    it('given reform policy then uses it over baseline', async () => {
      // Given
      const params = mockHouseholdCalcParams({
        policyIds: { baseline: '1', reform: '2' },
      });
      mockFetchHouseholdCalculation.mockResolvedValue(mockHouseholdSuccessResponse());

      // When
      await strategy.execute(params, {
        calcId: 'test',
        calcType: 'household',
        targetType: 'simulation',
        startedAt: Date.now(),
      });

      // Then
      expect(mockFetchHouseholdCalculation).toHaveBeenCalledWith(
        params.countryId,
        params.populationId,
        '2' // reform policy
      );
    });

    it('given non-Error rejection then wraps in CalcError', async () => {
      // Given
      const params = mockHouseholdCalcParams();
      mockFetchHouseholdCalculation.mockRejectedValue('String error');

      // When
      const result = await strategy.execute(params, {
        calcId: 'test',
        calcType: 'household',
        targetType: 'simulation',
        startedAt: Date.now(),
      });

      // Then
      expect(result.status).toBe('error');
      expect(result.error).toEqual({
        code: 'HOUSEHOLD_CALC_FAILED',
        message: 'Household calculation failed',
        retryable: true,
      });
    });
  });

  describe('getRefetchConfig', () => {
    it('given config requested then returns no refetch with infinite stale time', () => {
      // When
      const config = strategy.getRefetchConfig();

      // Then
      expect(config.refetchInterval).toBe(false);
      expect(config.staleTime).toBe(Infinity);
    });
  });

  describe('transformResponse', () => {
    it('given household data then transforms to complete CalcStatus', () => {
      // Given
      const householdData = mockHouseholdSuccessResponse();

      // When
      const result = strategy.transformResponse(householdData);

      // Then
      expect(result.status).toBe('complete');
      expect(result.result).toEqual(householdData);
      expect(result.metadata.calcType).toBe('household');
      expect(result.metadata.targetType).toBe('simulation');
    });
  });
});
