import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useStartCalculation } from '@/hooks/useStartCalculation';
import {
  createTestQueryClient,
  HOOK_TEST_CONSTANTS,
  mockHookCalcStartConfig,
} from '@/tests/fixtures/hooks/calculationHookFixtures';

// Mock CalcOrchestrator
const mockStartCalculation = vi.fn().mockResolvedValue(undefined);
vi.mock('@/libs/calculations/CalcOrchestrator', () => ({
  CalcOrchestrator: vi.fn().mockImplementation(() => ({
    startCalculation: mockStartCalculation,
    cleanup: vi.fn(),
  })),
}));

// Mock ResultPersister
vi.mock('@/libs/calculations/ResultPersister', () => ({
  ResultPersister: vi.fn().mockImplementation(() => ({
    persist: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('useStartCalculation', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('mutation execution', () => {
    test('given valid config when starting calculation then calls orchestrator', async () => {
      // Given
      const config = mockHookCalcStartConfig();
      const { result } = renderHook(() => useStartCalculation(), { wrapper });

      // When
      await result.current.mutateAsync(config);

      // Then
      await waitFor(() => {
        expect(mockStartCalculation).toHaveBeenCalledWith(config);
      });
    });

    test('given successful calculation then returns without error', async () => {
      // Given
      const config = mockHookCalcStartConfig();
      mockStartCalculation.mockResolvedValueOnce(undefined);
      const { result } = renderHook(() => useStartCalculation(), { wrapper });

      // When
      const promise = result.current.mutateAsync(config);

      // Then
      await expect(promise).resolves.toBeUndefined();
    });

    test('given orchestrator error then mutation fails', async () => {
      // Given
      const error = new Error('Orchestrator failed');
      mockStartCalculation.mockRejectedValueOnce(error);
      const config = mockHookCalcStartConfig();
      const { result } = renderHook(() => useStartCalculation(), { wrapper });

      // When
      const promise = result.current.mutateAsync(config);

      // Then
      await expect(promise).rejects.toThrow('Orchestrator failed');
    });
  });

  describe('mutation state', () => {
    test('given pending mutation then isPending is true', async () => {
      // Given
      let resolveFn: any;
      const pendingPromise = new Promise((resolve) => {
        resolveFn = resolve;
      });
      mockStartCalculation.mockReturnValueOnce(pendingPromise);
      const config = mockHookCalcStartConfig();
      const { result } = renderHook(() => useStartCalculation(), { wrapper });

      // When
      const mutationPromise = result.current.mutateAsync(config);

      // Then - check pending state
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      // Resolve to clean up
      resolveFn(undefined);
      await mutationPromise;
    });

    test('given mutation complete then isPending is false', async () => {
      // Given
      const config = mockHookCalcStartConfig();
      mockStartCalculation.mockResolvedValueOnce(undefined);
      const { result } = renderHook(() => useStartCalculation(), { wrapper });

      // When
      await result.current.mutateAsync(config);

      // Then
      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });

    test('given mutation error then error is accessible', async () => {
      // Given
      const error = new Error('Test error');
      mockStartCalculation.mockRejectedValueOnce(error);
      const config = mockHookCalcStartConfig();
      const { result } = renderHook(() => useStartCalculation(), { wrapper });

      // When
      try {
        await result.current.mutateAsync(config);
      } catch {
        // Expected to throw
      }

      // Then
      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });
    });
  });

  describe('multiple calculations', () => {
    test('given multiple sequential calls then orchestrator called for each', async () => {
      // Given
      const config1 = mockHookCalcStartConfig({
        calcId: HOOK_TEST_CONSTANTS.TEST_REPORT_ID,
      });
      const config2 = mockHookCalcStartConfig({
        calcId: HOOK_TEST_CONSTANTS.TEST_SIMULATION_ID,
      });
      const { result } = renderHook(() => useStartCalculation(), { wrapper });

      // When
      await result.current.mutateAsync(config1);
      await result.current.mutateAsync(config2);

      // Then
      expect(mockStartCalculation).toHaveBeenCalledTimes(2);
      expect(mockStartCalculation).toHaveBeenNthCalledWith(1, config1);
      expect(mockStartCalculation).toHaveBeenNthCalledWith(2, config2);
    });
  });

  describe('orchestrator creation', () => {
    test('given hook mounted then creates orchestrator with queryClient', async () => {
      // Given
      const { CalcOrchestrator } = await import('@/libs/calculations/CalcOrchestrator');
      const { ResultPersister } = await import('@/libs/calculations/ResultPersister');

      // When
      renderHook(() => useStartCalculation(), { wrapper });

      // Then
      expect(CalcOrchestrator).toHaveBeenCalled();
      expect(ResultPersister).toHaveBeenCalled();
    });
  });
});
