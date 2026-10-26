import { renderWithCountry, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import FlagshipTopBar from '@/components/flagship/FlagshipTopBar';
import { countryIds } from '@/libs/countries';
import { addDraftProvision, clearDraftReform, startDraftReform } from '@/libs/draftReform';
import {
  clickIsCancelled,
  linkRows,
  menuRows,
  openMoreMenu,
  openPhoneMenu,
  OTHER_LINK_ROWS,
  WEBSITE_URL,
} from '@/tests/fixtures/components/flagship/topBarFixtures';
import { getToolsMenuEntries, type ToolsMenuEntry } from '@/utils/toolsMenu';

const mockNavigate = vi.fn();
let mockPathname = '/us/build';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: mockPathname, search: '' }),
    useParams: () => ({ countryId: mockPathname.split('/')[1] }),
  };
});

/** Each country's tools, as the headers' Tools menu lists them, so these tests follow apps.json. */
const COUNTRIES_WITH_TOOLS = countryIds
  .map((countryId): [string, ToolsMenuEntry[]] => [countryId, getToolsMenuEntries(countryId)])
  .filter(([, tools]) => tools.length > 0);
const COUNTRIES_WITHOUT_TOOLS = countryIds.filter(
  (countryId) => getToolsMenuEntries(countryId).length === 0
);

function renderTopBar(countryId = 'us') {
  mockPathname = `/${countryId}/build`;
  return renderWithCountry(<FlagshipTopBar />, countryId, mockPathname);
}

