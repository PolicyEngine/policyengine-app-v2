import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import { Provider } from 'react-redux';
import { MantineProvider } from '@mantine/core';
import { Router } from './Router';
import { store } from './store';
import { theme } from './theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  return (
    <Provider store={store}>
      <MantineProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <Router />
        </QueryClientProvider>
      </MantineProvider>
    </Provider>
  );
}
