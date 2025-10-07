import { beforeEach, describe, expect, test, vi } from 'vitest';
import * as householdApi from '@/api/householdCalculation';
import { HouseholdCalculationHandler } from '@/libs/calculations/handlers/household';
import {
  advanceTimeAndFlush,
  HOUSEHOLD_CALCULATION_META,
  HOUSEHOLD_ESTIMATED_DURATION,
  MOCK_HOUSEHOLD_RESULT,
  TEST_REPORT_ID,
} from '@/tests/fixtures/libs/calculations/handlerMocks';

// Mock the API
vi.mock('@/api/household_calculation');

describe('HouseholdCalculationHandler', () => {
  let handler: HouseholdCalculationHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    handler = new HouseholdCalculationHandler();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('execute', () => {
    test('given new calculation request then starts calculation and returns computing status', async () => {
      // Given
      vi.mocked(householdApi.fetchHouseholdCalculation).mockResolvedValue(MOCK_HOUSEHOLD_RESULT.householdData);

      // When
      const result = await handler.execute(TEST_REPORT_ID, HOUSEHOLD_CALCULATION_META);

      // Then
      expect(result).toEqual({
        status: 'computing',
        progress: 0,
        message: 'Initializing calculation...',
        estimatedTimeRemaining: HOUSEHOLD_ESTIMATED_DURATION,
      });
      expect(householdApi.fetchHouseholdCalculation).toHaveBeenCalledWith(
        HOUSEHOLD_CALCULATION_META.countryId,
        HOUSEHOLD_CALCULATION_META.populationId,
        HOUSEHOLD_CALCULATION_META.policyIds.reform
      );
    });

    test('given existing calculation then returns current status without new API call', async () => {
      // Given - start a calculation that won't resolve immediately
      vi.mocked(householdApi.fetchHouseholdCalculation).mockImplementation(
        () => new Promise(() => {}) // Never resolves to keep it computing
      );
      await handler.execute(TEST_REPORT_ID, HOUSEHOLD_CALCULATION_META);
      vi.clearAllMocks();

      // When - execute again with same reportId
      const result = await handler.execute(TEST_REPORT_ID, HOUSEHOLD_CALCULATION_META);

      // Then
      expect(householdApi.fetchHouseholdCalculation).not.toHaveBeenCalled();
      expect(result.status).toBe('computing');
      expect(result.progress).toBeGreaterThanOrEqual(0);
    });

    test('given completed calculation then returns ok status with result', async () => {
      // Given
      vi.mocked(householdApi.fetchHouseholdCalculation).mockResolvedValue(MOCK_HOUSEHOLD_RESULT.householdData);
      await handler.execute(TEST_REPORT_ID, HOUSEHOLD_CALCULATION_META);

      // Wait for completion
      await advanceTimeAndFlush(0);

      // When
      const result = await handler.execute(TEST_REPORT_ID, HOUSEHOLD_CALCULATION_META);

      // Then
      expect(result).toEqual({
        status: 'ok',
        result: MOCK_HOUSEHOLD_RESULT,
      });
    });

    test('given failed calculation then returns error status', async () => {
      // Given
      const error = new Error('API Error');
      vi.mocked(householdApi.fetchHouseholdCalculation).mockRejectedValue(error);
      await handler.execute(TEST_REPORT_ID, HOUSEHOLD_CALCULATION_META);

      // Wait for failure
      await advanceTimeAndFlush(0);

      // When
      const result = await handler.execute(TEST_REPORT_ID, HOUSEHOLD_CALCULATION_META);

      // Then
      expect(result).toEqual({
        status: 'error',
        error: 'API Error',
      });
    });

    test('given progress check during calculation then returns synthetic progress', async () => {
      // Given
      vi.mocked(householdApi.fetchHouseholdCalculation).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      await handler.execute(TEST_REPORT_ID, HOUSEHOLD_CALCULATION_META);

      // Advance time by 30 seconds (50% of estimated duration)
      await advanceTimeAndFlush(30000);

      // When
      const result = await handler.execute(TEST_REPORT_ID, HOUSEHOLD_CALCULATION_META);

      // Then
      expect(result.status).toBe('computing');
      expect(result.progress).toBeGreaterThan(40); // Should be around 50%
      expect(result.progress).toBeLessThan(60);
      expect(result.message).toBe('Running policy simulation...');
    });

    test('given calculation nearing completion then caps progress at 95%', async () => {
      // Given
      vi.mocked(householdApi.fetchHouseholdCalculation).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      await handler.execute(TEST_REPORT_ID, HOUSEHOLD_CALCULATION_META);

      // Advance time beyond estimated duration
      await advanceTimeAndFlush(HOUSEHOLD_ESTIMATED_DURATION + 10000);

      // When
      const result = await handler.execute(TEST_REPORT_ID, HOUSEHOLD_CALCULATION_META);

      // Then
      expect(result.status).toBe('computing');
      expect(result.progress).toBe(95); // Should be capped at 95%
    });
  });

  describe('getStatus', () => {
    test('given active calculation then returns current status', async () => {
      // Given
      vi.mocked(householdApi.fetchHouseholdCalculation).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      await handler.execute(TEST_REPORT_ID, HOUSEHOLD_CALCULATION_META);

      // When
      const status = handler.getStatus(TEST_REPORT_ID);

      // Then
      expect(status).toBeDefined();
      expect(status?.status).toBe('computing');
      expect(status?.progress).toBe(0);
    });

    test('given completed calculation then returns result', async () => {
      // Given
      vi.mocked(householdApi.fetchHouseholdCalculation).mockResolvedValue(MOCK_HOUSEHOLD_RESULT.householdData);
      await handler.execute(TEST_REPORT_ID, HOUSEHOLD_CALCULATION_META);
      await advanceTimeAndFlush(0);

      // When
      const status = handler.getStatus(TEST_REPORT_ID);

      // Then
      expect(status).toEqual({
        status: 'ok',
        result: MOCK_HOUSEHOLD_RESULT,
      });
    });

    test('given non-existent calculation then returns null', () => {
      // When
      const status = handler.getStatus('non-existent-id');

      // Then
      expect(status).toBeNull();
    });
  });

  describe('isActive', () => {
    test('given active calculation then returns true', async () => {
      // Given
      vi.mocked(householdApi.fetchHouseholdCalculation).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      await handler.execute(TEST_REPORT_ID, HOUSEHOLD_CALCULATION_META);

      // When
      const isActive = handler.isActive(TEST_REPORT_ID);

      // Then
      expect(isActive).toBe(true);
    });

    test('given completed calculation then returns true until cleanup', async () => {
      // Given
      vi.mocked(householdApi.fetchHouseholdCalculation).mockResolvedValue(MOCK_HOUSEHOLD_RESULT.householdData);
      await handler.execute(TEST_REPORT_ID, HOUSEHOLD_CALCULATION_META);
      await advanceTimeAndFlush(0);

      // When - immediately after completion
      const isActive = handler.isActive(TEST_REPORT_ID);

      // Then
      expect(isActive).toBe(true);
    });

    test('given completed calculation after cleanup then returns false', async () => {
      // Given
      vi.mocked(householdApi.fetchHouseholdCalculation).mockResolvedValue(MOCK_HOUSEHOLD_RESULT.householdData);
      await handler.execute(TEST_REPORT_ID, HOUSEHOLD_CALCULATION_META);
      await advanceTimeAndFlush(0);

      // Wait for cleanup (5 seconds)
      await advanceTimeAndFlush(5000);

      // When
      const isActive = handler.isActive(TEST_REPORT_ID);

      // Then
      expect(isActive).toBe(false);
    });

    test('given non-existent calculation then returns false', () => {
      // When
      const isActive = handler.isActive('non-existent-id');

      // Then
      expect(isActive).toBe(false);
    });
  });

  describe('progress messages', () => {
    test('given different progress levels then returns appropriate messages', async () => {
      // Test different progress levels
      const testCases = [
        { time: 0, expectedMessage: 'Initializing calculation...' },
        { time: 10000, expectedMessage: 'Loading household data...' },
        { time: 25000, expectedMessage: 'Running policy simulation...' },
        { time: 40000, expectedMessage: 'Calculating impacts...' },
        { time: 50000, expectedMessage: 'Finalizing results...' },
      ];

      for (const { time, expectedMessage } of testCases) {
        // Create a new handler for each test case to avoid state pollution
        const testHandler = new HouseholdCalculationHandler();

        // Given
        vi.mocked(householdApi.fetchHouseholdCalculation).mockImplementation(
          () => new Promise(() => {}) // Never resolves
        );

        // Start calculation
        await testHandler.execute(`report-${time}`, HOUSEHOLD_CALCULATION_META);

        // Advance to test time
        await advanceTimeAndFlush(time);

        // When
        const result = await testHandler.execute(`report-${time}`, HOUSEHOLD_CALCULATION_META);

        // Then
        expect(result.message).toBe(expectedMessage);
      }
    });
  });
});
