/**
 * Calculator App (app.policyengine.org)
 * Interactive policy simulation and analysis
 */
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import { QueryNormalizerProvider } from '@normy/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Provider } from 'react-redux';
import { MantineProvider } from '@mantine/core';
import { CalculatorRouter } from './CalculatorRouter';
import { CalcOrchestratorProvider } from './contexts/CalcOrchestratorContext';
import { useV1Migration } from './hooks/useV1Migration';
import { store } from './store';
import { policyEngineTheme } from './theme';
import { cacheMonitor } from './utils/cacheMonitor';

/** Runs v1→v2 association migration in the background on app startup */
function MigrationRunner() {
  useV1Migration();
  return null;
}

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
              <MigrationRunner />
              <CalculatorRouter />
              <ReactQueryDevtools initialIsOpen={false} />
            </CalcOrchestratorProvider>
          </QueryClientProvider>
        </QueryNormalizerProvider>
      </MantineProvider>
    </Provider>
  );
}
