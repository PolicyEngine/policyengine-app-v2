import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  useCalcStatusSubscription,
  useMultiSimulationCalcStatus,
  useReportCalculationStatus,
} from '@/hooks/useCalcStatusSubscription';
import { calculationKeys } from '@/libs/queryKeys';
import {
  createMockCompleteStatus,
  createMockErrorStatus,
  createMockPendingStatus,
  TEST_PROGRESS_VALUES,
  TEST_REPORT_IDS,
  TEST_SIMULATION_IDS,
} from '@/tests/fixtures/hooks/useCalcStatusSubscriptionMocks';

describe('useCalcStatusSubscription', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useCalcStatusSubscription', () => {
    it('given simulation ID with cached status then returns CalcStatus', () => {
      // Given
      const cachedStatus = createMockCompleteStatus(TEST_SIMULATION_IDS.SIM_123, 'household', {
        some: 'data',
      });
      queryClient.setQueryData(
        calculationKeys.bySimulationId(TEST_SIMULATION_IDS.SIM_123),
        cachedStatus
      );

      // When
      const { result } = renderHook(() => useCalcStatusSubscription(TEST_SIMULATION_IDS.SIM_123), {
        wrapper,
      });

      // Then
      expect(result.current).toEqual(cachedStatus);
    });

    it('given simulation ID with no cached status then returns undefined', () => {
      // When
      const { result } = renderHook(() => useCalcStatusSubscription('sim-999'), { wrapper });

      // Then
      expect(result.current).toBeUndefined();
    });

    it('given undefined simulation ID then returns undefined', () => {
      // When
      const { result } = renderHook(() => useCalcStatusSubscription(undefined), { wrapper });

      // Then
      expect(result.current).toBeUndefined();
    });
  });

  describe('useMultiSimulationCalcStatus', () => {
    it('given empty simulation IDs then returns empty state', () => {
      // Given
      const simulationIds: string[] = [];

      // When
      const { result } = renderHook(() => useMultiSimulationCalcStatus(simulationIds), { wrapper });

      // Then
      expect(result.current).toEqual({
        isCalculating: false,
        progress: undefined,
        message: undefined,
        calcStatus: undefined,
      });
    });

    it('given simulation with pending status then returns calculating state', () => {
      // Given
      const simulationIds = [TEST_SIMULATION_IDS.SIM_1, TEST_SIMULATION_IDS.SIM_2];
      const pendingStatus = createMockPendingStatus(
        TEST_SIMULATION_IDS.SIM_1,
        'household',
        TEST_PROGRESS_VALUES.LOW,
        'Calculating...'
      );
      queryClient.setQueryData(
        calculationKeys.bySimulationId(TEST_SIMULATION_IDS.SIM_1),
        pendingStatus
      );

      // When
      const { result } = renderHook(() => useMultiSimulationCalcStatus(simulationIds), { wrapper });

      // Then
      expect(result.current.isCalculating).toBe(true);
      expect(result.current.progress).toBe(TEST_PROGRESS_VALUES.LOW);
      expect(result.current.message).toBe('Calculating...');
      expect(result.current.calcStatus).toEqual(pendingStatus);
    });

    it('given simulation with complete status then returns not calculating state', () => {
      // Given
      const simulationIds = [TEST_SIMULATION_IDS.SIM_1];
      const completeStatus = createMockCompleteStatus(TEST_SIMULATION_IDS.SIM_1, 'household', {
        data: 'result',
      });
      queryClient.setQueryData(
        calculationKeys.bySimulationId(TEST_SIMULATION_IDS.SIM_1),
        completeStatus
      );

      // When
      const { result } = renderHook(() => useMultiSimulationCalcStatus(simulationIds), { wrapper });

      // Then
      expect(result.current.isCalculating).toBe(false);
      expect(result.current.progress).toBeUndefined();
    });

    it('given multiple simulations with first pending then returns first pending status', () => {
      // Given
      const simulationIds = [
        TEST_SIMULATION_IDS.SIM_1,
        TEST_SIMULATION_IDS.SIM_2,
        TEST_SIMULATION_IDS.SIM_3,
      ];
      const completeStatus = createMockCompleteStatus(TEST_SIMULATION_IDS.SIM_1);
      const pendingStatus = createMockPendingStatus(
        TEST_SIMULATION_IDS.SIM_2,
        'household',
        TEST_PROGRESS_VALUES.HIGH,
        'Processing...'
      );
      queryClient.setQueryData(
        calculationKeys.bySimulationId(TEST_SIMULATION_IDS.SIM_1),
        completeStatus
      );
      queryClient.setQueryData(
        calculationKeys.bySimulationId(TEST_SIMULATION_IDS.SIM_2),
        pendingStatus
      );

      // When
      const { result } = renderHook(() => useMultiSimulationCalcStatus(simulationIds), { wrapper });

      // Then
      expect(result.current.isCalculating).toBe(true);
      expect(result.current.progress).toBe(TEST_PROGRESS_VALUES.HIGH);
      expect(result.current.message).toBe('Processing...');
    });
  });

  describe('useReportCalculationStatus', () => {
    it('given report ID with pending status then returns calculating state', () => {
      // Given
      const pendingStatus = createMockPendingStatus(
        TEST_REPORT_IDS.REPORT_123,
        'societyWide',
        TEST_PROGRESS_VALUES.MEDIUM,
        'Running society-wide calculation...'
      );
      queryClient.setQueryData(
        calculationKeys.byReportId(TEST_REPORT_IDS.REPORT_123),
        pendingStatus
      );

      // When
      const { result } = renderHook(() => useReportCalculationStatus(TEST_REPORT_IDS.REPORT_123), {
        wrapper,
      });

      // Then
      expect(result.current.isCalculating).toBe(true);
      expect(result.current.progress).toBe(TEST_PROGRESS_VALUES.MEDIUM);
      expect(result.current.message).toBe('Running society-wide calculation...');
      expect(result.current.calcStatus).toEqual(pendingStatus);
    });

    it('given report ID with complete status then returns not calculating state', () => {
      // Given
      const completeStatus = createMockCompleteStatus(TEST_REPORT_IDS.REPORT_456, 'societyWide', {
        economyData: 'result',
      });
      queryClient.setQueryData(
        calculationKeys.byReportId(TEST_REPORT_IDS.REPORT_456),
        completeStatus
      );

      // When
      const { result } = renderHook(() => useReportCalculationStatus(TEST_REPORT_IDS.REPORT_456), {
        wrapper,
      });

      // Then
      expect(result.current.isCalculating).toBe(false);
      expect(result.current.progress).toBeUndefined();
      expect(result.current.calcStatus).toEqual(completeStatus);
    });

    it('given report ID with error status then returns not calculating state', () => {
      // Given
      const errorStatus = createMockErrorStatus(
        TEST_REPORT_IDS.REPORT_789,
        'societyWide',
        'Calculation failed'
      );
      queryClient.setQueryData(calculationKeys.byReportId(TEST_REPORT_IDS.REPORT_789), errorStatus);

      // When
      const { result } = renderHook(() => useReportCalculationStatus(TEST_REPORT_IDS.REPORT_789), {
        wrapper,
      });

      // Then
      expect(result.current.isCalculating).toBe(false);
      expect(result.current.calcStatus).toEqual(errorStatus);
    });

    it('given report ID with no cached status then returns empty state', () => {
      // When
      const { result } = renderHook(() => useReportCalculationStatus(TEST_REPORT_IDS.REPORT_999), {
        wrapper,
      });

      // Then
      expect(result.current.isCalculating).toBe(false);
      expect(result.current.progress).toBeUndefined();
      expect(result.current.message).toBeUndefined();
      expect(result.current.calcStatus).toBeUndefined();
    });

    it('given undefined report ID then returns empty state', () => {
      // When
      const { result } = renderHook(() => useReportCalculationStatus(undefined), { wrapper });

      // Then
      expect(result.current.isCalculating).toBe(false);
      expect(result.current.progress).toBeUndefined();
    });

    it('given report with progress at 95% then returns capped progress value', () => {
      // Given
      const pendingStatus = createMockPendingStatus(
        TEST_REPORT_IDS.REPORT_CAP,
        'societyWide',
        TEST_PROGRESS_VALUES.CAPPED,
        'Almost complete...'
      );
      queryClient.setQueryData(
        calculationKeys.byReportId(TEST_REPORT_IDS.REPORT_CAP),
        pendingStatus
      );

      // When
      const { result } = renderHook(() => useReportCalculationStatus(TEST_REPORT_IDS.REPORT_CAP), {
        wrapper,
      });

      // Then
      expect(result.current.progress).toBe(TEST_PROGRESS_VALUES.CAPPED);
      expect(result.current.isCalculating).toBe(true);
    });
  });
});