describe('FlagshipTopBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearDraftReform();
  });

  test('given the bar renders then both sections and the more menu are in the primary navigation', () => {
    renderTopBar();

    const primary = screen.getByRole('navigation', { name: 'Primary' });
    expect(primary).toContainElement(screen.getByRole('button', { name: 'Build' }));
    expect(primary).toContainElement(screen.getByRole('button', { name: 'Reforms' }));
    expect(primary).toContainElement(
      screen.getByRole('button', { name: /more policyengine links/i })
    );
  });

  test('given the Ask page is paused then it has no nav item', () => {
    renderTopBar();

    expect(screen.queryByRole('button', { name: 'Ask' })).not.toBeInTheDocument();
  });

  test('given the current route then its nav item is marked current', () => {
    renderTopBar();

    expect(screen.getByRole('button', { name: 'Build' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Reforms' })).not.toHaveAttribute('aria-current');
  });

  test('given a nav item is clicked then it navigates and is marked current at once', async () => {
    const user = userEvent.setup();
    renderTopBar();

    await user.click(screen.getByRole('button', { name: 'Reforms' }));

    expect(mockNavigate).toHaveBeenCalledWith('/us/reforms');
    expect(screen.getByRole('button', { name: 'Reforms' })).toHaveAttribute('aria-current', 'page');
  });

  test('given the brand is clicked then it navigates to the Build landing', async () => {
    const user = userEvent.setup();
    renderTopBar();

    await user.click(screen.getByRole('button', { name: 'PolicyEngine' }));

    expect(mockNavigate).toHaveBeenCalledWith('/us/build');
  });

  test('given the more menu is opened then the website links are offered', async () => {
    const user = userEvent.setup();
    renderTopBar();

    await user.click(screen.getByRole('button', { name: /more policyengine links/i }));

    expect(await screen.findByRole('menuitem', { name: 'Research' })).toHaveAttribute(
      'href',
      expect.stringContaining('/us/research')
    );
    expect(screen.getByRole('menuitem', { name: 'GitHub' })).toBeInTheDocument();
  });

  test('given a draft on the build page then the bar does not link to it again', () => {
    startDraftReform('us', 'manual');
    addDraftProvision('us', {
      path: 'gov.irs.credits.ctc.amount.base',
      breadcrumb: 'IRS → Credits → Child tax credit → Base amount',
      unit: 'currency-USD',
      baselineValue: 2000,
      value: 2000,
    });

    renderTopBar();

    // The mocked location is /us/build, where the draft already is.
    expect(screen.queryByRole('button', { name: /draft ·/i })).not.toBeInTheDocument();
  });

  test("given a phone's menu is opened then it offers both sections and the website links", async () => {
    // Given — the menu button a phone shows in place of the sections
    const user = userEvent.setup();
    renderTopBar();

    // When
    await user.click(screen.getByRole('button', { name: 'Menu' }));

    // Then
    expect(await screen.findByRole('menuitem', { name: 'Build' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('menuitem', { name: 'Reforms' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Research' })).toHaveAttribute(
      'href',
      expect.stringContaining('/us/research')
    );
  });

  test("given a section is chosen from a phone's menu then it navigates there", async () => {
    // Given
    const user = userEvent.setup();
    renderTopBar();
    await user.click(screen.getByRole('button', { name: 'Menu' }));

    // When
    await user.click(await screen.findByRole('menuitem', { name: 'Reforms' }));

    // Then
    expect(mockNavigate).toHaveBeenCalledWith('/us/reforms');
  });

  describe('tools menu', () => {
    test('given the US then CliffWatch links its page on the website', async () => {
      // Given
      renderTopBar('us');

      // When
      await openMoreMenu();

      // Then
      expect(screen.getByRole('menuitem', { name: 'CliffWatch' })).toHaveAttribute(
        'href',
        `${WEBSITE_URL}/us/cliffwatch`
      );
    });

    // The UK calculator uses this bar once NEXT_PUBLIC_FLAGSHIP_SHELL_UK is "true".
    test('given the UK then UK CliffWatch links its page on the website', async () => {
      // Given
      renderTopBar('uk');

      // When
      await openMoreMenu();

      // Then
      expect(screen.getByRole('menuitem', { name: 'UK CliffWatch' })).toHaveAttribute(
        'href',
        `${WEBSITE_URL}/uk/uk-cliff-watch`
      );
    });

    test.each(COUNTRIES_WITH_TOOLS)(
      'given %s then the more menu lists its tools after Research, in the Tools menu order, as their own group',
      async (countryId, tools) => {
        // Given
        renderTopBar(countryId);

        // When
        const menu = await openMoreMenu();

        // Then
        expect(linkRows(menu)).toEqual([
          { tag: 'A', label: 'Research', href: `${WEBSITE_URL}/${countryId}/research` },
          '—',
          // The bar is the main app, so the tools start at the first tool.
          ...tools.map((tool) => ({
            tag: 'A',
            label: tool.label,
            href: `${WEBSITE_URL}/${countryId}/${tool.slug}`,
          })),
          '—',
          ...OTHER_LINK_ROWS.map((label) => expect.objectContaining({ label })),
        ]);
      }
    );

    test.each(COUNTRIES_WITHOUT_TOOLS)(
      'given %s, which has no tools, then the menus are one plain list with no tool rows',
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
        const phoneMenu = await openPhoneMenu();
        expect(menuRows(phoneMenu)).toEqual([
          'Build',
          'Reforms',
          '—',
          'Research',
          ...OTHER_LINK_ROWS,
        ]);
      }
    );

    test.each(countryIds)(
      "given %s then a phone's menu offers the sections, then the same website links as the more menu, in order",
      async (countryId) => {
        // Given
        const { unmount } = renderTopBar(countryId);
        const moreRows = linkRows(await openMoreMenu());
        unmount();

        // When
        renderTopBar(countryId);
        const phoneMenu = await openPhoneMenu();

        // Then
        expect(menuRows(phoneMenu).slice(0, 3)).toEqual(['Build', 'Reforms', '—']);
        expect(linkRows(phoneMenu, 3)).toEqual(moreRows);
      }
    );

    test.each(countryIds)(
      "given %s then every row of a phone's menu is a finger's height",
      async (countryId) => {
        // Given
        renderTopBar(countryId);

        // When
        await openPhoneMenu();

        // Then
        for (const row of screen.getAllByRole('menuitem')) {
          expect(row).toHaveClass('tw:min-h-10');
        }
      }
    );

    test.each(countryIds)(
      'given %s then the more menu keeps its compact rows, each with a pointer',
      async (countryId) => {
        // Given
        renderTopBar(countryId);

        // When
        await openMoreMenu();

        // Then
        for (const row of screen.getAllByRole('menuitem')) {
          expect(row).not.toHaveClass('tw:min-h-10');
          expect(row).toHaveStyle({ cursor: 'pointer' });
        }
      }
    );

    test.each(COUNTRIES_WITH_TOOLS)(
      'given %s then each tool row is a plain link, so a Cmd- or Ctrl-click opens a new tab',
      async (countryId, tools) => {
        renderTopBar(countryId);

        for (const tool of tools) {
          for (const modifier of [{ metaKey: true }, { ctrlKey: true }]) {
            // Given
            await openMoreMenu();
            const row = screen.getByRole('menuitem', { name: tool.label });
            expect(row).not.toHaveAttribute('target');

            // When
            const cancelled = clickIsCancelled(row, modifier);

            // Then
            expect(cancelled).toBe(false);
            await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
          }
        }
      }
    );
  });
});
