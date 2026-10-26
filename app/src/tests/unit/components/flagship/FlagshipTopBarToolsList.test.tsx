import { renderWithCountry } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import FlagshipTopBar from '@/components/flagship/FlagshipTopBar';
import { countryIds } from '@/libs/countries';
import {
  linkRows,
  menuRows,
  openMoreMenu,
  openPhoneMenu,
  OTHER_LINK_ROWS,
  WEBSITE_URL,
} from '@/tests/fixtures/components/flagship/topBarFixtures';

// A made-up Tools menu, so these cases hold whichever tools apps.json marks:
// the bar links whatever the menu lists, in the menu's order (not alphabetical
// here, so a re-sort would show), one tool is still a group, and a country
// with no tools gets no rows.
const { MOCK_TOOLS } = vi.hoisted(() => ({
  MOCK_TOOLS: {
    us: [
      { slug: 'zeta-tool', label: 'Zeta tool' },
      { slug: 'alpha-tool', label: 'Alpha tool' },
    ],
    ca: [{ slug: 'only-tool', label: 'Only tool' }],
  } as Record<string, { slug: string; label: string }[]>,
}));

vi.mock('@/utils/toolsMenu', () => ({
  getToolsMenuEntries: (countryId: string) => MOCK_TOOLS[countryId] ?? [],
}));

const COUNTRIES_WITHOUT_TOOLS = countryIds.filter((countryId) => !(countryId in MOCK_TOOLS));

function renderTopBar(countryId: string) {
  return renderWithCountry(<FlagshipTopBar />, countryId, `/${countryId}/build`);
}

describe('FlagshipTopBar with another Tools menu', () => {
  test.each(Object.entries(MOCK_TOOLS))(
    'given %s then both menus link its tools after Research, in the menu order',
    async (countryId, tools) => {
      // Given
      const { unmount } = renderTopBar(countryId);

      // When
      const moreRows = linkRows(await openMoreMenu());

      // Then
      expect(moreRows).toEqual([
        expect.objectContaining({ label: 'Research' }),
        '—',
        ...tools.map((tool) => ({
          tag: 'A',
          label: tool.label,
          href: `${WEBSITE_URL}/${countryId}/${tool.slug}`,
        })),
        '—',
        ...OTHER_LINK_ROWS.map((label) => expect.objectContaining({ label })),
      ]);

      // And a phone's menu likewise
      unmount();
      renderTopBar(countryId);
      expect(linkRows(await openPhoneMenu(), 3)).toEqual(moreRows);
    }
  );

  test.each(COUNTRIES_WITHOUT_TOOLS)(
    'given %s, with no tools, then neither menu has tool rows',
    async (countryId) => {
      // Given
      const { unmount } = renderTopBar(countryId);

      // When
      const moreMenu = await openMoreMenu();

      // Then
      expect(menuRows(moreMenu)).toEqual(['Research', ...OTHER_LINK_ROWS]);

      // And a phone's menu likewise
      unmount();
      renderTopBar(countryId);
      expect(menuRows(await openPhoneMenu())).toEqual([
        'Build',
        'Reforms',
        '—',
        'Research',
        ...OTHER_LINK_ROWS,
      ]);
    }
  );

  test('given the mock then it covers a country with several tools, one with one, and one with none', () => {
    expect(MOCK_TOOLS.us.length).toBeGreaterThan(1);
    expect(MOCK_TOOLS.ca).toHaveLength(1);
    expect(COUNTRIES_WITHOUT_TOOLS.length).toBeGreaterThan(0);
  });
});
