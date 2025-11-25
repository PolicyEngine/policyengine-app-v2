/**
 * Tests for CountryAppGuard component
 */

import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import { CountryAppGuard } from '@/routing/guards/CountryAppGuard';
import {
  renderWithRouter,
  TEST_APP_SLUGS,
  TEST_COUNTRIES,
} from '@/tests/fixtures/routing/guards/countryAppGuardHelpers';

// Mock must be at top level before imports - define inline to avoid hoisting issues
vi.mock('@/data/apps/appTransformers', () => ({
  apps: [
    {
      slug: 'test-us-app',
      title: 'Test US App',
      description: 'A test app for US',
      source: 'https://example.com/us-app',
      tags: ['us', 'test'],
      countryId: 'us',
      type: 'streamlit',
    },
    {
      slug: 'test-uk-app',
      title: 'Test UK App',
      description: 'A test app for UK',
      source: 'https://example.com/uk-app',
      tags: ['uk', 'test'],
      countryId: 'uk',
      type: 'iframe',
    },
    {
      slug: 'test-research-app',
      title: 'Test Research App',
      description: 'A test app with research display',
      source: 'https://example.com/research-app',
      tags: ['us', 'test'],
      countryId: 'us',
      type: 'iframe',
      displayWithResearch: true,
      image: 'test-image.jpg',
      date: '2025-01-01',
      authors: ['test-author'],
    },
  ],
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
