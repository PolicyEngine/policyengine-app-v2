/**
 * Tests for CountryAppGuard component
 */

import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import { CountryAppGuard } from '@/routing/guards/CountryAppGuard';
import {
  MOCK_APPS,
  renderWithRouter,
  TEST_APP_SLUGS,
  TEST_COUNTRIES,
} from '@/tests/fixtures/routing/guards/countryAppGuardHelpers';

// Mock must be at top level before imports
vi.mock('@/data/apps/appTransformers', () => ({
  apps: MOCK_APPS,
}));

describe('CountryAppGuard', () => {
  test('given matching country then renders outlet', () => {
    // Given: US app accessed from US route
    renderWithRouter(
      <Routes>
        <Route path="/:countryId/:slug" element={<CountryAppGuard />}>
          <Route index element={<div>App Content</div>} />
        </Route>
      </Routes>,
      `/${TEST_COUNTRIES.US}/${TEST_APP_SLUGS.US_APP}`
    );

    // Then: Content is rendered
    expect(screen.getByText('App Content')).toBeInTheDocument();
  });

  test('given mismatched country then redirects to correct country', async () => {
    // Given: US app accessed from UK route
    renderWithRouter(
      <Routes>
        <Route path="/:countryId/:slug" element={<CountryAppGuard />}>
          <Route index element={<div>Wrong Country Content</div>} />
        </Route>
        <Route
          path={`/${TEST_COUNTRIES.US}/${TEST_APP_SLUGS.US_APP}`}
          element={<div>Correct Country Content</div>}
        />
      </Routes>,
      `/${TEST_COUNTRIES.UK}/${TEST_APP_SLUGS.US_APP}`
    );

    // Then: Navigates to the correct country route (MemoryRouter follows redirects)
    await waitFor(() => {
      expect(screen.getByText('Correct Country Content')).toBeInTheDocument();
    });
    expect(screen.queryByText('Wrong Country Content')).not.toBeInTheDocument();
  });

  test('given non-existent app then renders outlet for 404 handling', () => {
    // Given: Non-existent app slug
    renderWithRouter(
      <Routes>
        <Route path="/:countryId/:slug" element={<CountryAppGuard />}>
          <Route index element={<div>404 Handler</div>} />
        </Route>
      </Routes>,
      `/${TEST_COUNTRIES.US}/${TEST_APP_SLUGS.NON_EXISTENT}`
    );

    // Then: Allows outlet to render (AppPage will handle 404)
    expect(screen.getByText('404 Handler')).toBeInTheDocument();
  });

  test('given UK app accessed from UK then renders outlet', () => {
    // Given: UK app accessed from UK route
    renderWithRouter(
      <Routes>
        <Route path="/:countryId/:slug" element={<CountryAppGuard />}>
          <Route index element={<div>UK App Content</div>} />
        </Route>
      </Routes>,
      `/${TEST_COUNTRIES.UK}/${TEST_APP_SLUGS.UK_APP}`
    );

    // Then: Content is rendered
    expect(screen.getByText('UK App Content')).toBeInTheDocument();
  });

  test('given UK app accessed from US then redirects to UK', async () => {
    // Given: UK app accessed from US route
    renderWithRouter(
      <Routes>
        <Route path="/:countryId/:slug" element={<CountryAppGuard />}>
          <Route index element={<div>Wrong Country Content</div>} />
        </Route>
        <Route
          path={`/${TEST_COUNTRIES.UK}/${TEST_APP_SLUGS.UK_APP}`}
          element={<div>UK Correct Content</div>}
        />
      </Routes>,
      `/${TEST_COUNTRIES.US}/${TEST_APP_SLUGS.UK_APP}`
    );

    // Then: Navigates to the correct UK route
    await waitFor(() => {
      expect(screen.getByText('UK Correct Content')).toBeInTheDocument();
    });
    expect(screen.queryByText('Wrong Country Content')).not.toBeInTheDocument();
  });
});
