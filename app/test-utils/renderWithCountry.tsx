import { render as testingLibraryRender } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TooltipProvider } from '../src/components/ui/tooltip';
import { AppMode, AppProvider } from '../src/contexts/AppContext';
import { store } from '../src/store';

export function renderWithCountry(
  ui: React.ReactNode,
  countryId: string = 'us',
  path: string = `/${countryId}`,
  appMode: AppMode = 'website'
) {
  return testingLibraryRender(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <AppProvider mode={appMode}>
        <ReduxProvider store={store}>
          <MemoryRouter initialEntries={[path]}>
            <TooltipProvider>
              <Routes>
                <Route path="/:countryId" element={children} />
                <Route path="/:countryId/*" element={children} />
              </Routes>
            </TooltipProvider>
          </MemoryRouter>
        </ReduxProvider>
      </AppProvider>
    ),
  });
}
