/**
 * Website App (policyengine.org)
 * Homepage, blog, team, and embedded calculators
 */
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import { QueryNormalizerProvider } from '@normy/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Provider } from 'react-redux';
import { MantineProvider } from '@mantine/core';
import { AppProvider } from './contexts/AppContext';
import { store } from './store';
import { policyEngineTheme } from './theme';
import { cacheMonitor } from './utils/cacheMonitor';
import { WebsiteRouter } from './WebsiteRouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

// Initialize cache monitor
cacheMonitor.init(queryClient);

export default function WebsiteApp() {
  return (
    <AppProvider mode="website">
      <Provider store={store}>
        <MantineProvider theme={policyEngineTheme}>
          <QueryNormalizerProvider
            queryClient={queryClient}
            normalizerConfig={{
              devLogging: true,
            }}
          >
            <QueryClientProvider client={queryClient}>
              <WebsiteRouter />
              <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
          </QueryNormalizerProvider>
        </MantineProvider>
      </Provider>
    </AppProvider>
  );
}
