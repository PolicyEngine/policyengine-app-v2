import { useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { HouseholdReportOrchestrator } from '@/libs/calculations/household';

/**
 * Hook to access the singleton household report orchestrator
 *
 * USAGE:
 * const orchestrator = useHouseholdReportOrchestrator();
 * orchestrator.startReport(config);
 *
 * WHY THIS EXISTS:
 * Provides React-friendly access to the singleton orchestrator.
 * Orchestrator persists across component lifecycles (runs in background).
 */
export function useHouseholdReportOrchestrator(): HouseholdReportOrchestrator {
  const queryClient = useQueryClient();
  const orchestratorRef = useRef<HouseholdReportOrchestrator | null>(null);

  if (!orchestratorRef.current) {
    orchestratorRef.current = HouseholdReportOrchestrator.getInstance(queryClient);
  }

  return orchestratorRef.current;
}
