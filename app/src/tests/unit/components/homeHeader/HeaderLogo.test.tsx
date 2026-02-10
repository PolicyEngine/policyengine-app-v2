import { renderWithCountry, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import HeaderLogo from '@/components/homeHeader/HeaderLogo';
import { TEST_COUNTRY_IDS } from '@/tests/fixtures/components/homeHeader/CountrySelectorMocks';

describe('HeaderLogo', () => {
  test('given component renders then displays PolicyEngine logo', () => {
    // When
    renderWithCountry(<HeaderLogo />, TEST_COUNTRY_IDS.US);

    // Then
    expect(screen.getByAltText('PolicyEngine')).toBeInTheDocument();
  });

  test('given logo has correct height then height is 24px', () => {
    // When
    renderWithCountry(<HeaderLogo />, TEST_COUNTRY_IDS.US);
    const logo = screen.getByAltText('PolicyEngine');

    // Then
    expect(logo).toHaveStyle({ height: '24px' });
  });

  describe('website app mode (same-app navigation)', () => {
    test('given US country then logo links to relative US path', () => {
      // When - website mode uses relative paths for SPA navigation
      renderWithCountry(<HeaderLogo />, TEST_COUNTRY_IDS.US, '/us', 'website');
      const link = screen.getByRole('link');

      // Then
      expect(link).toHaveAttribute('href', '/us');
    });

    test('given UK country then logo links to relative UK path', () => {
      // When
      renderWithCountry(<HeaderLogo />, TEST_COUNTRY_IDS.UK, '/uk', 'website');
      const link = screen.getByRole('link');

      // Then
      expect(link).toHaveAttribute('href', '/uk');
    });
  });

  describe('calculator app mode (cross-app navigation)', () => {
    test('given US country then logo links to absolute website URL', () => {
      // When - calculator mode uses absolute URLs to navigate to website
      renderWithCountry(<HeaderLogo />, TEST_COUNTRY_IDS.US, '/us', 'calculator');
      const link = screen.getByRole('link');

      // Then - WEBSITE_URL defaults to https://policyengine.org
      expect(link).toHaveAttribute('href', 'https://policyengine.org/us');
    });

    test('given UK country then logo links to absolute website URL', () => {
      // When
      renderWithCountry(<HeaderLogo />, TEST_COUNTRY_IDS.UK, '/uk', 'calculator');
      const link = screen.getByRole('link');

      // Then
      expect(link).toHaveAttribute('href', 'https://policyengine.org/uk');
    });
  });
});
