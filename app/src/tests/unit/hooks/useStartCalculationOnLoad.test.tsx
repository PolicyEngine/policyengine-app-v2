import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { useStartCalculationOnLoad } from '@/hooks/useStartCalculationOnLoad';
import { CalcOrchestrator } from '@/libs/calculations/CalcOrchestrator';
import { CalcStartConfig } from '@/types/calculation';
import { CACHE_HYDRATION_TEST_CONSTANTS } from '@/tests/fixtures/hooks/cacheHydrationFixtures';

// Mock CalcOrchestrator
vi.mock('@/libs/calculations/CalcOrchestrator');
vi.mock('@/libs/calculations/ResultPersister');

describe('useStartCalculationOnLoad', () => {
  let queryClient: QueryClient;
  let mockStartCalculation: Mock;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset mocks
    vi.clearAllMocks();

    // Setup mock for startCalculation
    mockStartCalculation = vi.fn().mockResolvedValue(undefined);
    (CalcOrchestrator as unknown as Mock).mockImplementation(() => ({
      startCalculation: mockStartCalculation,
      cleanup: vi.fn(),
    }));
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const createMockConfig = (overrides?: Partial<CalcStartConfig>): CalcStartConfig => ({
    calcId: CACHE_HYDRATION_TEST_CONSTANTS.REPORT_IDS.WITH_OUTPUT,
    targetType: 'report',
    countryId: CACHE_HYDRATION_TEST_CONSTANTS.COUNTRY_IDS.US,
    simulations: {
      simulation1: {
        id: 'sim-1',
        label: 'Baseline',
        populationType: 'geography',
        populationId: 'us',
        isCreated: true,
      },
      simulation2: null,
    },
    populations: {
      household1: null,
      household2: null,
      geography1: {
        id: 'us-us',
        countryId: CACHE_HYDRATION_TEST_CONSTANTS.COUNTRY_IDS.US,
        scope: 'national',
        geographyId: 'us',
      },
      geography2: null,
    },
    ...overrides,
  });

  it('should start calculation when enabled and not complete', async () => {
    const config = createMockConfig();

    renderHook(
      () =>
        useStartCalculationOnLoad({
          enabled: true,
          config,
          isComplete: false,
          isComputing: false,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(mockStartCalculation).toHaveBeenCalledWith(config);
    });
  });

  it('should not start calculation when disabled', async () => {
    const config = createMockConfig();

    renderHook(
      () =>
        useStartCalculationOnLoad({
          enabled: false,
          config,
          isComplete: false,
          isComputing: false,
        }),
      { wrapper }
    );

    // Wait a bit to ensure it doesn't start
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockStartCalculation).not.toHaveBeenCalled();
  });

  it('should not start calculation when config is null', async () => {
    renderHook(
      () =>
        useStartCalculationOnLoad({
          enabled: true,
          config: null,
          isComplete: false,
          isComputing: false,
        }),
      { wrapper }
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockStartCalculation).not.toHaveBeenCalled();
  });

  it('should not start calculation when already complete', async () => {
    const config = createMockConfig();

    renderHook(
      () =>
        useStartCalculationOnLoad({
          enabled: true,
          config,
          isComplete: true,
          isComputing: false,
        }),
      { wrapper }
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockStartCalculation).not.toHaveBeenCalled();
  });

  it('should not start calculation when already computing', async () => {
    const config = createMockConfig();

    renderHook(
      () =>
        useStartCalculationOnLoad({
          enabled: true,
          config,
          isComplete: false,
          isComputing: true,
        }),
      { wrapper }
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockStartCalculation).not.toHaveBeenCalled();
  });

  it('should only start calculation once even with re-renders', async () => {
    const config = createMockConfig();

    const { rerender } = renderHook(
      () =>
        useStartCalculationOnLoad({
          enabled: true,
          config,
          isComplete: false,
          isComputing: false,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(mockStartCalculation).toHaveBeenCalledTimes(1);
    });

    // Force re-render
    rerender();

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should still only be called once
    expect(mockStartCalculation).toHaveBeenCalledTimes(1);
  });

  it('should log when starting calculation', async () => {
    const config = createMockConfig();
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    renderHook(
      () =>
        useStartCalculationOnLoad({
          enabled: true,
          config,
          isComplete: false,
          isComputing: false,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[useStartCalculationOnLoad] Starting calculation for:',
        config.calcId
      );
    });
  });

  it('should handle calculation start errors', async () => {
    const config = createMockConfig();
    const testError = new Error('Failed to start');
    mockStartCalculation.mockRejectedValueOnce(testError);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderHook(
      () =>
        useStartCalculationOnLoad({
          enabled: true,
          config,
          isComplete: false,
          isComputing: false,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[useStartCalculationOnLoad] Failed to start calculation:',
        testError
      );
    });
  });

  it('should reset startedRef and allow retry after error', async () => {
    const config = createMockConfig();
    const testError = new Error('Failed to start');

    // First call fails
    mockStartCalculation.mockRejectedValueOnce(testError);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = renderHook(
      () =>
        useStartCalculationOnLoad({
          enabled: true,
          config,
          isComplete: false,
          isComputing: false,
        }),
      { wrapper }
    );

    // Wait for first call to fail
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    expect(mockStartCalculation).toHaveBeenCalledTimes(1);

    // Unmount to reset the hook
    unmount();

    // Clear the error mock for next attempt
    mockStartCalculation.mockResolvedValueOnce(undefined);
    consoleErrorSpy.mockClear();

    // Remount the hook (simulates navigating away and back)
    renderHook(
      () =>
        useStartCalculationOnLoad({
          enabled: true,
          config,
          isComplete: false,
          isComputing: false,
        }),
      { wrapper }
    );

    // Should be called again (retry after remount)
    await waitFor(() => {
      expect(mockStartCalculation).toHaveBeenCalledTimes(2);
    });

    // Should not log error this time
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should not start if status changes to computing after mount', async () => {
    const config = createMockConfig();

    const { rerender } = renderHook(
      ({ isComputing }) =>
        useStartCalculationOnLoad({
          enabled: true,
          config,
          isComplete: false,
          isComputing,
        }),
      { wrapper, initialProps: { isComputing: true } }
    );

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should not start while computing
    expect(mockStartCalculation).not.toHaveBeenCalled();

    // Change to not computing
    rerender({ isComputing: false });

    // Should start now
    await waitFor(() => {
      expect(mockStartCalculation).toHaveBeenCalledTimes(1);
    });
  });

  it('should not start if status changes to complete after mount', async () => {
    const config = createMockConfig();

    const { rerender } = renderHook(
      ({ isComplete }) =>
        useStartCalculationOnLoad({
          enabled: true,
          config,
          isComplete,
          isComputing: false,
        }),
      { wrapper, initialProps: { isComplete: true } }
    );

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should not start if already complete
    expect(mockStartCalculation).not.toHaveBeenCalled();

    // Change to not complete (shouldn't happen in real app, but test coverage)
    rerender({ isComplete: false });

    // Should start now
    await waitFor(() => {
      expect(mockStartCalculation).toHaveBeenCalledTimes(1);
    });
  });

  it('should create CalcOrchestrator with correct dependencies', async () => {
    const config = createMockConfig();

    renderHook(
      () =>
        useStartCalculationOnLoad({
          enabled: true,
          config,
          isComplete: false,
          isComputing: false,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(CalcOrchestrator).toHaveBeenCalledWith(
        queryClient,
        expect.any(Object) // ResultPersister
      );
    });
  });
});
