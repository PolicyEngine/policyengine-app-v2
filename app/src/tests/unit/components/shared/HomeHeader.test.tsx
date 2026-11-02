import { renderWithCountry, screen, userEvent, within } from '@test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import HeaderNavigation from '@/components/shared/HomeHeader';
import appsData from '@/data/apps/apps.json';
import { EXPECTED_HEADER_TEXT } from '@/tests/fixtures/components/homeHeader/HeaderMocks';
import { getToolsMenuEntries } from '@/utils/toolsMenu';

// The real tools list, which a test can empty for a country with no tools.
vi.mock('@/utils/toolsMenu', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/toolsMenu')>();
  return { ...actual, getToolsMenuEntries: vi.fn(actual.getToolsMenuEntries) };
});

/**
 * Test constants
 */
const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

const WEBSITE_URL = 'https://policyengine.org';
const CALCULATOR_URL = 'https://app.policyengine.org';

// The tools menus Max ruled on (2026-10-25): the main app, then calculators
// that work for any household under current law, by label.
const US_TOOLS_ROWS = [
  'PolicyEngine app',
  'CliffWatch',
  'Coverage Compass',
  'GiveCalc',
  'Marriage calculator',
  'QBI deduction calculator',
  'SPM threshold calculator',
  'TANF calculator',
];
const UK_TOOLS_ROWS = [
  'PolicyEngine app',
  'Marriage calculator',
  'Student loan calculator',
  'UK CliffWatch',
];

interface AppEntry {
  slug: string;
  countryId: string;
  toolsMenu?: { label: string };
}

/** Each apps.json entry flagged for the menu, as the row it should get. */
function flaggedToolRows(countryId: string) {
  return (appsData as AppEntry[])
    .filter((app) => app.countryId === countryId && app.toolsMenu)
    .map((app) => ({
      label: app.toolsMenu!.label,
      href: `${WEBSITE_URL}/${countryId}/${app.slug}`,
    }));
}

