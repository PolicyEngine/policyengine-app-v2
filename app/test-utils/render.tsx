import { render as testingLibraryRender } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { TooltipProvider } from '../src/components/ui/tooltip';
import { AppProvider } from '../src/contexts/AppContext';
import { CountryProvider } from '../src/contexts/CountryContext';
import { store } from '../src/store';

export function render(ui: React.ReactNode, countryId: string = 'us') {
  return testingLibraryRender(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <AppProvider mode="website">
        <ReduxProvider store={store}>
          <MemoryRouter>
            <CountryProvider value={countryId as any}>
              <TooltipProvider>{children}</TooltipProvider>
            </CountryProvider>
          </MemoryRouter>
        </ReduxProvider>
      </AppProvider>
    ),
  });
}
