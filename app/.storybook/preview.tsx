import '../src/app.css';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '../src/contexts/AppContext';
import { store } from '../src/store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      retry: false,
    },
  },
});

export const parameters = {
  layout: 'fullscreen',
  options: {
    showPanel: false,
    storySort: (a, b) => {
      return a.title.localeCompare(b.title, undefined, { numeric: true });
    },
  },
};

export const decorators = [
  (Story: React.ComponentType) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppProvider mode="website">
          <MemoryRouter initialEntries={['/us/reports']}>
            <Routes>
              <Route path="/:countryId/*" element={<Story />} />
            </Routes>
          </MemoryRouter>
        </AppProvider>
      </QueryClientProvider>
    </Provider>
  ),
];
