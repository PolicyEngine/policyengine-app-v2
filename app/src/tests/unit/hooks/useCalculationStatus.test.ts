import { createElement } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { useCalculationStatus } from '@/hooks/useCalculationStatus';
import { calculationKeys } from '@/libs/queryKeys';
import {
  createTestQueryClient,
  HOOK_TEST_CONSTANTS,
} from '@/tests/fixtures/hooks/calculationHookFixtures';
import {
  mockCompleteCalcStatus,
  mockComputingCalcStatus,
  mockErrorCalcStatus,
} from '@/tests/fixtures/types/calculationFixtures';

describe('useCalculationStatus', () => {
  let queryClient: any;
  let wrapper: any;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
  });

  describe('given no cached status', () => {
    it('then returns initializing state', async () => {
      // When
      const { result } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_REPORT_ID, 'report'),
        { wrapper }
      );

      // Then - queryFn returns initializing when no cache exists (prevents "No output found")
      await waitFor(() => {
        expect(result.current.status).toBe('initializing');
        expect(result.current.isInitializing).toBe(true);
        expect(result.current.isPending).toBe(false);
        expect(result.current.isComplete).toBe(false);
        expect(result.current.isError).toBe(false);
      });
    });
  });

  describe('given pending status in cache', () => {
    it('then returns pending state', async () => {
      // Given
      const status = mockComputingCalcStatus({
        progress: 45,
        message: 'Processing...',
        queuePosition: 3,
        estimatedTimeRemaining: 30000,
      });

      queryClient.setQueryData(
        calculationKeys.byReportId(HOOK_TEST_CONSTANTS.TEST_REPORT_ID),
        status
      );

      // When
      const { result } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_REPORT_ID, 'report'),
        { wrapper }
      );

      // Then - Status and flags reflect pending state
      // Note: progress/message may be synthetic for better UX
      await waitFor(() => {
        expect(result.current.status).toBe('pending');
        expect(result.current.isPending).toBe(true);
        // Server data is available even if not displayed
        expect(result.current.queuePosition).toBe(3);
        expect(result.current.estimatedTimeRemaining).toBe(30000);
        // Progress is present (may be synthetic or server)
        expect(result.current.progress).toBeGreaterThan(0);
      });
    });
  });

  describe('given complete status in cache', () => {
    it('then returns complete state with result', async () => {
      // Given
      const status = mockCompleteCalcStatus();

      queryClient.setQueryData(
        calculationKeys.byReportId(HOOK_TEST_CONSTANTS.TEST_REPORT_ID),
        status
      );

      // When
      const { result } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_REPORT_ID, 'report'),
        { wrapper }
      );

      // Then
      await waitFor(() => {
        expect(result.current.status).toBe('complete');
        expect(result.current.isComplete).toBe(true);
        expect(result.current.isPending).toBe(false);
        expect(result.current.result).toBeDefined();
      });
    });
  });

  describe('given error status in cache', () => {
    it('then returns error state', async () => {
      // Given
      const status = mockErrorCalcStatus();

      queryClient.setQueryData(
        calculationKeys.byReportId(HOOK_TEST_CONSTANTS.TEST_REPORT_ID),
        status
      );

      // When
      const { result } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_REPORT_ID, 'report'),
        { wrapper }
      );

      // Then
      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('given simulation target type', () => {
    it('then uses simulation query key', async () => {
      // Given
      const status = mockComputingCalcStatus();

      queryClient.setQueryData(
        calculationKeys.bySimulationId(HOOK_TEST_CONSTANTS.TEST_SIMULATION_ID),
        status
      );

      // When
      const { result } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_SIMULATION_ID, 'simulation'),
        { wrapper }
      );

      // Then
      await waitFor(() => {
        expect(result.current.status).toBe('pending');
      });
    });
  });

  describe('given status updates in cache', () => {
    it('then automatically reflects updates', async () => {
      // Given
      const computingStatus = mockComputingCalcStatus({ progress: 25 });
      const completeStatus = mockCompleteCalcStatus();

      queryClient.setQueryData(
        calculationKeys.byReportId(HOOK_TEST_CONSTANTS.TEST_REPORT_ID),
        computingStatus
      );

      const { result } = renderHook(
        () => useCalculationStatus(HOOK_TEST_CONSTANTS.TEST_REPORT_ID, 'report'),
        { wrapper }
      );

      // When - update cache
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      queryClient.setQueryData(
        calculationKeys.byReportId(HOOK_TEST_CONSTANTS.TEST_REPORT_ID),
        completeStatus
      );

      // Then - hook automatically updates
      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
        expect(result.current.isPending).toBe(false);
      });
    });
  });

  describe('given empty calcId', () => {
    it('then disables query and returns initializing', () => {
      // When
      const { result } = renderHook(() => useCalculationStatus('', 'report'), { wrapper });

      // Then - empty calcId disables query, fallback returns initializing
      expect(result.current.status).toBe('initializing');
      expect(result.current.isInitializing).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
