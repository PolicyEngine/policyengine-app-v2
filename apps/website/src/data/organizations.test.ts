import { describe, it, expect } from 'vitest';
import { organizations } from './organizations';

describe('organizations', () => {
  it('every organization has at least one country', () => {
    Object.entries(organizations).forEach(([key, org]) => {
      expect(
        org.countries.length,
        `Organization "${key}" has no countries assigned`
      ).toBeGreaterThan(0);
    });
  });

  it('every organization has required fields', () => {
    Object.entries(organizations).forEach(([key, org]) => {
      expect(org.name, `Organization "${key}" missing name`).toBeDefined();
      expect(org.logo, `Organization "${key}" missing logo`).toBeDefined();
      expect(org.link, `Organization "${key}" missing link`).toBeDefined();
      expect(org.countries, `Organization "${key}" missing countries`).toBeDefined();
    });
  });
});
