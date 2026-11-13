import { renderWithCountry } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
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

type Tool = { slug: string; label: string };

// A made-up Tools menu, set per test, so these cases hold whichever tools
// apps.json marks: the bar links whatever the menu lists, in the menu's order
// (not alphabetical here, so a re-sort would show), one tool is still a group,
// and a country with no tools gets no rows.
const mockTools = vi.hoisted(() => ({ current: [] as Tool[] }));

// Fresh copies each call, as the real accessor returns, so a bar that sorts or
// edits what it gets can't change these expectations too.
vi.mock('@/utils/toolsMenu', () => ({
  getToolsMenuEntries: () => mockTools.current.map((tool) => ({ ...tool })),
}));

const SEVERAL_TOOLS: Tool[] = [
  { slug: 'zeta-tool', label: 'Zeta tool' },
  { slug: 'alpha-tool', label: 'Alpha tool' },
];
const ONE_TOOL: Tool[] = [{ slug: 'only-tool', label: 'Only tool' }];

const WITH_TOOLS = countryIds.flatMap((countryId) => [
  [countryId, 'several tools', SEVERAL_TOOLS] as const,
  [countryId, 'one tool', ONE_TOOL] as const,
]);

function renderTopBar(countryId: string) {
  return renderWithCountry(<FlagshipTopBar />, countryId, `/${countryId}/build`);
}

describe('FlagshipTopBar with another Tools menu', () => {
  beforeEach(() => {
    mockTools.current = [];
  });

  test.each(WITH_TOOLS)(
    'given %s with %s then both menus link them after Research, in the menu order',
    async (countryId, _case, tools) => {
      // Given
      mockTools.current = [...tools];
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

  test.each(countryIds)(
    'given %s with no tools then neither menu has tool rows',
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
});
