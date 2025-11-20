/**
 * Test fixtures for CountryAppGuard component
 */

import { vi } from 'vitest';
import type { App } from '@/types/apps';

// Test country IDs
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

// Test app slugs
export const TEST_APP_SLUGS = {
  US_APP: 'test-us-app',
  UK_APP: 'test-uk-app',
  NON_EXISTENT: 'non-existent-app',
} as const;

// Mock apps for testing
export const MOCK_US_APP: App = {
  slug: TEST_APP_SLUGS.US_APP,
  title: 'Test US App',
  description: 'A test app for US',
  source: 'https://example.com/us-app',
  tags: ['us', 'test'],
  countryId: TEST_COUNTRIES.US,
  type: 'streamlit',
};

export const MOCK_UK_APP: App = {
  slug: TEST_APP_SLUGS.UK_APP,
  title: 'Test UK App',
  description: 'A test app for UK',
  source: 'https://example.com/uk-app',
  tags: ['uk', 'test'],
  countryId: TEST_COUNTRIES.UK,
  type: 'iframe',
};

export const MOCK_APPLET: App = {
  slug: 'test-applet',
  title: 'Test Applet',
  description: 'A test applet',
  source: 'https://example.com/applet',
  tags: ['us', 'test'],
  countryId: TEST_COUNTRIES.US,
  type: 'applet',
  displayWithResearch: true,
  image: 'test-image.jpg',
  date: '2025-01-01',
  authors: ['test-author'],
};

// Mock apps list for testing
export const MOCK_APPS: App[] = [MOCK_US_APP, MOCK_UK_APP, MOCK_APPLET];

// Mock setup for app transformers
export const setupAppTransformersMock = () => {
  vi.mock('@/data/apps/appTransformers', () => ({
    apps: MOCK_APPS,
  }));
};
