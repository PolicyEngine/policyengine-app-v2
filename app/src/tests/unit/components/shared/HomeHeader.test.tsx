import { renderWithCountry, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import HeaderNavigation from '@/components/shared/HomeHeader';
import { EXPECTED_HEADER_TEXT } from '@/tests/fixtures/components/homeHeader/HeaderMocks';

describe('HeaderNavigation', () => {
  test('given component renders then displays header with navigation', () => {
    // When
    renderWithCountry(<HeaderNavigation />, 'us');

    // Then
    expect(screen.getByText(EXPECTED_HEADER_TEXT.ABOUT)).toBeInTheDocument();
    expect(screen.getByText(EXPECTED_HEADER_TEXT.DONATE)).toBeInTheDocument();
  });

  test('given component renders then displays country selector', () => {
    // When
    renderWithCountry(<HeaderNavigation />, 'us');

    // Then
    // Country selector button is present
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('given component renders then displays header element', () => {
    // When
    const { container } = renderWithCountry(<HeaderNavigation />, 'us');

    // Then
    expect(container.firstChild).toBeInTheDocument();
  });
});
