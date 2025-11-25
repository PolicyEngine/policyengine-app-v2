import { renderWithCountry, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import HeaderContent from '@/components/homeHeader/HeaderContent';
import { MOCK_NAV_ITEMS } from '@/tests/fixtures/components/home/HomeMocks';

describe('HeaderContent', () => {
  test('given component renders then displays logo and navigation', () => {
    // Given
    const onOpen = vi.fn();
    const onClose = vi.fn();

    // When
    renderWithCountry(
      <HeaderContent opened={false} onOpen={onOpen} onClose={onClose} navItems={MOCK_NAV_ITEMS} />,
      'us'
    );

    // Then
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Research')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Donate')).toBeInTheDocument();
  });

  test('given desktop view then shows action buttons', () => {
    // Given
    const onOpen = vi.fn();
    const onClose = vi.fn();

    // When
    renderWithCountry(
      <HeaderContent opened={false} onOpen={onOpen} onClose={onClose} navItems={MOCK_NAV_ITEMS} />,
      'us'
    );

    // Then
    // Action buttons exist (Log in/Sign up)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('given component renders then displays mobile menu', () => {
    // Given
    const onOpen = vi.fn();
    const onClose = vi.fn();

    // When
    renderWithCountry(
      <HeaderContent opened={false} onOpen={onOpen} onClose={onClose} navItems={MOCK_NAV_ITEMS} />,
      'us'
    );

    // Then
    // Burger menu button and country selector exist (part of MobileMenu component)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });
});
