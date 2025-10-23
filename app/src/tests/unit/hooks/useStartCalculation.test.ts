import { createElement } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStartCalculation } from '@/hooks/useStartCalculation';
import {
  createTestQueryClient,
  HOOK_TEST_CONSTANTS,
  mockHookCalcStartConfig,
} from '@/tests/fixtures/hooks/calculationHookFixtures';

// Mock the orchestrator and persister
vi.mock('@/libs/calculations/CalcOrchestrator', () => ({
  CalcOrchestrator: vi.fn().mockImplementation(() => ({
    startCalculation: vi.fn().mockResolvedValue(undefined),
    cleanup: vi.fn(),
  })),
}));

vi.mock('@/libs/calculations/ResultPersister', () => ({
  ResultPersister: vi.fn().mockImplementation(() => ({
    persist: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('useStartCalculation', () => {
  let queryClient: any;
  let wrapper: any;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
    vi.clearAllMocks();
  });

  it('given hook called then returns mutation object', () => {
    // When
    const { result } = renderHook(() => useStartCalculation(), { wrapper });

    // Then
    expect(result.current).toHaveProperty('mutate');
    expect(result.current).toHaveProperty('mutateAsync');
    expect(result.current).toHaveProperty('isPending');
    expect(result.current).toHaveProperty('isError');
    expect(result.current).toHaveProperty('isSuccess');
  });

  it('given mutation called then starts calculation', async () => {
    // Given
    const config = mockHookCalcStartConfig();

    const { result } = renderHook(() => useStartCalculation(), { wrapper });

    // When
    await result.current.mutateAsync(config);

    // Then
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('given mutation succeeds then sets success state', async () => {
    // Given
    const config = mockHookCalcStartConfig();
    const { result } = renderHook(() => useStartCalculation(), { wrapper });

    // When
    await result.current.mutateAsync(config);

    // Then
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.isPending).toBe(false);
    });
  });

  it('given mutation fails then sets error state', async () => {
    // Given
    const testError = new Error('Calculation failed');

    // Override the mock for this test
    const { CalcOrchestrator } = await import('@/libs/calculations/CalcOrchestrator');
    vi.mocked(CalcOrchestrator).mockImplementationOnce(
      () =>
        ({
          startCalculation: vi.fn().mockRejectedValue(testError),
          cleanup: vi.fn(),
        }) as any
    );

    const config = mockHookCalcStartConfig();
    const { result } = renderHook(() => useStartCalculation(), { wrapper });

    // When/Then
    await expect(result.current.mutateAsync(config)).rejects.toThrow('Calculation failed');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toEqual(testError);
    });
  });

  it('given multiple mutations then orchestrator is reused', async () => {
    // Given
    const { CalcOrchestrator } = await import('@/libs/calculations/CalcOrchestrator');
    const config1 = mockHookCalcStartConfig({
      calcId: HOOK_TEST_CONSTANTS.TEST_REPORT_ID,
    });
    const config2 = mockHookCalcStartConfig({
      calcId: `${HOOK_TEST_CONSTANTS.TEST_REPORT_ID}-2`,
    });

    const { result } = renderHook(() => useStartCalculation(), { wrapper });

    // When
    await result.current.mutateAsync(config1);
    await result.current.mutateAsync(config2);

    // Then
    // CalcOrchestrator should only be constructed once (memoized)
    expect(CalcOrchestrator).toHaveBeenCalledTimes(1);
  });

  it('given pending mutation then isPending is true', async () => {
    // Given
    let resolver: () => void;
    const promise = new Promise<void>((resolve) => {
      resolver = resolve;
    });

    // Override the mock for this test
    const { CalcOrchestrator } = await import('@/libs/calculations/CalcOrchestrator');
    vi.mocked(CalcOrchestrator).mockImplementationOnce(
      () =>
        ({
          startCalculation: vi.fn().mockReturnValue(promise),
          cleanup: vi.fn(),
        }) as any
    );

    const config = mockHookCalcStartConfig();
    const { result } = renderHook(() => useStartCalculation(), { wrapper });

    // When
    result.current.mutate(config);

    // Then
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    // Cleanup
    resolver!();
  });
});
