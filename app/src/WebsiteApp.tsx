/**
 * Website App (policyengine.org)
 * Homepage, blog, team, and embedded calculators
 */
import './app.css';

import { lazy, Suspense } from 'react';
import { QueryNormalizerProvider } from '@normy/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppProvider } from './contexts/AppContext';
import { store } from './store';
import { cacheMonitor } from './utils/cacheMonitor';
import { WebsiteRouter } from './WebsiteRouter';

const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

cacheMonitor.init(queryClient);

export default function WebsiteApp() {
  return (
    <AppProvider mode="website">
      <Provider store={store}>
        <QueryNormalizerProvider
          queryClient={queryClient}
          normalizerConfig={{
            devLogging: import.meta.env.DEV,
          }}
        >
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <WebsiteRouter />
            </TooltipProvider>
            {import.meta.env.DEV && (
              <Suspense>
                <ReactQueryDevtools initialIsOpen={false} />
              </Suspense>
            )}
          </QueryClientProvider>
        </QueryNormalizerProvider>
      </Provider>
    </AppProvider>
  );
}
