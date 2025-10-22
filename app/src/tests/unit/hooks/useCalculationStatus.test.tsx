import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useCalculationStatus } from '@/hooks/useCalculationStatus';
import { calculationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';
import {
  createTestQueryClient,
  HOOK_TEST_CONSTANTS,
} from '@/tests/fixtures/hooks/calculationHookFixtures';
import {
  mockCalcStatusComputing,
  mockCalcStatusComplete,
  mockCalcStatusError,
} from '@/tests/fixtures/types/calculationFixtures';

// Mock the synthetic progress hook
vi.mock('@/hooks/useSyntheticProgress', () => ({
  useSyntheticProgress: vi.fn((isActive, calcType) => {
    if (!isActive) {
      return { progress: 0, message: '' };
    }
    return {
      progress: calcType === 'household' ? 45 : 12,
      message: calcType === 'household' ? 'Running policy simulation...' : 'Loading population data...',
    };
  }),
  getProgressMessage: vi.fn(),
  SYNTHETIC_PROGRESS_CONFIG: {
    HOUSEHOLD_DURATION_MS: 45000,
    SOCIETY_WIDE_DURATION_MS: 720000,
    UPDATE_INTERVAL_MS: 500,
    MAX_PROGRESS: 95,
    SERVER_WEIGHT: 0.7,
    SYNTHETIC_WEIGHT: 0.3,
  },
}));

describe('useCalculationStatus', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('cache-only reading', () => {
    test('given no data in cache then returns idle status', () => {
      // When
      const { result } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_REPORT_ID, 'report'),
        { wrapper }
      );

      // Then - returns initializing when no cache exists
      expect(result.current.status).toBe('initializing');
      expect(result.current.isInitializing).toBe(true);
      expect(result.current.isComplete).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    test('given computing data in cache then returns computing status', async () => {
      // Given
      const calcStatus = mockCalcStatusComputing({
        metadata: {
          calcId: HOOK_TEST_CONSTANTS.TEST_REPORT_ID,
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
      });
      queryClient.setQueryData<CalcStatus>(
        calculationKeys.byReportId(HOOK_TEST_CONSTANTS.TEST_REPORT_ID),
        calcStatus
      );

      // When
      const { result } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_REPORT_ID, 'report'),
        { wrapper }
      );

      // Then
      await waitFor(() => {
        expect(result.current.status).toBe('computing');
        expect(result.current.isPending).toBe(true);
        expect(result.current.isComplete).toBe(false);
        expect(result.current.isError).toBe(false);
        // Synthetic progress overrides server progress (mocked to return 12 for economy)
        expect(result.current.progress).toBe(12);
        expect(result.current.message).toBe('Loading population data...');
        // Server data still available
        expect(result.current.queuePosition).toBe(calcStatus.queuePosition);
        expect(result.current.estimatedTimeRemaining).toBe(calcStatus.estimatedTimeRemaining);
      });
    });

    test('given complete data in cache then returns complete status', async () => {
      // Given
      const calcStatus = mockCalcStatusComplete({
        metadata: {
          calcId: HOOK_TEST_CONSTANTS.TEST_REPORT_ID,
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
      });
      queryClient.setQueryData<CalcStatus>(
        calculationKeys.byReportId(HOOK_TEST_CONSTANTS.TEST_REPORT_ID),
        calcStatus
      );

      // When
      const { result } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_REPORT_ID, 'report'),
        { wrapper }
      );

      // Then
      await waitFor(() => {
        expect(result.current.status).toBe('complete');
        expect(result.current.isPending).toBe(false);
        expect(result.current.isComplete).toBe(true);
        expect(result.current.isError).toBe(false);
        expect(result.current.result).toEqual(calcStatus.result);
      });
    });

    test('given error data in cache then returns error status', async () => {
      // Given
      const calcStatus = mockCalcStatusError({
        metadata: {
          calcId: HOOK_TEST_CONSTANTS.TEST_REPORT_ID,
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
      });
      queryClient.setQueryData<CalcStatus>(
        calculationKeys.byReportId(HOOK_TEST_CONSTANTS.TEST_REPORT_ID),
        calcStatus
      );

      // When
      const { result } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_REPORT_ID, 'report'),
        { wrapper }
      );

      // Then
      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.isPending).toBe(false);
        expect(result.current.isComplete).toBe(false);
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toEqual(calcStatus.error);
      });
    });
  });

  describe('query key selection', () => {
    test('given report target then uses report query key', async () => {
      // Given
      const calcStatus = mockCalcStatusComplete({
        metadata: {
          calcId: HOOK_TEST_CONSTANTS.TEST_REPORT_ID,
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
      });
      queryClient.setQueryData<CalcStatus>(
        calculationKeys.byReportId(HOOK_TEST_CONSTANTS.TEST_REPORT_ID),
        calcStatus
      );

      // When
      const { result } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_REPORT_ID, 'report'),
        { wrapper }
      );

      // Then
      await waitFor(() => {
        expect(result.current.result).toEqual(calcStatus.result);
      });
    });

    test('given simulation target then uses simulation query key', async () => {
      // Given
      const calcStatus = mockCalcStatusComplete({
        metadata: {
          calcId: HOOK_TEST_CONSTANTS.TEST_SIMULATION_ID,
          calcType: 'household',
          targetType: 'simulation',
          startedAt: Date.now(),
        },
      });
      queryClient.setQueryData<CalcStatus>(
        calculationKeys.bySimulationId(HOOK_TEST_CONSTANTS.TEST_SIMULATION_ID),
        calcStatus
      );

      // When
      const { result } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_SIMULATION_ID, 'simulation'),
        { wrapper }
      );

      // Then
      await waitFor(() => {
        expect(result.current.result).toEqual(calcStatus.result);
      });
    });
  });

  describe('reactive updates', () => {
    test('given cache updated then hook reflects new status', async () => {
      // Given
      const computingStatus = mockCalcStatusComputing({
        metadata: {
          calcId: HOOK_TEST_CONSTANTS.TEST_REPORT_ID,
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
      });
      queryClient.setQueryData<CalcStatus>(
        calculationKeys.byReportId(HOOK_TEST_CONSTANTS.TEST_REPORT_ID),
        computingStatus
      );
      const { result } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_REPORT_ID, 'report'),
        { wrapper }
      );

      // Verify initial state
      await waitFor(() => {
        expect(result.current.status).toBe('computing');
      });

      // When - update cache to complete
      const completeStatus = mockCalcStatusComplete({
        metadata: {
          calcId: HOOK_TEST_CONSTANTS.TEST_REPORT_ID,
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
      });
      queryClient.setQueryData<CalcStatus>(
        calculationKeys.byReportId(HOOK_TEST_CONSTANTS.TEST_REPORT_ID),
        completeStatus
      );

      // Then - hook updates reactively
      await waitFor(() => {
        expect(result.current.status).toBe('complete');
        expect(result.current.isComplete).toBe(true);
        expect(result.current.result).toEqual(completeStatus.result);
      });
    });
  });

  describe('edge cases', () => {
    test('given empty calcId then query is disabled and returns initializing', () => {
      // When
      const { result } = renderHook(() => useCalculationStatus('', 'report'), { wrapper });

      // Then - returns initializing even when disabled
      expect(result.current.status).toBe('initializing');
      expect(result.current.isInitializing).toBe(true);
    });
  });

  describe('synthetic progress - Phase 2', () => {
    test('given no cache data then shows initializing (not synthetic progress)', async () => {
      // Given - No data in cache (CalcOrchestrator hasn't populated cache yet)
      // When
      const { result } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_SIMULATION_ID, 'simulation'),
        { wrapper }
      );

      // Then - shows initializing state (not computing with synthetic progress)
      // Synthetic progress only shows when status in cache is 'computing'
      await waitFor(() => {
        expect(result.current.status).toBe('initializing');
        expect(result.current.isInitializing).toBe(true);
        expect(result.current.isPending).toBe(false);
      });
    });

    test('given economy computing status then uses synthetic progress', async () => {
      // Given
      const calcStatus = mockCalcStatusComputing({
        metadata: {
          calcId: HOOK_TEST_CONSTANTS.TEST_REPORT_ID,
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
        queuePosition: 3,
      });
      queryClient.setQueryData<CalcStatus>(
        calculationKeys.byReportId(HOOK_TEST_CONSTANTS.TEST_REPORT_ID),
        calcStatus
      );

      // When
      const { result } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_REPORT_ID, 'report'),
        { wrapper }
      );

      // Then - synthetic progress overrides server progress
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
        expect(result.current.progress).toBe(12); // Mocked synthetic progress for economy
        expect(result.current.message).toBe('Loading population data...'); // Mocked synthetic message
        // Server data still available
        expect(result.current.queuePosition).toBe(3);
      });
    });

    test('given household computing status then uses synthetic progress', async () => {
      // Given
      const calcStatus = mockCalcStatusComputing({
        metadata: {
          calcId: HOOK_TEST_CONSTANTS.TEST_SIMULATION_ID,
          calcType: 'household',
          targetType: 'simulation',
          startedAt: Date.now(),
        },
      });
      queryClient.setQueryData<CalcStatus>(
        calculationKeys.bySimulationId(HOOK_TEST_CONSTANTS.TEST_SIMULATION_ID),
        calcStatus
      );

      // When
      const { result } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_SIMULATION_ID, 'simulation'),
        { wrapper }
      );

      // Then
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
        expect(result.current.progress).toBe(45); // Mocked synthetic progress for household
        expect(result.current.message).toBe('Running policy simulation...');
      });
    });

    test('given complete status then does not use synthetic progress', async () => {
      // Given
      const calcStatus = mockCalcStatusComplete({
        metadata: {
          calcId: HOOK_TEST_CONSTANTS.TEST_REPORT_ID,
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
      });
      queryClient.setQueryData<CalcStatus>(
        calculationKeys.byReportId(HOOK_TEST_CONSTANTS.TEST_REPORT_ID),
        calcStatus
      );

      // When
      const { result } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_REPORT_ID, 'report'),
        { wrapper }
      );

      // Then - no synthetic progress (would be 0 from mock when inactive)
      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
        expect(result.current.progress).toBeUndefined(); // No synthetic progress
        expect(result.current.message).toBeUndefined();
      });
    });
  });
});
