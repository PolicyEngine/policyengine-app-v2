import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HouseholdCalcStrategy } from '@/libs/calculations/strategies/HouseholdCalcStrategy';
import { ProgressTracker } from '@/libs/calculations/ProgressTracker';
import { mockHouseholdCalcParams } from '@/tests/fixtures/types/calculationFixtures';
import {
  mockHouseholdSuccessResponse,
  createMockProgressTracker,
  STRATEGY_TEST_CONSTANTS,
} from '@/tests/fixtures/libs/calculations/strategyFixtures';

// Mock the household API
vi.mock('@/api/householdCalculation', () => ({
  fetchHouseholdCalculation: vi.fn(),
}));

describe('HouseholdCalcStrategy', () => {
  let strategy: HouseholdCalcStrategy;
  let mockProgressTracker: ReturnType<typeof createMockProgressTracker>;
  let mockFetchHouseholdCalculation: any;

  beforeEach(async () => {
    mockProgressTracker = createMockProgressTracker();
    strategy = new HouseholdCalcStrategy(mockProgressTracker as any);

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
      await strategy.execute(params);

      // Then
      expect(mockFetchHouseholdCalculation).toHaveBeenCalledWith(
        params.countryId,
        params.populationId,
        params.policyIds.baseline
      );
    });

    it('given new calculation then registers with progress tracker', async () => {
      // Given
      const params = mockHouseholdCalcParams();
      mockFetchHouseholdCalculation.mockResolvedValue(mockHouseholdSuccessResponse());

      // When
      await strategy.execute(params);

      // Then
      expect(mockProgressTracker.register).toHaveBeenCalled();
    });

    it('given new calculation then returns initial computing status', async () => {
      // Given
      const params = mockHouseholdCalcParams();
      mockFetchHouseholdCalculation.mockResolvedValue(mockHouseholdSuccessResponse());

      // When
      const result = await strategy.execute(params);

      // Then
      expect(result.status).toBe('computing');
      expect(result.progress).toBe(0);
      expect(result.message).toContain('Initializing');
      expect(result.estimatedTimeRemaining).toBe(STRATEGY_TEST_CONSTANTS.HOUSEHOLD_ESTIMATED_DURATION_MS);
    });

    it('given active calculation then returns progress from tracker', async () => {
      // Given
      const params = mockHouseholdCalcParams();
      mockProgressTracker.isActive.mockReturnValue(true);
      mockProgressTracker.getProgress.mockReturnValue({
        progress: 45,
        message: 'Running policy simulation...',
        estimatedTimeRemaining: STRATEGY_TEST_CONSTANTS.TEST_PROGRESS_TIME_MS,
      });

      // When
      const result = await strategy.execute(params);

      // Then
      expect(result.status).toBe('computing');
      expect(result.progress).toBe(45);
      expect(result.message).toBe('Running policy simulation...');
      expect(mockFetchHouseholdCalculation).not.toHaveBeenCalled();
    });

    it('given reform policy then uses it over baseline', async () => {
      // Given
      const params = mockHouseholdCalcParams({
        policyIds: { baseline: '1', reform: '2' },
      });
      mockFetchHouseholdCalculation.mockResolvedValue(mockHouseholdSuccessResponse());

      // When
      await strategy.execute(params);

      // Then
      expect(mockFetchHouseholdCalculation).toHaveBeenCalledWith(
        params.countryId,
        params.populationId,
        '2' // reform policy
      );
    });
  });

  describe('getRefetchConfig', () => {
    it('given config requested then returns 500ms refetch interval', () => {
      // When
      const config = strategy.getRefetchConfig();

      // Then
      expect(config.refetchInterval).toBe(STRATEGY_TEST_CONSTANTS.HOUSEHOLD_REFETCH_INTERVAL_MS);
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
    });
  });

  describe('getProgressTracker', () => {
    it('given strategy instance then returns progress tracker', () => {
      // When
      const tracker = strategy.getProgressTracker();

      // Then
      expect(tracker).toBe(mockProgressTracker);
    });
  });

  describe('constructor', () => {
    it('given no tracker then creates default tracker', () => {
      // When
      const strategyWithDefaultTracker = new HouseholdCalcStrategy();

      // Then
      const tracker = strategyWithDefaultTracker.getProgressTracker();
      expect(tracker).toBeInstanceOf(ProgressTracker);
    });
  });
});
