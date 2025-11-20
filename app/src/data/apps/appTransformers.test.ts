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
      expect(app.source).toBeDefined();
      expect(app.type).toBeDefined();
      expect(['streamlit', 'iframe', 'obbba-iframe', 'custom']).toContain(app.type);
      expect(app.tags).toBeDefined();
      expect(Array.isArray(app.tags)).toBe(true);
      expect(app.countryId).toBeDefined();
    });
  });

  test('all apps have valid source URLs', () => {
    apps.forEach((app) => {
      expect(app.source).toMatch(/^https?:\/\//);
    });
  });

  test('all streamlit apps have streamlit.app source URLs', () => {
    const streamlitApps = apps.filter((a) => a.type === 'streamlit');
    streamlitApps.forEach((app) => {
      expect(app.source).toMatch(/\.streamlit\.app/);
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

  test('OBBBA iframe apps are configured correctly', () => {
    const obbbaApps = apps.filter((a) =>
      a.slug.includes('obbba') && a.type === 'obbba-iframe'
    );

    expect(obbbaApps.length).toBeGreaterThan(0);

    obbbaApps.forEach((app) => {
      expect(app.source).toMatch(/policyengine\.github\.io/);
    });
  });

  test('apps with displayWithResearch have required fields', () => {
    const researchApps = apps.filter((a) => a.displayWithResearch);

    expect(researchApps.length).toBeGreaterThan(0);

    researchApps.forEach((app) => {
      expect(app.displayWithResearch).toBe(true);
      expect(app.image).toBeDefined();
      expect(typeof app.image).toBe('string');
      expect(app.date).toBeDefined();
      expect(app.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(app.authors).toBeDefined();
      expect(Array.isArray(app.authors)).toBe(true);
      expect(app.authors!.length).toBeGreaterThan(0);
    });
  });

  test('correct number of apps are configured for research display', () => {
    const researchApps = apps.filter((a) => a.displayWithResearch);
    expect(researchApps.length).toBe(2);
  });
});
