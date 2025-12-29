import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render as testingLibraryRender } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { store } from '../src/store';
import { policyEngineTheme } from '../src/theme';

// Create a fresh QueryClient for each test to avoid shared state
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in tests for faster failures
        retry: false,
        // Disable caching in tests to ensure fresh data
        staleTime: 0,
      },
    },
  });
}

export function render(ui: React.ReactNode) {
  const testQueryClient = createTestQueryClient();

  return testingLibraryRender(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={testQueryClient}>
        <ReduxProvider store={store}>
          <MemoryRouter>
            <MantineProvider theme={policyEngineTheme} env="test">
              {children}
            </MantineProvider>
          </MemoryRouter>
        </ReduxProvider>
      </QueryClientProvider>
    ),
  });
}
