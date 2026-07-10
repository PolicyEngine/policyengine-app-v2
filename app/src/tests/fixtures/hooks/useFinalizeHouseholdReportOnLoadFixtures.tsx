import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';

export const FINALIZATION_IDS = {
  REPORT: 'report-finalize-on-load',
  BASELINE: 'simulation-baseline',
  REFORM: 'simulation-reform',
} as const;

export const PENDING_HOUSEHOLD_REPORT: Report = {
  id: FINALIZATION_IDS.REPORT,
  countryId: 'us',
  year: '2026',
  apiVersion: null,
  simulationIds: [FINALIZATION_IDS.BASELINE, FINALIZATION_IDS.REFORM],
  status: 'pending',
  outputType: 'household',
};

export const DURABLE_HOUSEHOLD_SIMULATIONS: Simulation[] = [
  {
    id: FINALIZATION_IDS.BASELINE,
    label: 'Current law',
    isCreated: true,
    status: 'complete',
    output: { people: { adult: { income_tax: { '2026': 100 } } } },
  },
  {
    id: FINALIZATION_IDS.REFORM,
    label: 'Reform',
    isCreated: true,
    status: 'complete',
    output: { people: { adult: { income_tax: { '2026': 80 } } } },
  },
];

export function createFinalizationTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}
