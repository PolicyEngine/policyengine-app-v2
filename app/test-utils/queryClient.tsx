import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { countryKeys } from '../src/libs/queryKeys';
import { SOCIETY_WIDE_COUNTRIES } from '../src/tests/fixtures/api/countriesMocks';

/**
 * A query client for one rendered test: no retries, and the countries list
 * seeded with the US and the UK so components that read it never make a
 * network request.
 */
export function createTestQueryClient(): QueryClient {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(countryKeys.all, SOCIETY_WIDE_COUNTRIES);
  return queryClient;
}

export function TestQueryClientProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createTestQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
