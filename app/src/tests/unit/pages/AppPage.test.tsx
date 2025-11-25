/**
 * Tests for AppPage component
 */

import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import AppPage from '@/pages/AppPage';
import { renderWithRouter } from '@/tests/fixtures/pages/appPageHelpers';

// Mocks must be at top level before component imports
vi.mock('@/data/apps/appTransformers', () => ({
  apps: [
    {
      slug: 'test-streamlit-app',
      title: 'Test Streamlit App',
      description: 'A test Streamlit application',
      source: 'https://example.com/streamlit-app',
      tags: ['us', 'test'],
      countryId: 'us',
      type: 'streamlit',
    },
    {
      slug: 'test-iframe-app',
      title: 'Test Iframe App',
      description: 'A test iframe application',
      source: 'https://example.com/iframe-app',
      tags: ['us', 'test'],
      countryId: 'us',
      type: 'iframe',
    },
    {
      slug: 'test-obbba-app',
      title: 'Test OBBBA App',
      description: 'A test OBBBA iframe application',
      source: 'https://example.com/obbba-app',
      tags: ['us', 'test'],
      countryId: 'us',
      type: 'obbba-iframe',
    },
    {
      slug: 'test-research-iframe',
      title: 'Test Research Iframe',
      description: 'A test iframe application displayed on research page',
      source: 'https://example.com/research-iframe',
      tags: ['us', 'test'],
      countryId: 'us',
      type: 'iframe',
      displayWithResearch: true,
      image: 'test-research-iframe.jpg',
      date: '2025-01-15',
      authors: ['test-author'],
    },
  ],
}));

// Define test constants after imports
const MOCK_STREAMLIT_APP = {
  slug: 'test-streamlit-app',
  title: 'Test Streamlit App',
};

const MOCK_IFRAME_APP = {
  slug: 'test-iframe-app',
  title: 'Test Iframe App',
};

const MOCK_OBBBA_APP = {
  slug: 'test-obbba-app',
  title: 'Test OBBBA App',
};

const MOCK_RESEARCH_IFRAME_APP = {
  slug: 'test-research-iframe',
  title: 'Test Research Iframe',
};

vi.mock('@/components/interactive', () => ({
  StreamlitEmbed: vi.fn(({ title }) => <div data-testid="streamlit-embed">{title}</div>),
  OBBBAIframeContent: vi.fn(({ title }) => <div data-testid="obbba-embed">{title}</div>),
}));

vi.mock('@/components/IframeContent', () => ({
  default: vi.fn(({ title }) => <div data-testid="iframe-content">{title}</div>),
}));

describe('AppPage', () => {
  test('given streamlit app then renders StreamlitEmbed', () => {
    // Given: Streamlit app route
    renderWithRouter(
      <Routes>
        <Route path="/:countryId/:slug" element={<AppPage />} />
      </Routes>,
      `/us/${MOCK_STREAMLIT_APP.slug}`
    );

    // Then: StreamlitEmbed is rendered
    expect(screen.getByTestId('streamlit-embed')).toBeInTheDocument();
    expect(screen.getByText(MOCK_STREAMLIT_APP.title)).toBeInTheDocument();
  });

  test('given iframe app then renders IframeContent', () => {
    // Given: Standard iframe app route
    renderWithRouter(
      <Routes>
        <Route path="/:countryId/:slug" element={<AppPage />} />
      </Routes>,
      `/us/${MOCK_IFRAME_APP.slug}`
    );

    // Then: IframeContent is rendered
    expect(screen.getByTestId('iframe-content')).toBeInTheDocument();
    expect(screen.getByText(MOCK_IFRAME_APP.title)).toBeInTheDocument();
  });

  test('given obbba-iframe app then renders OBBBAIframeContent', () => {
    // Given: OBBBA iframe app route
    renderWithRouter(
      <Routes>
        <Route path="/:countryId/:slug" element={<AppPage />} />
      </Routes>,
      `/us/${MOCK_OBBBA_APP.slug}`
    );

    // Then: OBBBAIframeContent is rendered
    expect(screen.getByTestId('obbba-embed')).toBeInTheDocument();
    expect(screen.getByText(MOCK_OBBBA_APP.title)).toBeInTheDocument();
  });

  test('given iframe app with displayWithResearch then renders IframeContent', () => {
    // Given: Iframe app with research metadata
    renderWithRouter(
      <Routes>
        <Route path="/:countryId/:slug" element={<AppPage />} />
      </Routes>,
      `/us/${MOCK_RESEARCH_IFRAME_APP.slug}`
    );

    // Then: IframeContent is rendered (metadata doesn't affect rendering)
    expect(screen.getByTestId('iframe-content')).toBeInTheDocument();
    expect(screen.getByText(MOCK_RESEARCH_IFRAME_APP.title)).toBeInTheDocument();
  });

  test('given non-existent app then shows 404 message', () => {
    // Given: Non-existent app slug
    const nonExistentSlug = 'non-existent-app';

    renderWithRouter(
      <Routes>
        <Route path="/:countryId/:slug" element={<AppPage />} />
      </Routes>,
      `/us/${nonExistentSlug}`
    );

    // Then: 404 message is displayed
    expect(screen.getByText('App not found')).toBeInTheDocument();
    expect(
      screen.getByText(`The app "${nonExistentSlug}" could not be found.`)
    ).toBeInTheDocument();
  });
});
