import '@mantine/core/styles.css';

import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { addons } from '@storybook/preview-api';
import { DARK_MODE_EVENT_NAME } from 'storybook-dark-mode';
import { MantineProvider, useMantineColorScheme } from '@mantine/core';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '../src/contexts/AppContext';
import { store } from '../src/store';
import { policyEngineTheme as theme } from '../src/theme';

const channel = addons.getChannel();

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

function ColorSchemeWrapper({ children }: { children: React.ReactNode }) {
  const { setColorScheme } = useMantineColorScheme();
  const handleColorScheme = (value: boolean) => setColorScheme(value ? 'dark' : 'light');

  useEffect(() => {
    channel.on(DARK_MODE_EVENT_NAME, handleColorScheme);
    return () => channel.off(DARK_MODE_EVENT_NAME, handleColorScheme);
  }, [channel]);

  return children;
}

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
  (renderStory: any) => <ColorSchemeWrapper>{renderStory()}</ColorSchemeWrapper>,
  (renderStory: any) => <MantineProvider theme={theme}>{renderStory()}</MantineProvider>,
];
