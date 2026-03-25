import { render as testingLibraryRender } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { TooltipProvider } from '../src/components/ui/tooltip';
import { AppMode, AppProvider } from '../src/contexts/AppContext';
import { CountryProvider } from '../src/contexts/CountryContext';
import { LocationProvider } from '../src/contexts/LocationContext';
import { NavigationProvider } from '../src/contexts/NavigationContext';
import { store } from '../src/store';

function RouterContextBridge({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <NavigationProvider
      value={{
        push: (path: string) => navigate(path),
        replace: (path: string) => navigate(path, { replace: true }),
        back: () => navigate(-1),
      }}
    >
      <LocationProvider value={{ pathname: location.pathname, search: location.search }}>
        {children}
      </LocationProvider>
    </NavigationProvider>
  );
}

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
            <CountryProvider value={countryId as any}>
              <RouterContextBridge>
                <TooltipProvider>
                  <Routes>
                    <Route path="/:countryId" element={children} />
                    <Route path="/:countryId/*" element={children} />
                  </Routes>
                </TooltipProvider>
              </RouterContextBridge>
            </CountryProvider>
          </MemoryRouter>
        </ReduxProvider>
      </AppProvider>
    ),
  });
}
