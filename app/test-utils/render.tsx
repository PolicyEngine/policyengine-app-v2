import { render as testingLibraryRender } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { TooltipProvider } from '../src/components/ui/tooltip';
import { AppProvider } from '../src/contexts/AppContext';
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

export function render(ui: React.ReactNode, countryId: string = 'us') {
  return testingLibraryRender(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <AppProvider mode="website">
        <ReduxProvider store={store}>
          <MemoryRouter>
            <CountryProvider value={countryId as any}>
              <RouterContextBridge>
                <TooltipProvider>{children}</TooltipProvider>
              </RouterContextBridge>
            </CountryProvider>
          </MemoryRouter>
        </ReduxProvider>
      </AppProvider>
    ),
  });
}
