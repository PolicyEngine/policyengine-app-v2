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

  test('given US country then logo links to US homepage', () => {
    // When
    renderWithCountry(<HeaderLogo />, TEST_COUNTRY_IDS.US);
    const link = screen.getByRole('link');

    // Then - In dev/test mode, WEBSITE_URL is relative so href is just /us
    expect(link).toHaveAttribute('href', '/us');
  });

  test('given UK country then logo links to UK homepage', () => {
    // When
    renderWithCountry(<HeaderLogo />, TEST_COUNTRY_IDS.UK);
    const link = screen.getByRole('link');

    // Then
    expect(link).toHaveAttribute('href', '/uk');
  });
});
