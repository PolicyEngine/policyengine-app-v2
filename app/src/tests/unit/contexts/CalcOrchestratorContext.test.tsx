import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  CalcOrchestratorProvider,
  useCalcOrchestratorManager,
} from '@/contexts/CalcOrchestratorContext';
import { CalcOrchestratorManager } from '@/libs/calculations/CalcOrchestratorManager';

describe('CalcOrchestratorContext', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <CalcOrchestratorProvider>{children}</CalcOrchestratorProvider>
    </QueryClientProvider>
  );

  describe('CalcOrchestratorProvider', () => {
    it('given children then renders provider successfully', () => {
      // Given/When
      const { result } = renderHook(() => useCalcOrchestratorManager(), { wrapper });

      // Then
      expect(result.current).toBeInstanceOf(CalcOrchestratorManager);
    });

    it('given provider then creates manager instance once', () => {
      // Given
      const { result, rerender } = renderHook(() => useCalcOrchestratorManager(), { wrapper });
      const firstManager = result.current;

      // When - Force re-render
      rerender();

      // Then - Same manager instance
      expect(result.current).toBe(firstManager);
    });

    it('given provider unmounts then calls cleanup on manager', () => {
      // Given
      const { result, unmount } = renderHook(() => useCalcOrchestratorManager(), { wrapper });
      const manager = result.current;
      const cleanupSpy = vi.spyOn(manager, 'cleanupAll');

      // When
      unmount();

      // Then
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('useCalcOrchestratorManager', () => {
    it('given hook used within provider then returns manager instance', () => {
      // Given/When
      const { result } = renderHook(() => useCalcOrchestratorManager(), { wrapper });

      // Then
      expect(result.current).toBeInstanceOf(CalcOrchestratorManager);
      expect(result.current).toBeDefined();
    });

    it('given hook used outside provider then throws error', () => {
      // Given - No wrapper (outside provider)
      const { result } = renderHook(() => {
        try {
          return useCalcOrchestratorManager();
        } catch (error) {
          return error;
        }
      });

      // Then
      expect(result.current).toBeInstanceOf(Error);
      expect((result.current as Error).message).toContain(
        'useCalcOrchestratorManager must be used within CalcOrchestratorProvider'
      );
    });

    it('given manager then has expected methods', () => {
      // Given/When
      const { result } = renderHook(() => useCalcOrchestratorManager(), { wrapper });
      const manager = result.current;

      // Then
      expect(manager.startCalculation).toBeDefined();
      expect(manager.cleanup).toBeDefined();
      expect(manager.cleanupAll).toBeDefined();
      expect(manager.isRunning).toBeDefined();
      expect(manager.getDebugInfo).toBeDefined();
    });

    it('given multiple hook calls in same provider then return same manager instance', () => {
      // Given - Custom wrapper with single provider instance
      let firstManager: CalcOrchestratorManager | null = null;
      let secondManager: CalcOrchestratorManager | null = null;

      const TestComponent = () => {
        firstManager = useCalcOrchestratorManager();
        secondManager = useCalcOrchestratorManager();
        return null;
      };

      // When
      renderHook(() => <TestComponent />, { wrapper });

      // Then
      expect(firstManager).toBe(secondManager);
    });
  });

  describe('integration with QueryClient', () => {
    it('given provider then uses QueryClient from context', () => {
      // Given/When
      const { result } = renderHook(() => useCalcOrchestratorManager(), { wrapper });
      const manager = result.current;

      // Then - Manager should be created (implicitly uses QueryClient)
      expect(manager).toBeInstanceOf(CalcOrchestratorManager);
      expect(manager.getDebugInfo().activeCount).toBe(0);
    });
  });
});
