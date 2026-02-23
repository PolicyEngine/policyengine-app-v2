/**
 * Test fixtures for AppPage component
 */

import { render as rtlRender } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { TooltipProvider } from '@/components/ui/tooltip';
import { store } from '@/store';
import { policyEngineTheme } from '@/theme';
import type { App } from '@/types/apps';

// Test app types
export const APP_TYPES = {
  STREAMLIT: 'streamlit',
  IFRAME: 'iframe',
  OBBBA_IFRAME: 'obbba-iframe',
} as const;

// Mock Streamlit app
export const MOCK_STREAMLIT_APP: App = {
  slug: 'test-streamlit-app',
  title: 'Test Streamlit App',
  description: 'A test Streamlit application',
  source: 'https://example.com/streamlit-app',
  tags: ['us', 'test'],
  countryId: 'us',
  type: APP_TYPES.STREAMLIT,
};

// Mock standard iframe app
export const MOCK_IFRAME_APP: App = {
  slug: 'test-iframe-app',
  title: 'Test Iframe App',
  description: 'A test iframe application',
  source: 'https://example.com/iframe-app',
  tags: ['us', 'test'],
  countryId: 'us',
  type: APP_TYPES.IFRAME,
};

// Mock OBBBA iframe app
export const MOCK_OBBBA_APP: App = {
  slug: 'test-obbba-app',
  title: 'Test OBBBA App',
  description: 'A test OBBBA iframe application',
  source: 'https://example.com/obbba-app',
  tags: ['us', 'test'],
  countryId: 'us',
  type: APP_TYPES.OBBBA_IFRAME,
};

// Mock iframe app with research display
export const MOCK_RESEARCH_IFRAME_APP: App = {
  slug: 'test-research-iframe',
  title: 'Test Research Iframe',
  description: 'A test iframe application displayed on research page',
  source: 'https://example.com/research-iframe',
  tags: ['us', 'test'],
  countryId: 'us',
  type: APP_TYPES.IFRAME,
  displayWithResearch: true,
  image: 'test-research-iframe.jpg',
  date: '2025-01-15',
  authors: ['test-author'],
};

// Mock apps list for testing
export const MOCK_APPS: App[] = [
  MOCK_STREAMLIT_APP,
  MOCK_IFRAME_APP,
  MOCK_OBBBA_APP,
  MOCK_RESEARCH_IFRAME_APP,
];

// Expected embed URLs
export const EXPECTED_EMBED_URLS = {
  STREAMLIT: `${MOCK_STREAMLIT_APP.source}?embedded=true`,
  IFRAME: MOCK_IFRAME_APP.source,
  OBBBA: MOCK_OBBBA_APP.source,
  RESEARCH_IFRAME: MOCK_RESEARCH_IFRAME_APP.source,
} as const;

// Helper to render with router for app tests
export const renderWithRouter = (ui: React.ReactElement, initialPath: string) => {
  return rtlRender(
    <Provider store={store}>
      <MantineProvider theme={policyEngineTheme} env="test">
        <TooltipProvider>
          <MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>
        </TooltipProvider>
      </MantineProvider>
    </Provider>
  );
};
