import fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import featuredToolsData from '@/data/featuredTools.json';
import { countryIds } from '@/libs/countries';
import { getFeaturedToolLinks } from '@/libs/featuredTools';

const WEBSITE_URL = 'https://policyengine.org';

const listedCountries = Object.keys(featuredToolsData);

/** The list's tools for a country: none unless the list has it as its own key. */
function listedTools(countryId: string) {
  return Object.hasOwn(featuredToolsData, countryId)
    ? featuredToolsData[countryId as keyof typeof featuredToolsData]
    : [];
}

/** Country strings: the listed and supported ones, keys every object has, and anything else. */
const countryStrings = fc.oneof(
  fc.constantFrom(...listedCountries, ...countryIds),
  fc.constantFrom('__proto__', 'constructor', 'toString', 'hasOwnProperty', ''),
  fc.string()
);

describe('getFeaturedToolLinks', () => {
  test('given the US then CliffWatch is among its links', () => {
    expect(getFeaturedToolLinks('us')).toContainEqual({
      label: 'CliffWatch',
      href: `${WEBSITE_URL}/us/cliffwatch`,
    });
  });

  test('given the UK then UK CliffWatch is among its links', () => {
    expect(getFeaturedToolLinks('uk')).toContainEqual({
      label: 'UK CliffWatch',
      href: `${WEBSITE_URL}/uk/uk-cliff-watch`,
    });
  });

  test.each([
    ...countryIds.filter((countryId) => listedTools(countryId).length === 0),
    '__proto__',
    'constructor',
    'toString',
    'US',
    '',
  ])('given %j, which has no featured tools, then there are no links', (countryId) => {
    expect(getFeaturedToolLinks(countryId)).toEqual([]);
  });

  test("given any country string then the links are its listed tools' pages, then the interactive filter", () => {
    fc.assert(
      fc.property(countryStrings, (countryId) => {
        const links = getFeaturedToolLinks(countryId);
        const tools = listedTools(countryId);
        if (tools.length === 0) {
          expect(links).toEqual([]);
          return;
        }
        expect(links).toEqual([
          ...tools.map((tool) => ({
            label: tool.label,
            href: `${WEBSITE_URL}/${countryId}/${tool.slug}`,
          })),
          {
            label: 'All interactive tools',
            href: `${WEBSITE_URL}/${countryId}/research?types=interactive`,
          },
        ]);
      })
    );
  });

  test('given any country string then every link is on its own country path of the website', () => {
    fc.assert(
      fc.property(countryStrings, (countryId) => {
        for (const link of getFeaturedToolLinks(countryId)) {
          expect(link.href.startsWith(`${WEBSITE_URL}/${countryId}/`)).toBe(true);
        }
      })
    );
  });

  test('given any country string then no two links share a label or an href', () => {
    fc.assert(
      fc.property(countryStrings, (countryId) => {
        const links = getFeaturedToolLinks(countryId);
        expect(new Set(links.map((link) => link.label)).size).toBe(links.length);
        expect(new Set(links.map((link) => link.href)).size).toBe(links.length);
      })
    );
  });

  test('given every listed country then it is a supported country', () => {
    for (const countryId of listedCountries) {
      expect(countryIds).toContain(countryId);
    }
  });
});
