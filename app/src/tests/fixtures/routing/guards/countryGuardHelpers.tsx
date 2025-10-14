/**
 * Test helpers for CountryGuard component tests
 *
 * Provides utility functions for creating Redux stores and rendering
 * CountryGuard with proper context providers
 */
import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import metadataReducer from '@/reducers/metadataReducer';
import { CountryGuard } from '@/routing/guards/CountryGuard';
import { TEST_CONTENT, TEST_IDS } from './countryGuardMocks';

/**
 * Helper to create a fresh Redux store for each test
 * Includes only the metadata reducer needed for CountryGuard tests
 */
export function createTestStore() {
  return configureStore({
    reducer: {
      metadata: metadataReducer,
    },
  });
}

/**
 * Helper to render CountryGuard with Redux provider and router context
 *
 * @param initialPath - The initial path to render (e.g., '/us/policies')
 * @returns Render result with store instance attached
 *
 * @example
 * ```typescript
 * const { getByTestId, store } = renderCountryGuardWithStore('/uk/policies');
 * expect(getByTestId('protected-content')).toBeDefined();
 * expect(store.getState().metadata.currentCountry).toBe('uk');
 * ```
 */
export function renderCountryGuardWithStore(initialPath: string) {
  const store = createTestStore();
  const result = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/:countryId" element={<CountryGuard />}>
            <Route
              path="*"
              element={<div data-testid={TEST_IDS.PROTECTED_CONTENT}>{TEST_CONTENT.PROTECTED}</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  return { ...result, store };
}

/**
 * Helper to render CountryGuard for root path testing (no countryId param)
 *
 * @param initialPath - The initial path to render (typically '/')
 * @returns Render result with store instance attached
 */
export function renderCountryGuardAtRoot(initialPath: string) {
  const store = createTestStore();
  const result = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/" element={<CountryGuard />}>
            <Route path="*" element={<div>{TEST_CONTENT.SHOULD_NOT_RENDER}</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  return { ...result, store };
}
