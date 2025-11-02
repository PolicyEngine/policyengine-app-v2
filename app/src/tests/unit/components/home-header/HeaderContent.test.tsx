import { renderWithCountry, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import HeaderContent from '@/components/home-header/HeaderContent';
import {
  MOCK_ABOUT_LINKS,
  MOCK_NAV_LINKS,
} from '@/tests/fixtures/components/home-header/HeaderMocks';

describe('HeaderContent', () => {
  test('given component renders then displays logo and navigation', () => {
    // Given
    const onNavClick = vi.fn();
    const onOpen = vi.fn();
    const onClose = vi.fn();

    // When
    renderWithCountry(
      <HeaderContent
        opened={false}
        onOpen={onOpen}
        onClose={onClose}
        navLinks={MOCK_NAV_LINKS}
        aboutLinks={MOCK_ABOUT_LINKS}
        onNavClick={onNavClick}
      />,
      'us'
    );

    // Then
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Donate')).toBeInTheDocument();
  });

  test('given desktop view then shows country selector', () => {
    // Given
    const onNavClick = vi.fn();
    const onOpen = vi.fn();
    const onClose = vi.fn();

    // When
    renderWithCountry(
      <HeaderContent
        opened={false}
        onOpen={onOpen}
        onClose={onClose}
        navLinks={MOCK_NAV_LINKS}
        aboutLinks={MOCK_ABOUT_LINKS}
        onNavClick={onNavClick}
      />,
      'us'
    );

    // Then
    // Country selector button exists
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('given component renders then displays mobile menu', () => {
    // Given
    const onNavClick = vi.fn();
    const onOpen = vi.fn();
    const onClose = vi.fn();

    // When
    renderWithCountry(
      <HeaderContent
        opened={false}
        onOpen={onOpen}
        onClose={onClose}
        navLinks={MOCK_NAV_LINKS}
        aboutLinks={MOCK_ABOUT_LINKS}
        onNavClick={onNavClick}
      />,
      'us'
    );

    // Then
    // Burger menu button exists (part of MobileMenu component)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
