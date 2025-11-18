/**
 * Tests for appTransformers
 * Verifies app data processing logic works correctly
 */

import { describe, expect, test } from 'vitest';
import { apps } from './appTransformers';

describe('appTransformers', () => {
  test('apps array is not empty', () => {
    expect(apps).toBeDefined();
    expect(apps.length).toBeGreaterThan(0);
  });

  test('all apps have required fields', () => {
    apps.forEach((app) => {
      expect(app.slug).toBeDefined();
      expect(app.title).toBeDefined();
      expect(app.description).toBeDefined();
      expect(app.url).toBeDefined();
      expect(app.type).toBeDefined();
      expect(['streamlit', 'iframe', 'custom']).toContain(app.type);
      expect(app.tags).toBeDefined();
      expect(Array.isArray(app.tags)).toBe(true);
      expect(app.countryId).toBeDefined();
    });
  });

  test('all apps have valid URLs', () => {
    apps.forEach((app) => {
      expect(app.url).toMatch(/^https?:\/\//);
    });
  });

  test('all streamlit apps have streamlit.app URLs', () => {
    const streamlitApps = apps.filter((a) => a.type === 'streamlit');
    streamlitApps.forEach((app) => {
      expect(app.url).toMatch(/\.streamlit\.app/);
    });
  });

  test('custom apps have required additional fields', () => {
    const customApps = apps.filter((a) => a.type === 'custom');
    customApps.forEach((app) => {
      if (app.type === 'custom') {
        expect(app.component).toBeDefined();
        expect(typeof app.component).toBe('string');
      }
    });
  });

  test('all slugs are URL-safe', () => {
    apps.forEach((app) => {
      expect(app.slug).toMatch(/^[a-z0-9-]+$/);
    });
  });

  test('slugs are unique', () => {
    const slugs = apps.map((a) => a.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  test('OBBBA custom apps are configured correctly', () => {
    const obbbaApps = apps.filter((a) =>
      a.slug.includes('obbba') && a.type === 'custom'
    );

    expect(obbbaApps.length).toBeGreaterThan(0);

    obbbaApps.forEach((app) => {
      if (app.type === 'custom') {
        expect(app.component).toBe('OBBBAEmbed');
        expect(app.postMessage).toBe(true);
        expect(app.urlSync).toBe(true);
        expect(app.url).toMatch(/policyengine\.github\.io/);
      }
    });
  });
});
