import { createContext, useContext, useMemo, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalcOrchestratorManager } from '@/libs/calculations/CalcOrchestratorManager';

/**
 * Context for CalcOrchestratorManager
 *
 * SCOPE: Application-level - single manager instance for entire app
 *
 * WHY: Manager needs to live at app level to coordinate orchestrators
 * across all components. If each component created its own manager,
 * we'd be back to the duplicate orchestrator problem.
 */
const CalcOrchestratorContext = createContext<CalcOrchestratorManager | null>(null);

interface CalcOrchestratorProviderProps {
  children: ReactNode;
}

/**
 * Provider for CalcOrchestratorManager
 *
 * USAGE: Wrap your app root with this provider:
 *
 * ```tsx
 * <QueryClientProvider client={queryClient}>
 *   <CalcOrchestratorProvider>
 *     <App />
 *   </CalcOrchestratorProvider>
 * </QueryClientProvider>
 * ```
 */
export function CalcOrchestratorProvider({ children }: CalcOrchestratorProviderProps) {
  const queryClient = useQueryClient();

  console.log('[CalcOrchestratorProvider] Rendering provider');

  // Create manager once per app lifetime
  const manager = useMemo(() => {
    console.log('[CalcOrchestratorProvider] → Creating new CalcOrchestratorManager instance');
    return new CalcOrchestratorManager(queryClient);
  }, [queryClient]);

  // Cleanup on unmount (when app closes)
  useEffect(() => {
    console.log('[CalcOrchestratorProvider] Provider mounted');

    return () => {
      console.log('[CalcOrchestratorProvider] Provider unmounting → cleaning up all orchestrators');
      manager.cleanupAll();
    };
  }, [manager]);

  return (
    <CalcOrchestratorContext.Provider value={manager}>
      {children}
    </CalcOrchestratorContext.Provider>
  );
}

/**
 * Hook to access CalcOrchestratorManager
 *
 * USAGE:
 * ```tsx
 * const manager = useCalcOrchestratorManager();
 * await manager.startCalculation(config);
 * ```
 *
 * @throws Error if used outside CalcOrchestratorProvider
 */
export function useCalcOrchestratorManager(): CalcOrchestratorManager {
  const manager = useContext(CalcOrchestratorContext);

  if (!manager) {
    const error = new Error(
      'useCalcOrchestratorManager must be used within CalcOrchestratorProvider. ' +
      'Wrap your app with <CalcOrchestratorProvider>.'
    );
    console.error('[useCalcOrchestratorManager] ❌', error.message);
    throw error;
  }

  return manager;
}
