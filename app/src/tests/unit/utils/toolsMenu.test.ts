import fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import appsData from '@/data/apps/apps.json';
import { getToolsMenuEntries } from '@/utils/toolsMenu';

interface AppEntry {
  slug: string;
  countryId: string;
  toolsMenu?: { label: string };
}

const apps = appsData as AppEntry[];
const countryIds = [...new Set(apps.map((app) => app.countryId))];

describe('getToolsMenuEntries', () => {
  test('given any country id then lists exactly that country’s flagged apps, sorted by label', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constantFrom(...countryIds, '__proto__', 'ca'), fc.string()),
        (countryId) => {
          const entries = getToolsMenuEntries(countryId);
          const flagged = apps.filter((app) => app.countryId === countryId && app.toolsMenu);

          expect(entries.map((entry) => entry.slug).sort()).toEqual(
            flagged.map((app) => app.slug).sort()
          );
          for (const entry of entries) {
            const app = flagged.find((candidate) => candidate.slug === entry.slug)!;
            expect(entry.label).toBe(app.toolsMenu!.label);
          }
          for (let i = 1; i < entries.length; i++) {
            expect(entries[i - 1].label.localeCompare(entries[i].label, 'en')).toBeLessThan(0);
          }
        }
      )
    );
  });

  test('given the US and UK then both have tools', () => {
    expect(getToolsMenuEntries('us').length).toBeGreaterThan(0);
    expect(getToolsMenuEntries('uk').length).toBeGreaterThan(0);
  });
});
