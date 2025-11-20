/**
 * Tests for CountryAppGuard component
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen } from '@test-utils';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CountryAppGuard } from '@/routing/guards/CountryAppGuard';
import {
  TEST_COUNTRIES,
  TEST_APP_SLUGS,
  setupAppTransformersMock,
} from '@/tests/fixtures/routing/guards/countryAppGuardHelpers';

// Setup mocks
setupAppTransformersMock();

describe('CountryAppGuard', () => {
  beforeEach(() => {
    // Test-specific setup can go here if needed
  });

  test('given matching country then renders outlet', () => {
    // Given: US app accessed from US route
    render(
      <MemoryRouter initialEntries={[`/${TEST_COUNTRIES.US}/${TEST_APP_SLUGS.US_APP}`]}>
        <Routes>
          <Route path="/:countryId/:slug" element={<CountryAppGuard />}>
            <Route index element={<div>App Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Then: Content is rendered
    expect(screen.getByText('App Content')).toBeInTheDocument();
  });

  test('given mismatched country then redirects to correct country', () => {
    // Given: US app accessed from UK route
    render(
      <MemoryRouter initialEntries={[`/${TEST_COUNTRIES.UK}/${TEST_APP_SLUGS.US_APP}`]}>
        <Routes>
          <Route path="/:countryId/:slug" element={<CountryAppGuard />}>
            <Route index element={<div>App Content</div>} />
          </Route>
          <Route path={`/${TEST_COUNTRIES.US}/${TEST_APP_SLUGS.US_APP}`} element={<div>Redirected</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Then: Redirects to correct country
    expect(screen.getByText('Redirected')).toBeInTheDocument();
  });

  test('given non-existent app then renders outlet for 404 handling', () => {
    // Given: Non-existent app slug
    render(
      <MemoryRouter initialEntries={[`/${TEST_COUNTRIES.US}/${TEST_APP_SLUGS.NON_EXISTENT}`]}>
        <Routes>
          <Route path="/:countryId/:slug" element={<CountryAppGuard />}>
            <Route index element={<div>404 Handler</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Then: Allows outlet to render (AppPage will handle 404)
    expect(screen.getByText('404 Handler')).toBeInTheDocument();
  });

  test('given UK app accessed from UK then renders outlet', () => {
    // Given: UK app accessed from UK route
    render(
      <MemoryRouter initialEntries={[`/${TEST_COUNTRIES.UK}/${TEST_APP_SLUGS.UK_APP}`]}>
        <Routes>
          <Route path="/:countryId/:slug" element={<CountryAppGuard />}>
            <Route index element={<div>UK App Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Then: Content is rendered
    expect(screen.getByText('UK App Content')).toBeInTheDocument();
  });

  test('given UK app accessed from US then redirects to UK', () => {
    // Given: UK app accessed from US route
    render(
      <MemoryRouter initialEntries={[`/${TEST_COUNTRIES.US}/${TEST_APP_SLUGS.UK_APP}`]}>
        <Routes>
          <Route path="/:countryId/:slug" element={<CountryAppGuard />}>
            <Route index element={<div>App Content</div>} />
          </Route>
          <Route path={`/${TEST_COUNTRIES.UK}/${TEST_APP_SLUGS.UK_APP}`} element={<div>Redirected to UK</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Then: Redirects to UK
    expect(screen.getByText('Redirected to UK')).toBeInTheDocument();
  });
});
