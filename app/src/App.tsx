import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import { QueryNormalizerProvider } from '@normy/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Provider } from 'react-redux';
import { MantineProvider } from '@mantine/core';
import { CalcOrchestratorProvider } from './contexts/CalcOrchestratorContext';
import { Router } from './Router';
import { store } from './store';
import { policyEngineTheme } from './theme';

const queryClient = new QueryClient(
  // Temporarily set default staletime to Infinity for all queries;
  // determine how to address later
  {
    defaultOptions: {
      queries: {
        staleTime: Infinity,
      },
    },
  }
);

export default function App() {
  return (
    <Provider store={store}>
      <MantineProvider theme={policyEngineTheme}>
        <QueryNormalizerProvider
          queryClient={queryClient}
          normalizerConfig={{
            devLogging: true,
          }}
        >
          <QueryClientProvider client={queryClient}>
            <CalcOrchestratorProvider>
              <Router />
              <ReactQueryDevtools initialIsOpen={false} />
            </CalcOrchestratorProvider>
          </QueryClientProvider>
        </QueryNormalizerProvider>
      </MantineProvider>
    </Provider>
  );
}
