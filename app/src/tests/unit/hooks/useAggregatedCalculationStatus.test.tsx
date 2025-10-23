import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAggregatedCalculationStatus } from '@/hooks/useAggregatedCalculationStatus';
import { calculationKeys } from '@/libs/queryKeys';
import { createTestMetadata, TEST_SIM_IDS } from '@/tests/fixtures/hooks/aggregatedStatusMocks';
import {
  mockCalcStatusComplete,
  mockCalcStatusComputing,
  mockCalcStatusError,
  mockCalcStatusIdle,
  mockHouseholdResult,
  mockSocietyWideResult,
} from '@/tests/fixtures/types/calculationFixtures';

// Mock useSyntheticProgress
vi.mock('@/hooks/useSyntheticProgress', () => ({
  useSyntheticProgress: vi.fn(() => ({
    progress: 50,
    message: 'Calculating...',
  })),
}));

// TODO: These tests are temporarily skipped because they appear to contribute to
// JavaScript heap out-of-memory errors when running the full test suite.
// This needs to be investigated and resolved.
describe.skip('useAggregatedCalculationStatus', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('single simulation status', () => {
    it('given single complete simulation then status is complete', () => {
      // Given
      const simId = TEST_SIM_IDS.SIM_1;
      const result = mockHouseholdResult();
      const completeStatus = mockCalcStatusComplete({
        metadata: createTestMetadata(simId),
        result,
      });
      queryClient.setQueryData(calculationKeys.bySimulationId(simId), completeStatus);

      // When
      const { result: hookResult } = renderHook(
        () => useAggregatedCalculationStatus([simId], 'simulation'),
        { wrapper }
      );

      // Then
      expect(hookResult.current.status).toBe('complete');
      expect(hookResult.current.isComplete).toBe(true);
      expect(hookResult.current.result).toEqual(result);
    });

    it('given single error simulation then status is error', () => {
      // Given
      const simId = TEST_SIM_IDS.SIM_1;
      const errorStatus = mockCalcStatusError({
        metadata: createTestMetadata(simId),
        error: {
          code: 'CALC_ERROR',
          message: 'Calculation failed',
          retryable: true,
        },
      });
      queryClient.setQueryData(calculationKeys.bySimulationId(simId), errorStatus);

      // When
      const { result } = renderHook(() => useAggregatedCalculationStatus([simId], 'simulation'), {
        wrapper,
      });

      // Then
      expect(result.current.status).toBe('error');
      expect(result.current.isError).toBe(true);
      expect(result.current.error?.code).toBe('CALC_ERROR');
    });

    it('given single idle simulation then status is idle', () => {
      // Given
      const simId = TEST_SIM_IDS.SIM_1;
      const idleStatus = mockCalcStatusIdle({
        metadata: createTestMetadata(simId),
      });
      queryClient.setQueryData(calculationKeys.bySimulationId(simId), idleStatus);

      // When
      const { result } = renderHook(() => useAggregatedCalculationStatus([simId], 'simulation'), {
        wrapper,
      });

      // Then
      expect(result.current.status).toBe('idle');
      expect(result.current.isIdle).toBe(true);
    });
  });

  describe('multiple simulations aggregation', () => {
    it('given all simulations complete then aggregated status is complete', () => {
      // Given
      const sim1 = TEST_SIM_IDS.SIM_1;
      const sim2 = TEST_SIM_IDS.SIM_2;

      queryClient.setQueryData(
        calculationKeys.bySimulationId(sim1),
        mockCalcStatusComplete({ metadata: createTestMetadata(sim1) })
      );
      queryClient.setQueryData(
        calculationKeys.bySimulationId(sim2),
        mockCalcStatusComplete({ metadata: createTestMetadata(sim2) })
      );

      // When
      const { result } = renderHook(
        () => useAggregatedCalculationStatus([sim1, sim2], 'simulation'),
        { wrapper }
      );

      // Then
      expect(result.current.status).toBe('complete');
      expect(result.current.isComplete).toBe(true);
      expect(result.current.calculations.length).toBe(2);
    });

    it('given any simulation has error then aggregated status is error', () => {
      // Given
      const sim1 = TEST_SIM_IDS.SIM_1;
      const sim2 = TEST_SIM_IDS.SIM_2;

      queryClient.setQueryData(
        calculationKeys.bySimulationId(sim1),
        mockCalcStatusError({
          metadata: createTestMetadata(sim1),
          error: { code: 'ERROR', message: 'Failed', retryable: true },
        })
      );
      queryClient.setQueryData(
        calculationKeys.bySimulationId(sim2),
        mockCalcStatusComplete({ metadata: createTestMetadata(sim2) })
      );

      // When
      const { result } = renderHook(
        () => useAggregatedCalculationStatus([sim1, sim2], 'simulation'),
        { wrapper }
      );

      // Then
      expect(result.current.status).toBe('error');
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeDefined();
    });

    it('given all simulations idle then aggregated status is idle', () => {
      // Given
      const sim1 = TEST_SIM_IDS.SIM_1;
      const sim2 = TEST_SIM_IDS.SIM_2;

      queryClient.setQueryData(
        calculationKeys.bySimulationId(sim1),
        mockCalcStatusIdle({ metadata: createTestMetadata(sim1) })
      );
      queryClient.setQueryData(
        calculationKeys.bySimulationId(sim2),
        mockCalcStatusIdle({ metadata: createTestMetadata(sim2) })
      );

      // When
      const { result } = renderHook(
        () => useAggregatedCalculationStatus([sim1, sim2], 'simulation'),
        { wrapper }
      );

      // Then
      expect(result.current.status).toBe('idle');
      expect(result.current.isIdle).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('given empty array then returns idle', () => {
      // When
      const { result } = renderHook(() => useAggregatedCalculationStatus([], 'simulation'), {
        wrapper,
      });

      // Then
      expect(result.current.status).toBe('idle');
      expect(result.current.calculations).toEqual([]);
      expect(result.current.isIdle).toBe(true);
    });

    it('given no cache data then returns initializing', () => {
      // Given
      const simId = TEST_SIM_IDS.SIM_1;

      // When
      const { result } = renderHook(() => useAggregatedCalculationStatus([simId], 'simulation'), {
        wrapper,
      });

      // Then
      expect(result.current.status).toBe('initializing');
      expect(result.current.isInitializing).toBe(true);
    });
  });

  describe('report calculations', () => {
    it('given report ID then queries by report', () => {
      // Given
      const reportId = 'report-1';
      const status = mockCalcStatusComplete({
        metadata: createTestMetadata(reportId, 'societyWide', 'report'),
        result: mockSocietyWideResult(),
      });
      queryClient.setQueryData(calculationKeys.byReportId(reportId), status);

      // When
      const { result } = renderHook(() => useAggregatedCalculationStatus([reportId], 'report'), {
        wrapper,
      });

      // Then
      expect(result.current.status).toBe('complete');
      expect(result.current.result).toBeDefined();
    });
  });

  describe('calculations array', () => {
    it('given multiple calculations then returns all in calculations array', () => {
      // Given
      const sim1 = TEST_SIM_IDS.SIM_1;
      const sim2 = TEST_SIM_IDS.SIM_2;
      const sim3 = TEST_SIM_IDS.SIM_3;

      queryClient.setQueryData(
        calculationKeys.bySimulationId(sim1),
        mockCalcStatusComplete({ metadata: createTestMetadata(sim1) })
      );
      queryClient.setQueryData(
        calculationKeys.bySimulationId(sim2),
        mockCalcStatusIdle({ metadata: createTestMetadata(sim2) })
      );
      queryClient.setQueryData(
        calculationKeys.bySimulationId(sim3),
        mockCalcStatusError({
          metadata: createTestMetadata(sim3),
          error: { code: 'ERROR', message: 'Failed', retryable: true },
        })
      );

      // When
      const { result } = renderHook(
        () => useAggregatedCalculationStatus([sim1, sim2, sim3], 'simulation'),
        { wrapper }
      );

      // Then
      expect(result.current.calculations.length).toBe(3);
      expect(result.current.calculations[0].status).toBe('complete');
      expect(result.current.calculations[1].status).toBe('idle');
      expect(result.current.calculations[2].status).toBe('error');
    });
  });
});
