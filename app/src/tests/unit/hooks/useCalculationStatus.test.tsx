import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
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

      // Then
      expect(result.current.status).toBe('idle');
      expect(result.current.isComputing).toBe(false);
      expect(result.current.isComplete).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    test('given computing data in cache then returns computing status', async () => {
      // Given
      const calcStatus = mockCalcStatusComputing({
        metadata: {
          calcId: HOOK_TEST_CONSTANTS.TEST_REPORT_ID,
          calcType: 'economy',
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
        expect(result.current.isComputing).toBe(true);
        expect(result.current.isComplete).toBe(false);
        expect(result.current.isError).toBe(false);
        expect(result.current.progress).toBe(calcStatus.progress);
        expect(result.current.message).toBe(calcStatus.message);
        expect(result.current.queuePosition).toBe(calcStatus.queuePosition);
        expect(result.current.estimatedTimeRemaining).toBe(calcStatus.estimatedTimeRemaining);
      });
    });

    test('given complete data in cache then returns complete status', async () => {
      // Given
      const calcStatus = mockCalcStatusComplete({
        metadata: {
          calcId: HOOK_TEST_CONSTANTS.TEST_REPORT_ID,
          calcType: 'economy',
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
        expect(result.current.isComputing).toBe(false);
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
          calcType: 'economy',
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
        expect(result.current.isComputing).toBe(false);
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
          calcType: 'economy',
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
          calcType: 'economy',
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
          calcType: 'economy',
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
    test('given empty calcId then query is disabled', () => {
      // When
      const { result } = renderHook(() => useCalculationStatus('', 'report'), { wrapper });

      // Then
      expect(result.current.status).toBe('idle');
    });
  });
});
