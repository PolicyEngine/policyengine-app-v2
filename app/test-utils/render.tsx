import { render as testingLibraryRender } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { TooltipProvider } from '../src/components/ui/tooltip';
import { AppProvider } from '../src/contexts/AppContext';
import { store } from '../src/store';
import { policyEngineTheme } from '../src/theme';

export function render(ui: React.ReactNode) {
  return testingLibraryRender(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <AppProvider mode="website">
        <ReduxProvider store={store}>
          <MemoryRouter>
            <MantineProvider theme={policyEngineTheme} env="test">
              <TooltipProvider>{children}</TooltipProvider>
            </MantineProvider>
          </MemoryRouter>
        </ReduxProvider>
      </AppProvider>
    ),
  });
}
