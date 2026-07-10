import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CalcStatus } from '@/types/calculation';

export const SIMULATION_PROGRESS_ID = 'simulation-progress-1';

export function createSimulationProgressQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}

export function createSimulationProgressWrapper(queryClient: QueryClient) {
  return function SimulationProgressWrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

export function createSimulationProgressStatus(status: CalcStatus['status']): CalcStatus {
  return {
    status,
    metadata: {
      calcId: SIMULATION_PROGRESS_ID,
      calcType: 'household',
      targetType: 'simulation',
      startedAt: Date.now(),
    },
  };
}
