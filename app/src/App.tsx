import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

import { QueryNormalizerProvider } from '@normy/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
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
        <Notifications />
        <QueryNormalizerProvider queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Router />
          </QueryClientProvider>
        </QueryNormalizerProvider>
      </MantineProvider>
    </Provider>
  );
}
