import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalcOrchestrator } from '@/libs/calculations/CalcOrchestrator';
import { ResultPersister } from '@/libs/calculations/ResultPersister';
import type { CalcStartConfig } from '@/types/calculation';

/**
 * Hook to start a calculation
 * Provides a mutation interface for initiating calculations with auto-persistence
 */
export function useStartCalculation() {
  const queryClient = useQueryClient();

  // Memoize orchestrator to prevent recreation on every render
  const orchestrator = useMemo(
    () => new CalcOrchestrator(queryClient, new ResultPersister(queryClient)),
    [queryClient]
  );

  return useMutation({
    mutationFn: async (config: CalcStartConfig) => {
      console.log('[useStartCalculation] Starting calculation:', config.calcId);
      await orchestrator.startCalculation(config);
    },
    onError: (error) => {
      console.error('[useStartCalculation] Failed to start calculation:', error);
    },
    onSuccess: (_, config) => {
      console.log('[useStartCalculation] Calculation started successfully:', config.calcId);
    },
  });
}
