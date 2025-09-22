/**
 * Test fixtures for useCurrentCountry hook tests
 *
 * Provides router wrapper and test constants for testing country extraction from URL
 */
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Test constants
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
  NG: 'ng',
  IL: 'il',
} as const;

export const INVALID_COUNTRY = 'invalid-country';

// Test paths
export const TEST_PATHS = {
  UK_POLICIES: '/uk/policies',
  US_HOUSEHOLD: '/us/household',
  CA_ABOUT: '/ca/about',
  INVALID_COUNTRY_POLICIES: `/${INVALID_COUNTRY}/policies`,
  ROOT: '/',
} as const;

// Wrapper component that provides router context
export function createRouterWrapper(initialPath: string) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/:countryId/*" element={children} />
          <Route path="/*" element={children} />
        </Routes>
      </MemoryRouter>
    );
  };
}
