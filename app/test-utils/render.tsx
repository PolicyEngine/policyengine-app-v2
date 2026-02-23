import { render as testingLibraryRender } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { TooltipProvider } from '../src/components/ui/tooltip';
import { AppProvider } from '../src/contexts/AppContext';
import { store } from '../src/store';

export function render(ui: React.ReactNode) {
  return testingLibraryRender(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <AppProvider mode="website">
        <ReduxProvider store={store}>
          <MemoryRouter>
            <TooltipProvider>{children}</TooltipProvider>
          </MemoryRouter>
        </ReduxProvider>
      </AppProvider>
    ),
  });
}
