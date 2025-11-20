/**
 * Tests for AppPage component
 */

import { describe, test, expect } from 'vitest';
import { render, screen } from '@test-utils';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AppPage from '@/pages/AppPage';
import {
  MOCK_STREAMLIT_APP,
  MOCK_IFRAME_APP,
  MOCK_OBBBA_APP,
  MOCK_APPLET_APP,
  setupAppPageMocks,
} from '@/tests/fixtures/pages/appPageHelpers';

// Setup mocks
setupAppPageMocks();

describe('AppPage', () => {

  test('given streamlit app then renders StreamlitEmbed', () => {
    // Given: Streamlit app route
    render(
      <MemoryRouter initialEntries={[`/us/${MOCK_STREAMLIT_APP.slug}`]}>
        <Routes>
          <Route path="/:countryId/:slug" element={<AppPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Then: StreamlitEmbed is rendered
    expect(screen.getByTestId('streamlit-embed')).toBeInTheDocument();
    expect(screen.getByText(MOCK_STREAMLIT_APP.title)).toBeInTheDocument();
  });

  test('given iframe app then renders IframeContent', () => {
    // Given: Standard iframe app route
    render(
      <MemoryRouter initialEntries={[`/us/${MOCK_IFRAME_APP.slug}`]}>
        <Routes>
          <Route path="/:countryId/:slug" element={<AppPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Then: IframeContent is rendered
    expect(screen.getByTestId('iframe-content')).toBeInTheDocument();
    expect(screen.getByText(MOCK_IFRAME_APP.title)).toBeInTheDocument();
  });

  test('given obbba-iframe app then renders OBBBAIframeContent', () => {
    // Given: OBBBA iframe app route
    render(
      <MemoryRouter initialEntries={[`/us/${MOCK_OBBBA_APP.slug}`]}>
        <Routes>
          <Route path="/:countryId/:slug" element={<AppPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Then: OBBBAIframeContent is rendered
    expect(screen.getByTestId('obbba-embed')).toBeInTheDocument();
    expect(screen.getByText(MOCK_OBBBA_APP.title)).toBeInTheDocument();
  });

  test('given applet type then renders IframeContent', () => {
    // Given: Applet app route
    render(
      <MemoryRouter initialEntries={[`/us/${MOCK_APPLET_APP.slug}`]}>
        <Routes>
          <Route path="/:countryId/:slug" element={<AppPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Then: IframeContent is rendered (applets use iframe)
    expect(screen.getByTestId('iframe-content')).toBeInTheDocument();
    expect(screen.getByText(MOCK_APPLET_APP.title)).toBeInTheDocument();
  });

  test('given non-existent app then shows 404 message', () => {
    // Given: Non-existent app slug
    const nonExistentSlug = 'non-existent-app';

    render(
      <MemoryRouter initialEntries={[`/us/${nonExistentSlug}`]}>
        <Routes>
          <Route path="/:countryId/:slug" element={<AppPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Then: 404 message is displayed
    expect(screen.getByText('App not found')).toBeInTheDocument();
    expect(screen.getByText(`The app "${nonExistentSlug}" could not be found.`)).toBeInTheDocument();
  });

  test('given applet with research metadata then renders correctly', () => {
    // Given: Applet with displayWithResearch flag
    render(
      <MemoryRouter initialEntries={[`/us/${MOCK_APPLET_APP.slug}`]}>
        <Routes>
          <Route path="/:countryId/:slug" element={<AppPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Then: Content is rendered (metadata doesn't affect rendering)
    expect(screen.getByTestId('iframe-content')).toBeInTheDocument();
    expect(screen.getByText(MOCK_APPLET_APP.title)).toBeInTheDocument();
  });
});
