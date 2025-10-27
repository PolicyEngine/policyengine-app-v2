import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useCalcStatusSubscription,
  useMultiSimulationCalcStatus,
  useReportCalculationStatus,
} from '@/hooks/useCalcStatusSubscription';
import { calculationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';

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
      const simulationId = 'sim-123';
      const cachedStatus: CalcStatus = {
        status: 'complete',
        result: { some: 'data' },
        metadata: {
          calcId: simulationId,
          calcType: 'household',
          targetType: 'simulation',
          startedAt: Date.now(),
        },
      };
      queryClient.setQueryData(calculationKeys.bySimulationId(simulationId), cachedStatus);

      // When
      const { result } = renderHook(() => useCalcStatusSubscription(simulationId), { wrapper });

      // Then
      expect(result.current).toEqual(cachedStatus);
    });

    it('given simulation ID with no cached status then returns undefined', () => {
      // Given
      const simulationId = 'sim-999';

      // When
      const { result } = renderHook(() => useCalcStatusSubscription(simulationId), { wrapper });

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
      const simulationIds = ['sim-1', 'sim-2'];
      const pendingStatus: CalcStatus = {
        status: 'pending',
        progress: 45,
        message: 'Calculating...',
        metadata: {
          calcId: 'sim-1',
          calcType: 'household',
          targetType: 'simulation',
          startedAt: Date.now(),
        },
      };
      queryClient.setQueryData(calculationKeys.bySimulationId('sim-1'), pendingStatus);

      // When
      const { result } = renderHook(() => useMultiSimulationCalcStatus(simulationIds), { wrapper });

      // Then
      expect(result.current.isCalculating).toBe(true);
      expect(result.current.progress).toBe(45);
      expect(result.current.message).toBe('Calculating...');
      expect(result.current.calcStatus).toEqual(pendingStatus);
    });

    it('given simulation with complete status then returns not calculating state', () => {
      // Given
      const simulationIds = ['sim-1'];
      const completeStatus: CalcStatus = {
        status: 'complete',
        result: { data: 'result' },
        metadata: {
          calcId: 'sim-1',
          calcType: 'household',
          targetType: 'simulation',
          startedAt: Date.now(),
        },
      };
      queryClient.setQueryData(calculationKeys.bySimulationId('sim-1'), completeStatus);

      // When
      const { result } = renderHook(() => useMultiSimulationCalcStatus(simulationIds), { wrapper });

      // Then
      expect(result.current.isCalculating).toBe(false);
      expect(result.current.progress).toBeUndefined();
    });

    it('given multiple simulations with first pending then returns first pending status', () => {
      // Given
      const simulationIds = ['sim-1', 'sim-2', 'sim-3'];
      const completeStatus: CalcStatus = {
        status: 'complete',
        result: {},
        metadata: {
          calcId: 'sim-1',
          calcType: 'household',
          targetType: 'simulation',
          startedAt: Date.now(),
        },
      };
      const pendingStatus: CalcStatus = {
        status: 'pending',
        progress: 75,
        message: 'Processing...',
        metadata: {
          calcId: 'sim-2',
          calcType: 'household',
          targetType: 'simulation',
          startedAt: Date.now(),
        },
      };
      queryClient.setQueryData(calculationKeys.bySimulationId('sim-1'), completeStatus);
      queryClient.setQueryData(calculationKeys.bySimulationId('sim-2'), pendingStatus);

      // When
      const { result } = renderHook(() => useMultiSimulationCalcStatus(simulationIds), { wrapper });

      // Then
      expect(result.current.isCalculating).toBe(true);
      expect(result.current.progress).toBe(75);
      expect(result.current.message).toBe('Processing...');
    });
  });

  describe('useReportCalculationStatus', () => {
    it('given report ID with pending status then returns calculating state', () => {
      // Given
      const reportId = 'report-123';
      const pendingStatus: CalcStatus = {
        status: 'pending',
        progress: 60,
        message: 'Running society-wide calculation...',
        metadata: {
          calcId: reportId,
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
      };
      queryClient.setQueryData(calculationKeys.byReportId(reportId), pendingStatus);

      // When
      const { result } = renderHook(() => useReportCalculationStatus(reportId), { wrapper });

      // Then
      expect(result.current.isCalculating).toBe(true);
      expect(result.current.progress).toBe(60);
      expect(result.current.message).toBe('Running society-wide calculation...');
      expect(result.current.calcStatus).toEqual(pendingStatus);
    });

    it('given report ID with complete status then returns not calculating state', () => {
      // Given
      const reportId = 'report-456';
      const completeStatus: CalcStatus = {
        status: 'complete',
        result: { economyData: 'result' },
        metadata: {
          calcId: reportId,
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
      };
      queryClient.setQueryData(calculationKeys.byReportId(reportId), completeStatus);

      // When
      const { result } = renderHook(() => useReportCalculationStatus(reportId), { wrapper });

      // Then
      expect(result.current.isCalculating).toBe(false);
      expect(result.current.progress).toBeUndefined();
      expect(result.current.calcStatus).toEqual(completeStatus);
    });

    it('given report ID with error status then returns not calculating state', () => {
      // Given
      const reportId = 'report-789';
      const errorStatus: CalcStatus = {
        status: 'error',
        error: {
          code: 'SOCIETY_WIDE_CALC_ERROR',
          message: 'Calculation failed',
          retryable: true,
        },
        metadata: {
          calcId: reportId,
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
      };
      queryClient.setQueryData(calculationKeys.byReportId(reportId), errorStatus);

      // When
      const { result } = renderHook(() => useReportCalculationStatus(reportId), { wrapper });

      // Then
      expect(result.current.isCalculating).toBe(false);
      expect(result.current.calcStatus).toEqual(errorStatus);
    });

    it('given report ID with no cached status then returns empty state', () => {
      // Given
      const reportId = 'report-999';

      // When
      const { result } = renderHook(() => useReportCalculationStatus(reportId), { wrapper });

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
      const reportId = 'report-cap';
      const pendingStatus: CalcStatus = {
        status: 'pending',
        progress: 95,
        message: 'Almost complete...',
        metadata: {
          calcId: reportId,
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
      };
      queryClient.setQueryData(calculationKeys.byReportId(reportId), pendingStatus);

      // When
      const { result } = renderHook(() => useReportCalculationStatus(reportId), { wrapper });

      // Then
      expect(result.current.progress).toBe(95);
      expect(result.current.isCalculating).toBe(true);
    });
  });
});
