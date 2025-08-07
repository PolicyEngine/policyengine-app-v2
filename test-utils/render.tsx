import { render as testingLibraryRender } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { MantineProvider } from '@mantine/core';
import { store } from '../src/store';
import { theme } from '../src/theme';

export function render(ui: React.ReactNode) {
  return testingLibraryRender(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ReduxProvider store={store}>
        <MantineProvider theme={theme} env="test">
          {children}
        </MantineProvider>
      </ReduxProvider>
    ),
  });
}
