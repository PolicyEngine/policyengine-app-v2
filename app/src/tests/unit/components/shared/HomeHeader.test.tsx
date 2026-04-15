import { renderWithCountry, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import HeaderNavigation from '@/components/shared/HomeHeader';
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
});
