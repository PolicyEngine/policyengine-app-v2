/**
 * Calculator App (app.policyengine.org)
 * Interactive policy simulation and analysis
 */
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import { MantineProvider } from '@mantine/core';
import { QueryNormalizerProvider } from '@normy/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Provider } from 'react-redux';
import { CalcOrchestratorProvider } from './contexts/CalcOrchestratorContext';
import { CalculatorRouter } from './CalculatorRouter';
import { store } from './store';
import { policyEngineTheme } from './theme';
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
    <Provider store={store}>
      <MantineProvider theme={policyEngineTheme}>
        <QueryNormalizerProvider
          queryClient={queryClient}
          normalizerConfig={{
            devLogging: import.meta.env.DEV,
          }}
        >
          <QueryClientProvider client={queryClient}>
            <CalcOrchestratorProvider>
              <CalculatorRouter />
              <ReactQueryDevtools initialIsOpen={false} />
            </CalcOrchestratorProvider>
          </QueryClientProvider>
        </QueryNormalizerProvider>
      </MantineProvider>
    </Provider>
  );
}