describe('HeaderNavigation', () => {
  describe('rendering', () => {
    test('given component renders then displays header with navigation', () => {
      // When
      renderWithCountry(<HeaderNavigation />, TEST_COUNTRIES.US);

      // Then
      expect(screen.getByText(EXPECTED_HEADER_TEXT.ABOUT)).toBeInTheDocument();
      expect(screen.getByText(EXPECTED_HEADER_TEXT.DONATE)).toBeInTheDocument();
    });

    test('given component renders then displays country selector', () => {
      // When
      renderWithCountry(<HeaderNavigation />, TEST_COUNTRIES.US);

      // Then
      // Country selector button is present
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('given component renders then displays header element', () => {
      // When
      const { container } = renderWithCountry(<HeaderNavigation />, TEST_COUNTRIES.US);

      // Then
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('website app mode (same-app navigation)', () => {
    test('given website mode and US country then research link uses relative path', () => {
      // When
      renderWithCountry(<HeaderNavigation />, TEST_COUNTRIES.US, '/us', 'website');

      // Then
      const researchLink = screen.getByRole('link', { name: /research/i });
      expect(researchLink).toHaveAttribute('href', '/us/research');
    });

    test('given website mode and UK country then research link uses relative path', () => {
      // When
      renderWithCountry(<HeaderNavigation />, TEST_COUNTRIES.UK, '/uk', 'website');

      // Then
      const researchLink = screen.getByRole('link', { name: /research/i });
      expect(researchLink).toHaveAttribute('href', '/uk/research');
    });

    test('given website mode then donate link uses relative path', () => {
      // When
      renderWithCountry(<HeaderNavigation />, TEST_COUNTRIES.US, '/us', 'website');

      // Then
      const donateLink = screen.getByRole('link', { name: /donate/i });
      expect(donateLink).toHaveAttribute('href', '/us/donate');
    });
  });

  describe('calculator app mode (cross-app navigation)', () => {
    test('given calculator mode and US country then research link uses absolute URL', () => {
      // When
      renderWithCountry(<HeaderNavigation />, TEST_COUNTRIES.US, '/us', 'calculator');

      // Then
      const researchLink = screen.getByRole('link', { name: /research/i });
      expect(researchLink).toHaveAttribute('href', `${WEBSITE_URL}/us/research`);
    });

    test('given calculator mode and UK country then research link uses absolute URL', () => {
      // When
      renderWithCountry(<HeaderNavigation />, TEST_COUNTRIES.UK, '/uk', 'calculator');

      // Then
      const researchLink = screen.getByRole('link', { name: /research/i });
      expect(researchLink).toHaveAttribute('href', `${WEBSITE_URL}/uk/research`);
    });

    test('given calculator mode then donate link uses absolute URL', () => {
      // When
      renderWithCountry(<HeaderNavigation />, TEST_COUNTRIES.US, '/us', 'calculator');

      // Then
      const donateLink = screen.getByRole('link', { name: /donate/i });
      expect(donateLink).toHaveAttribute('href', `${WEBSITE_URL}/us/donate`);
    });
  });

  describe('tools menu', () => {
    afterEach(() => {
      // Restores the real function passed to vi.fn (Vitest 3), not an empty one.
      vi.mocked(getToolsMenuEntries).mockReset();
    });

    async function openMobileMenu() {
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Toggle navigation' }));
      return within(screen.getByRole('dialog'));
    }

    /** The mobile menu's Tools rows, in order. */
    async function mobileToolsRows() {
      const menu = await openMobileMenu();
      // "Tools" label → its section, which holds the rows.
      const section = menu.getByText('Tools').parentElement!;
      return within(section)
        .getAllByRole('link')
        .map((link) => ({ label: link.textContent, href: link.getAttribute('href') }));
    }

    /** The desktop Tools dropdown's rows, in order. */
    async function desktopToolsRows() {
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Tools' }));
      // row → padding div → panel
      const panel = screen.getByRole('link', { name: 'PolicyEngine app' }).parentElement!;
      expect(within(panel).queryAllByRole('button')).toEqual([]);
      return within(panel)
        .getAllByRole('link')
        .map((link) => ({ label: link.textContent, href: link.getAttribute('href') }));
    }

    test.each([
      ['us', US_TOOLS_ROWS],
      ['uk', UK_TOOLS_ROWS],
    ] as const)(
      'given %s then the desktop tools menu lists the main app, then the tools by label',
      async (countryId, rows) => {
        // Given
        renderWithCountry(<HeaderNavigation />, countryId, `/${countryId}`, 'calculator');

        // Then
        expect((await desktopToolsRows()).map((row) => row.label)).toEqual(rows);
      }
    );

    // Each row is a real link, so modifier-clicks and "Open link in new tab"
    // work, and it goes where the mobile menu's row does.
    test.each(['us', 'uk'])(
      'given %s then each desktop tools row is a link to the same URL as its mobile row',
      async (countryId) => {
        // Given
        renderWithCountry(<HeaderNavigation />, countryId, `/${countryId}`, 'calculator');

        // When
        const desktop = await desktopToolsRows();
        const mobile = await mobileToolsRows();

        // Then
        expect(desktop[0]).toEqual({
          label: 'PolicyEngine app',
          href: `${CALCULATOR_URL}/${countryId}`,
        });
        expect(desktop).toEqual(mobile);
      }
    );

    test.each([
      ['us', US_TOOLS_ROWS],
      ['uk', UK_TOOLS_ROWS],
    ] as const)(
      'given %s then the mobile tools menu lists the main app, then the tools by label',
      async (countryId, rows) => {
        // Given
        renderWithCountry(<HeaderNavigation />, countryId, `/${countryId}`, 'calculator');

        // Then
        expect((await mobileToolsRows()).map((row) => row.label)).toEqual(rows);
      }
    );

    test.each(['calculator', 'website'] as const)(
      'given %s mode then the main app links to the calculator and each tool to its website zone',
      async (mode) => {
        // Given
        renderWithCountry(<HeaderNavigation />, TEST_COUNTRIES.US, '/us', mode);

        // When
        const rows = await mobileToolsRows();

        // Then
        expect(rows[0]).toEqual({ label: 'PolicyEngine app', href: `${CALCULATOR_URL}/us` });
        expect(rows).toContainEqual({ label: 'CliffWatch', href: `${WEBSITE_URL}/us/cliffwatch` });
        expect(rows).toContainEqual({
          label: 'SPM threshold calculator',
          href: `${WEBSITE_URL}/us/spm-calculator`,
        });
      }
    );

    test.each(['us', 'uk'])(
      'given %s then the menu links exactly the tools apps.json flags, after the main app',
      async (countryId) => {
        // Given
        renderWithCountry(<HeaderNavigation />, countryId, `/${countryId}`, 'calculator');

        // When
        const rows = await mobileToolsRows();

        // Then
        expect(rows[0].href).toBe(`${CALCULATOR_URL}/${countryId}`);
        expect(rows.slice(1)).toHaveLength(flaggedToolRows(countryId).length);
        expect(rows.slice(1)).toEqual(expect.arrayContaining(flaggedToolRows(countryId)));
      }
    );

    test('given the US then the OBBBA explorer and the bill tracker are research, not tools', async () => {
      // Given
      renderWithCountry(<HeaderNavigation />, TEST_COUNTRIES.US, '/us', 'calculator');

      // When
      const hrefs = (await mobileToolsRows()).map((row) => row.href);

      // Then
      expect(hrefs).not.toContain(`${WEBSITE_URL}/us/obbba-households`);
      expect(hrefs).not.toContain(`${WEBSITE_URL}/us/bill-tracker`);
      expect(hrefs).not.toContain(`${WEBSITE_URL}/us/research?types=interactive`);
    });

    test('given the US tools menu then its panel takes a max-content width over its 220px minimum', async () => {
      // Given
      const user = userEvent.setup();
      renderWithCountry(<HeaderNavigation />, TEST_COUNTRIES.US, '/us', 'calculator');

      // When
      await user.click(screen.getByRole('button', { name: /tools/i }));

      // Then: row → padding div → panel. jsdom has no layout, so this checks
      // the style rather than the wrapping it prevents.
      const row = screen.getByRole('link', { name: 'SPM threshold calculator' });
      expect(row.parentElement!.parentElement).toHaveStyle({
        width: 'max-content',
        minWidth: '220px',
      });
    });

    test('given a country with no tools then there is no tools menu, not even for the main app', async () => {
      // Given: both countries the calculator offers have tools, so the list is emptied
      vi.mocked(getToolsMenuEntries).mockReturnValue([]);
      renderWithCountry(<HeaderNavigation />, TEST_COUNTRIES.UK, '/uk', 'calculator');

      // Then
      expect(screen.queryByRole('button', { name: /tools/i })).not.toBeInTheDocument();
      const menu = await openMobileMenu();
      expect(menu.queryByText('Tools')).not.toBeInTheDocument();
      expect(menu.queryByRole('link', { name: 'PolicyEngine app' })).not.toBeInTheDocument();
    });

    test('given the mobile menu then its panel scrolls vertically', async () => {
      // Given
      renderWithCountry(<HeaderNavigation />, TEST_COUNTRIES.US, '/us', 'calculator');

      // When
      await openMobileMenu();

      // Then
      expect(screen.getByRole('dialog')).toHaveClass('tw:overflow-y-auto');
    });

    test('given UK country then the tools menu offers UK CliffWatch and no US-only tool', async () => {
      // Given
      renderWithCountry(<HeaderNavigation />, TEST_COUNTRIES.UK, '/uk', 'calculator');

      // When
      const rows = await mobileToolsRows();

      // Then
      expect(rows).toContainEqual({
        label: 'UK CliffWatch',
        href: `${WEBSITE_URL}/uk/uk-cliff-watch`,
      });
      const hrefs = rows.map((row) => row.href);
      expect(hrefs).not.toContain(`${WEBSITE_URL}/uk/cliffwatch`);
      expect(hrefs).not.toContain(`${WEBSITE_URL}/uk/obbba-households`);
      expect(hrefs).not.toContain(`${WEBSITE_URL}/uk/bill-tracker`);
    });
  });
});
