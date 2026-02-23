import { renderWithCountry, screen, userEvent } from '@test-utils';
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

  test('given onToggleNavbar provided then renders sidebar burger', () => {
    // Given
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const onToggleNavbar = vi.fn();

    // When
    renderWithCountry(
      <HeaderContent
        opened={false}
        onOpen={onOpen}
        onClose={onClose}
        navItems={MOCK_NAV_ITEMS}
        navbarOpened={false}
        onToggleNavbar={onToggleNavbar}
      />,
      'us'
    );

    // Then
    expect(screen.getByLabelText('Toggle sidebar')).toBeInTheDocument();
  });

  test('given onToggleNavbar not provided then sidebar burger is absent', () => {
    // Given
    const onOpen = vi.fn();
    const onClose = vi.fn();

    // When
    renderWithCountry(
      <HeaderContent opened={false} onOpen={onOpen} onClose={onClose} navItems={MOCK_NAV_ITEMS} />,
      'us'
    );

    // Then
    expect(screen.queryByLabelText('Toggle sidebar')).not.toBeInTheDocument();
  });

  test('given sidebar burger clicked then onToggleNavbar is called', async () => {
    // Given
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const onToggleNavbar = vi.fn();

    renderWithCountry(
      <HeaderContent
        opened={false}
        onOpen={onOpen}
        onClose={onClose}
        navItems={MOCK_NAV_ITEMS}
        navbarOpened={false}
        onToggleNavbar={onToggleNavbar}
      />,
      'us'
    );

    // When
    await user.click(screen.getByLabelText('Toggle sidebar'));

    // Then
    expect(onToggleNavbar).toHaveBeenCalledOnce();
  });
});
