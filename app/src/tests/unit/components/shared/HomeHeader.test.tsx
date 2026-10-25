import { renderWithCountry, screen, userEvent, within } from '@test-utils';
import { describe, expect, test } from 'vitest';
import HeaderNavigation from '@/components/shared/HomeHeader';
import featuredToolsData from '@/data/featuredTools.json';
import { EXPECTED_HEADER_TEXT } from '@/tests/fixtures/components/homeHeader/HeaderMocks';

/**
 * Test constants
 */
const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

const WEBSITE_URL = 'https://policyengine.org';

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
    async function openMobileMenu() {
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Toggle navigation' }));
      return within(screen.getByRole('dialog'));
    }

    test.each(['calculator', 'website'] as const)(
      'given %s mode and US country then the desktop tools menu lists CliffWatch and the OBBBA household explorer',
      async (mode) => {
        // Given
        const user = userEvent.setup();
        renderWithCountry(<HeaderNavigation />, TEST_COUNTRIES.US, '/us', mode);

        // When
        await user.click(screen.getByRole('button', { name: /tools/i }));

        // Then
        expect(screen.getByRole('button', { name: 'CliffWatch' })).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: 'OBBBA household explorer' })
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'All interactive tools' })).toBeInTheDocument();
      }
    );

    test.each(['calculator', 'website'] as const)(
      'given %s mode and US country then tool links are absolute website URLs',
      async (mode) => {
        // Given
        renderWithCountry(<HeaderNavigation />, TEST_COUNTRIES.US, '/us', mode);

        // When
        const menu = await openMobileMenu();

        // Then
        expect(menu.getByRole('link', { name: 'CliffWatch' })).toHaveAttribute(
          'href',
          `${WEBSITE_URL}/us/cliffwatch`
        );
        expect(menu.getByRole('link', { name: 'OBBBA household explorer' })).toHaveAttribute(
          'href',
          `${WEBSITE_URL}/us/obbba-households`
        );
        expect(menu.getByRole('link', { name: 'All interactive tools' })).toHaveAttribute(
          'href',
          `${WEBSITE_URL}/us/research?types=interactive`
        );
      }
    );

    test('given the mobile menu then it scrolls when its links outgrow the screen', async () => {
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
      const menu = await openMobileMenu();

      // Then
      expect(menu.getByRole('link', { name: 'UK CliffWatch' })).toHaveAttribute(
        'href',
        `${WEBSITE_URL}/uk/uk-cliff-watch`
      );
      const hrefs = menu.getAllByRole('link').map((link) => link.getAttribute('href'));
      expect(hrefs).not.toContain(`${WEBSITE_URL}/uk/cliffwatch`);
      expect(hrefs).not.toContain(`${WEBSITE_URL}/uk/obbba-households`);
      expect(hrefs).not.toContain(`${WEBSITE_URL}/uk/bill-tracker`);
    });

    test.each(Object.entries(featuredToolsData))(
      'given %s then the tools menu links every tool in the shared list',
      async (countryId, tools) => {
        // Given
        renderWithCountry(<HeaderNavigation />, countryId, `/${countryId}`, 'calculator');

        // When
        const menu = await openMobileMenu();

        // Then
        for (const tool of tools) {
          expect(menu.getByRole('link', { name: tool.label })).toHaveAttribute(
            'href',
            `${WEBSITE_URL}/${countryId}/${tool.slug}`
          );
        }
      }
    );
  });
});
