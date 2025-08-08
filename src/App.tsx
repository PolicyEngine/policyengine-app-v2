import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Provider } from 'react-redux';
import { MantineProvider } from '@mantine/core';
import { Router } from './Router';
import { store } from './store';
import { policyEngineTheme } from './theme';

const queryClient = new QueryClient();

export default function App() {
  return (
    <Provider store={store}>
      <MantineProvider theme={policyEngineTheme}>
        <QueryClientProvider client={queryClient}>
          <Router />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </MantineProvider>
    </Provider>
  );
}
