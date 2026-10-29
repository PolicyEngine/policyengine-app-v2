import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { CountryProvider } from '@/contexts/CountryContext';
import { clearMetadata, fetchMetadataThunk, metadataRequest } from '@/reducers/metadataReducer';
import { store } from '@/store';

/** A fresh query client per test, retrying nothing, so a failure shows at once. */
export function testQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
}

export function v3Wrapper(queryClient: QueryClient = testQueryClient()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <CountryProvider value="us">{children}</CountryProvider>
        </QueryClientProvider>
      </Provider>
    );
  };
}

/** The store with v2 model metadata loaded, as v3 has it after the switch. */
export async function seedV2ModelCatalog(): Promise<void> {
  store.dispatch(clearMetadata());
  await store.dispatch(fetchMetadataThunk(metadataRequest('us', 'v2')));
}
