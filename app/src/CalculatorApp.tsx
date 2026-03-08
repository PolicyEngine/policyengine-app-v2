/**
 * Calculator App (app.policyengine.org)
 * Interactive policy simulation and analysis
 */
import './app.css';

import { lazy, Suspense } from 'react';
import { QueryNormalizerProvider } from '@normy/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CalculatorRouter } from './CalculatorRouter';
import { AppProvider } from './contexts/AppContext';
import { CalcOrchestratorProvider } from './contexts/CalcOrchestratorContext';
import { store } from './store';
import { cacheMonitor } from './utils/cacheMonitor';

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

export default function CalculatorApp() {
  return (
    <AppProvider mode="calculator">
      <Provider store={store}>
        <QueryNormalizerProvider
          queryClient={queryClient}
          normalizerConfig={{
            devLogging: import.meta.env.DEV,
          }}
        >
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <CalcOrchestratorProvider>
                <CalculatorRouter />
                {import.meta.env.DEV && (
                  <Suspense>
                    <ReactQueryDevtools initialIsOpen={false} />
                  </Suspense>
                )}
              </CalcOrchestratorProvider>
            </TooltipProvider>
          </QueryClientProvider>
        </QueryNormalizerProvider>
      </Provider>
    </AppProvider>
  );
}
