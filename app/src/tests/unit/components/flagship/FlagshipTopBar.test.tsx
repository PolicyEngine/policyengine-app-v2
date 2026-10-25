import { renderWithCountry, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import FlagshipTopBar from '@/components/flagship/FlagshipTopBar';
import featuredToolsData from '@/data/featuredTools.json';
import { countryIds } from '@/libs/countries';
import { addDraftProvision, clearDraftReform, startDraftReform } from '@/libs/draftReform';

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

const WEBSITE_URL = 'https://policyengine.org';

/** The website links after the tools group, the same in every country. */
const OTHER_LINK_ROWS = ['Model documentation', 'API', 'About', 'Donate', 'GitHub'];

/** The shared list's countries and their tools, so these tests follow the list. */
const COUNTRIES_WITH_TOOLS = Object.entries(featuredToolsData).filter(
  ([, tools]) => tools.length > 0
);
const COUNTRIES_WITHOUT_TOOLS = countryIds.filter(
  (countryId) => !COUNTRIES_WITH_TOOLS.some(([listed]) => listed === countryId)
);

function renderTopBar(countryId = 'us') {
  mockPathname = `/${countryId}/build`;
  return renderWithCountry(<FlagshipTopBar />, countryId, mockPathname);
}

async function openMenu(name: string | RegExp) {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name }));
  return screen.findByRole('menu');
}

const openMoreMenu = () => openMenu(/more policyengine links/i);
const openPhoneMenu = () => openMenu('Menu');

/** A menu's rows in order, each separator as '—'. */
function menuRows(menu: HTMLElement) {
  return Array.from(menu.children).map((row) =>
    row.getAttribute('role') === 'separator' ? '—' : row.textContent
  );
}

/** A menu's link rows from `from` on, as label and href, each separator as '—'. */
function linkRows(menu: HTMLElement, from = 0) {
  return Array.from(menu.children)
    .slice(from)
    .map((row) =>
      row.getAttribute('role') === 'separator'
        ? '—'
        : { tag: row.tagName, label: row.textContent, href: row.getAttribute('href') }
    );
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

  describe('interactive tools', () => {
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
      'given %s then the more menu lists its tools after Research, as their own group',
      async (countryId, tools) => {
        // Given
        renderTopBar(countryId);

        // When
        const menu = await openMoreMenu();

        // Then
        expect(linkRows(menu)).toEqual([
          { tag: 'A', label: 'Research', href: `${WEBSITE_URL}/${countryId}/research` },
          '—',
          ...tools.map((tool) => ({
            tag: 'A',
            label: tool.label,
            href: `${WEBSITE_URL}/${countryId}/${tool.slug}`,
          })),
          {
            tag: 'A',
            label: 'All interactive tools',
            href: `${WEBSITE_URL}/${countryId}/research?types=interactive`,
          },
          '—',
          ...OTHER_LINK_ROWS.map((label) => expect.objectContaining({ label })),
        ]);
      }
    );

    test.each(COUNTRIES_WITHOUT_TOOLS)(
      'given %s, which has no featured tools, then the menus are one plain list with no tool rows',
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
  });
});
