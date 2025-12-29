import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render as testingLibraryRender } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { store } from '../src/store';
import { policyEngineTheme } from '../src/theme';

// Create a fresh QueryClient for each test to avoid shared state
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
}

export function renderWithCountry(
  ui: React.ReactNode,
  countryId: string = 'us',
  path: string = `/${countryId}`
) {
  const testQueryClient = createTestQueryClient();

  return testingLibraryRender(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={testQueryClient}>
        <ReduxProvider store={store}>
          <MemoryRouter initialEntries={[path]}>
            <MantineProvider theme={policyEngineTheme} env="test">
              <Routes>
                <Route path="/:countryId" element={children} />
                <Route path="/:countryId/*" element={children} />
              </Routes>
            </MantineProvider>
          </MemoryRouter>
        </ReduxProvider>
      </QueryClientProvider>
    ),
  });
}
