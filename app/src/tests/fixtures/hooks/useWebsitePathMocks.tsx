import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppMode, AppProvider } from '@/contexts/AppContext';

/**
 * Test constants for useWebsitePath tests
 */
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

export const WEBSITE_URL = 'https://policyengine.org';

/**
 * Helper to create a wrapper with both AppContext and Router
 */
export function createWrapper(appMode: AppMode, countryId: string) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AppProvider mode={appMode}>
        <MemoryRouter initialEntries={[`/${countryId}`]}>
          <Routes>
            <Route path="/:countryId/*" element={children} />
            <Route path="/:countryId" element={children} />
          </Routes>
        </MemoryRouter>
      </AppProvider>
    );
  };
}
