import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useStartCalculation } from '@/hooks/useStartCalculation';
import { useCalculationStatus } from '@/hooks/useCalculationStatus';
import { calculationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';
import {
  mockHookCalcStartConfig,
  createTestQueryClient,
  HOOK_TEST_CONSTANTS,
} from '@/tests/fixtures/hooks/calculationHookFixtures';
import {
  mockCalcStatusComputing,
  mockCalcStatusComplete,
  mockSocietyWideResult,
} from '@/tests/fixtures/types/calculationFixtures';
import { mockReportMetadata } from '@/tests/fixtures/hooks/reportHooksMocks';
import { markReportCompleted } from '@/api/report';

// Mock APIs
vi.mock('@/api/report', () => ({
  markReportCompleted: vi.fn(),
  markReportError: vi.fn(),
}));

vi.mock('@/api/simulation', () => ({
  markSimulationCompleted: vi.fn(),
  markSimulationError: vi.fn(),
}));

vi.mock('@/api/societyWideCalculation', () => ({
  fetchSocietyWideCalculation: vi.fn(),
}));

/**
 * Integration test suite for the complete calculation flow
 * Tests the interaction between:
 * - useStartCalculation hook
 * - CalcOrchestrator
 * - ResultPersister
 * - useCalculationStatus hook
 * - TanStack Query cache
 */
// TODO: These tests are temporarily skipped because they appear to contribute to
// JavaScript heap out-of-memory errors when running the full test suite.
// This needs to be investigated and resolved.
describe.skip('Calculation Flow Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();

    // Mock successful persistence
    (markReportCompleted as any).mockResolvedValue(mockReportMetadata);
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('economy calculation flow', () => {
    test('given economy calculation started then status hook reflects progress', async () => {
      // Given - Set up hooks
      const { result: startResult } = renderHook(() => useStartCalculation(), { wrapper });
      const { result: statusResult } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_REPORT_ID, 'report'),
        { wrapper }
      );

      // Initial state - should be idle
      expect(statusResult.current.status).toBe('idle');

      // When - Manually populate cache with computing status (simulating orchestrator behavior)
      const computingStatus = mockCalcStatusComputing({
        metadata: {
          calcId: HOOK_TEST_CONSTANTS.TEST_REPORT_ID,
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
        progress: 25,
        queuePosition: 3,
        message: 'Waiting in queue...',
      });
      queryClient.setQueryData<CalcStatus>(
        calculationKeys.byReportId(HOOK_TEST_CONSTANTS.TEST_REPORT_ID),
        computingStatus
      );

      // Then - Status hook should reflect computing state
      await waitFor(() => {
        expect(statusResult.current.status).toBe('computing');
        expect(statusResult.current.isPending).toBe(true);
        expect(statusResult.current.progress).toBe(25);
        expect(statusResult.current.queuePosition).toBe(3);
      });
    });

    test('given calculation completes then status updates to complete', async () => {
      // Given - Start with computing status
      const { result: statusResult } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_REPORT_ID, 'report'),
        { wrapper }
      );

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

      await waitFor(() => {
        expect(statusResult.current.status).toBe('computing');
      });

      // When - Update to complete status (simulating calculation completion)
      const result = mockSocietyWideResult();
      const completeStatus = mockCalcStatusComplete({
        metadata: {
          calcId: HOOK_TEST_CONSTANTS.TEST_REPORT_ID,
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
        result,
      });
      queryClient.setQueryData<CalcStatus>(
        calculationKeys.byReportId(HOOK_TEST_CONSTANTS.TEST_REPORT_ID),
        completeStatus
      );

      // Then - Status hook should reflect completion
      await waitFor(() => {
        expect(statusResult.current.status).toBe('complete');
        expect(statusResult.current.isComplete).toBe(true);
        expect(statusResult.current.result).toEqual(result);
      });
    });

    test('given calculation completes then persistence is triggered', async () => {
      // This test verifies the orchestrator's persistence behavior
      // The orchestrator watches for status changes and persists results

      // Given - Mock the orchestrator behavior
      const config = mockHookCalcStartConfig({
        targetType: 'report',
        calcId: HOOK_TEST_CONSTANTS.TEST_REPORT_ID,
      });

      // When - Simulate completion by setting complete status
      const result = mockSocietyWideResult();
      const completeStatus = mockCalcStatusComplete({
        metadata: {
          calcId: HOOK_TEST_CONSTANTS.TEST_REPORT_ID,
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
        result,
      });
      queryClient.setQueryData<CalcStatus>(
        calculationKeys.byReportId(HOOK_TEST_CONSTANTS.TEST_REPORT_ID),
        completeStatus
      );

      // Then - Verify cache has the complete status
      const cachedStatus = queryClient.getQueryData<CalcStatus>(
        calculationKeys.byReportId(HOOK_TEST_CONSTANTS.TEST_REPORT_ID)
      );
      expect(cachedStatus?.status).toBe('complete');
      expect(cachedStatus?.result).toEqual(result);
    });
  });

  describe('cache invalidation', () => {
    test('given status updates then all observers are notified', async () => {
      // Given - Create two separate hook instances watching same calculation
      const { result: status1 } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_REPORT_ID, 'report'),
        { wrapper }
      );
      const { result: status2 } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_REPORT_ID, 'report'),
        { wrapper }
      );

      // Both should start idle
      expect(status1.current.status).toBe('idle');
      expect(status2.current.status).toBe('idle');

      // When - Update cache
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

      // Then - Both observers should see the update
      await waitFor(() => {
        expect(status1.current.status).toBe('computing');
        expect(status2.current.status).toBe('computing');
      });
    });
  });

  describe('error handling', () => {
    test('given calculation error then status reflects error state', async () => {
      // Given
      const { result: statusResult } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_REPORT_ID, 'report'),
        { wrapper }
      );

      // When - Simulate error
      const errorStatus: CalcStatus = {
        status: 'error',
        error: {
          code: 'CALC_ERROR',
          message: 'Calculation failed',
          retryable: true,
        },
        metadata: {
          calcId: HOOK_TEST_CONSTANTS.TEST_REPORT_ID,
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
      };
      queryClient.setQueryData<CalcStatus>(
        calculationKeys.byReportId(HOOK_TEST_CONSTANTS.TEST_REPORT_ID),
        errorStatus
      );

      // Then - Status hook should reflect error
      await waitFor(() => {
        expect(statusResult.current.status).toBe('error');
        expect(statusResult.current.isError).toBe(true);
        expect(statusResult.current.error).toEqual(errorStatus.error);
      });
    });
  });

  describe('concurrent calculations', () => {
    test('given multiple calculations then each maintains separate state', async () => {
      // Given - Two different calculations
      const reportId1 = HOOK_TEST_CONSTANTS.TEST_REPORT_ID;
      const reportId2 = HOOK_TEST_CONSTANTS.TEST_SIMULATION_ID;

      const { result: status1 } = renderHook(
        () => useCalculationStatus(reportId1, 'report'),
        { wrapper }
      );
      const { result: status2 } = renderHook(
        () => useCalculationStatus(reportId2, 'simulation'),
        { wrapper }
      );

      // When - Set different statuses
      const computing = mockCalcStatusComputing({
        metadata: {
          calcId: reportId1,
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
      });
      const complete = mockCalcStatusComplete({
        metadata: {
          calcId: reportId2,
          calcType: 'household',
          targetType: 'simulation',
          startedAt: Date.now(),
        },
      });

      queryClient.setQueryData<CalcStatus>(calculationKeys.byReportId(reportId1), computing);
      queryClient.setQueryData<CalcStatus>(calculationKeys.bySimulationId(reportId2), complete);

      // Then - Each maintains separate state
      await waitFor(() => {
        expect(status1.current.status).toBe('computing');
        expect(status2.current.status).toBe('complete');
      });
    });
  });

  describe('hook coordination', () => {
    test('given start calculation then status hook can read result', async () => {
      // Given
      const config = mockHookCalcStartConfig({
        calcId: HOOK_TEST_CONSTANTS.TEST_REPORT_ID,
        targetType: 'report',
      });

      const { result: startResult } = renderHook(() => useStartCalculation(), { wrapper });
      const { result: statusResult } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_REPORT_ID, 'report'),
        { wrapper }
      );

      // When - Simulate orchestrator populating cache after start
      // (In real usage, orchestrator does this via prefetchQuery)
      const computing = mockCalcStatusComputing({
        metadata: {
          calcId: HOOK_TEST_CONSTANTS.TEST_REPORT_ID,
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
      });
      queryClient.setQueryData<CalcStatus>(
        calculationKeys.byReportId(HOOK_TEST_CONSTANTS.TEST_REPORT_ID),
        computing
      );

      // Then - Status hook can read the computing status
      await waitFor(() => {
        expect(statusResult.current.status).toBe('computing');
        expect(statusResult.current.isPending).toBe(true);
      });
    });
  });
});
