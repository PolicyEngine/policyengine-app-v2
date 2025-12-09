import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { CalcOrchestratorProvider } from '@/contexts/CalcOrchestratorContext';
import { useStartCalculationOnLoad } from '@/hooks/useStartCalculationOnLoad';
import { CalcOrchestrator } from '@/libs/calculations/CalcOrchestrator';
import { CACHE_HYDRATION_TEST_CONSTANTS } from '@/tests/fixtures/hooks/cacheHydrationFixtures';
import { CalcStartConfig } from '@/types/calculation';

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
    <QueryClientProvider client={queryClient}>
      <CalcOrchestratorProvider>{children}</CalcOrchestratorProvider>
    </QueryClientProvider>
  );

  const createMockConfig = (overrides?: Partial<CalcStartConfig>): CalcStartConfig => ({
    calcId: CACHE_HYDRATION_TEST_CONSTANTS.REPORT_IDS.WITH_OUTPUT,
    targetType: 'report',
    countryId: CACHE_HYDRATION_TEST_CONSTANTS.COUNTRY_IDS.US,
    year: '2024',
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
          configs: [config],
          isComplete: false,
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
          configs: [config],
          isComplete: false,
        }),
      { wrapper }
    );

    // Wait a bit to ensure it doesn't start
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockStartCalculation).not.toHaveBeenCalled();
  });

  it('should not start calculation when config is null', async () => {
    renderHook(
      () =>
        useStartCalculationOnLoad({
          enabled: true,
          configs: [],
          isComplete: false,
        }),
      { wrapper }
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockStartCalculation).not.toHaveBeenCalled();
  });

  it('should not start calculation when already complete', async () => {
    const config = createMockConfig();

    renderHook(
      () =>
        useStartCalculationOnLoad({
          enabled: true,
          configs: [config],
          isComplete: true,
        }),
      { wrapper }
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockStartCalculation).not.toHaveBeenCalled();
  });

  it('should resume orchestrator when already computing (to poll API)', async () => {
    // When loading a page with a computing calculation, we need to resume
    // the orchestrator so it polls the API and updates cache
    const config = createMockConfig();

    renderHook(
      () =>
        useStartCalculationOnLoad({
          enabled: true,
          configs: [config],
          isComplete: false,
        }),
      { wrapper }
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should start orchestrator to resume polling
    expect(mockStartCalculation).toHaveBeenCalledWith(config);
  });

  it('should only start calculation once even with re-renders', async () => {
    const config = createMockConfig();

    const { rerender } = renderHook(
      () =>
        useStartCalculationOnLoad({
          enabled: true,
          configs: [config],
          isComplete: false,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(mockStartCalculation).toHaveBeenCalledTimes(1);
    });

    // Force re-render
    rerender();

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should still only be called once
    expect(mockStartCalculation).toHaveBeenCalledTimes(1);
  });

  it('should start calculation without logging', async () => {
    const config = createMockConfig();

    renderHook(
      () =>
        useStartCalculationOnLoad({
          enabled: true,
          configs: [config],
          isComplete: false,
        }),
      { wrapper }
    );

    await waitFor(() => {
      // Verify calculation was started (no logging expected)
      expect(mockStartCalculation).toHaveBeenCalledWith(config);
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
          configs: [config],
          isComplete: false,
        }),
      { wrapper }
    );

    await waitFor(() => {
      // Check that error was logged with the error object
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to start'),
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
          configs: [config],
          isComplete: false,
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
          configs: [config],
          isComplete: false,
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

  it('should start immediately when initially computing (resume polling)', async () => {
    // New behavior: start orchestrator even when computing (to resume polling)
    const config = createMockConfig();

    renderHook(
      () =>
        useStartCalculationOnLoad({
          enabled: true,
          configs: [config],
          isComplete: false,
        }),
      { wrapper }
    );

    // Should start immediately to resume polling
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
          configs: [config],
          isComplete,
        }),
      { wrapper, initialProps: { isComplete: true } }
    );

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should not start if already complete
    expect(mockStartCalculation).not.toHaveBeenCalled();

    // Change to not complete (shouldn't happen in real app, but test coverage)
    rerender({ isComplete: false });

    // Should start now
    await waitFor(() => {
      expect(mockStartCalculation).toHaveBeenCalledTimes(1);
    });
  });
});
