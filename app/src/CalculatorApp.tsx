/**
 * Calculator App (app.policyengine.org)
 * Interactive policy simulation and analysis
 */
import './app.css';

import { QueryNormalizerProvider } from '@normy/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Provider } from 'react-redux';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CalculatorRouter } from './CalculatorRouter';
import { AppProvider } from './contexts/AppContext';
import { CalcOrchestratorProvider } from './contexts/CalcOrchestratorContext';
import { store } from './store';
import { cacheMonitor } from './utils/cacheMonitor';

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
                <ReactQueryDevtools initialIsOpen={false} />
              </CalcOrchestratorProvider>
            </TooltipProvider>
          </QueryClientProvider>
        </QueryNormalizerProvider>
      </Provider>
    </AppProvider>
  );
}
