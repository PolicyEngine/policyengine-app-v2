/**
 * Test fixtures for AppPage component
 */

import { vi } from 'vitest';
import type { App } from '@/types/apps';

// Test app types
export const APP_TYPES = {
  STREAMLIT: 'streamlit',
  IFRAME: 'iframe',
  OBBBA_IFRAME: 'obbba-iframe',
  APPLET: 'applet',
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

// Mock applet
export const MOCK_APPLET_APP: App = {
  slug: 'test-applet',
  title: 'Test Applet',
  description: 'A test applet application',
  source: 'https://example.com/applet',
  tags: ['us', 'test'],
  countryId: 'us',
  type: APP_TYPES.APPLET,
  displayWithResearch: true,
  image: 'test-applet.jpg',
  date: '2025-01-15',
  authors: ['test-author'],
};

// Mock apps list for testing
export const MOCK_APPS: App[] = [
  MOCK_STREAMLIT_APP,
  MOCK_IFRAME_APP,
  MOCK_OBBBA_APP,
  MOCK_APPLET_APP,
];

// Expected embed URLs
export const EXPECTED_EMBED_URLS = {
  STREAMLIT: `${MOCK_STREAMLIT_APP.source}?embedded=true`,
  IFRAME: MOCK_IFRAME_APP.source,
  OBBBA: MOCK_OBBBA_APP.source,
  APPLET: MOCK_APPLET_APP.source,
} as const;

// Mock setup for app transformers
export const setupAppPageMocks = () => {
  vi.mock('@/data/apps/appTransformers', () => ({
    apps: MOCK_APPS,
  }));

  // Mock embed components
  vi.mock('@/components/interactive', () => ({
    StreamlitEmbed: vi.fn(({ title }) => <div data-testid="streamlit-embed">{title}</div>),
    OBBBAIframeContent: vi.fn(({ title }) => <div data-testid="obbba-embed">{title}</div>),
  }));

  vi.mock('@/components/IframeContent', () => ({
    default: vi.fn(({ title }) => <div data-testid="iframe-content">{title}</div>),
  }));
};
