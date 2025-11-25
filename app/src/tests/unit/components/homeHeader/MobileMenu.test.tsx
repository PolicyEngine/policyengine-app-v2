import { renderWithCountry, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import MobileMenu from '@/components/homeHeader/MobileMenu';
import { MOCK_NAV_ITEMS } from '@/tests/fixtures/components/home/HomeMocks';

describe('MobileMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given component renders then displays burger button and country selector', () => {
    // Given
    const onOpen = vi.fn();
    const onClose = vi.fn();

    // When
    renderWithCountry(
      <MobileMenu opened={false} onOpen={onOpen} onClose={onClose} navItems={MOCK_NAV_ITEMS} />,
      'us'
    );

    // Then
    // Both burger and country selector buttons exist
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  test('given user clicks burger then onOpen is called', async () => {
    // Given
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onClose = vi.fn();

    // When
    renderWithCountry(
      <MobileMenu opened={false} onOpen={onOpen} onClose={onClose} navItems={MOCK_NAV_ITEMS} />,
      'us'
    );

    const buttons = screen.getAllByRole('button');
    const burgerButton = buttons[buttons.length - 1]; // Burger is the last button
    await user.click(burgerButton);

    // Then
    expect(onOpen).toHaveBeenCalled();
  });

  test('given menu is opened then displays all nav items', () => {
    // Given
    const onOpen = vi.fn();
    const onClose = vi.fn();

    // When
    renderWithCountry(
      <MobileMenu opened onOpen={onOpen} onClose={onClose} navItems={MOCK_NAV_ITEMS} />,
      'us'
    );

    // Then
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Research')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Donate')).toBeInTheDocument();
  });

  test('given menu is opened then displays dropdown section with items', () => {
    // Given
    const onOpen = vi.fn();
    const onClose = vi.fn();

    // When
    renderWithCountry(
      <MobileMenu opened onOpen={onOpen} onClose={onClose} navItems={MOCK_NAV_ITEMS} />,
      'us'
    );

    // Then
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Supporters')).toBeInTheDocument();
  });

  test('given user clicks simple nav item then callback is invoked', async () => {
    // Given
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const onDonateClick = vi.fn();
    const navItemsWithSpy = MOCK_NAV_ITEMS.map((item) =>
      item.label === 'Donate' ? { ...item, onClick: onDonateClick } : item
    );

    // When
    renderWithCountry(
      <MobileMenu opened onOpen={onOpen} onClose={onClose} navItems={navItemsWithSpy} />,
      'us'
    );

    await user.click(screen.getByText('Donate'));

    // Then
    expect(onDonateClick).toHaveBeenCalled();
  });

  test('given user clicks dropdown item then callback is invoked', async () => {
    // Given
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const onTeamClick = vi.fn();
    const navItemsWithSpy = MOCK_NAV_ITEMS.map((item) =>
      item.label === 'About' && item.dropdownItems
        ? {
            ...item,
            dropdownItems: item.dropdownItems.map((dropdownItem) =>
              dropdownItem.label === 'Team'
                ? { ...dropdownItem, onClick: onTeamClick }
                : dropdownItem
            ),
          }
        : item
    );

    // When
    renderWithCountry(
      <MobileMenu opened onOpen={onOpen} onClose={onClose} navItems={navItemsWithSpy} />,
      'us'
    );

    await user.click(screen.getByText('Team'));

    // Then
    expect(onTeamClick).toHaveBeenCalled();
  });

  test('given menu closed then does not display nav items', () => {
    // Given
    const onOpen = vi.fn();
    const onClose = vi.fn();

    // When
    renderWithCountry(
      <MobileMenu opened={false} onOpen={onOpen} onClose={onClose} navItems={MOCK_NAV_ITEMS} />,
      'us'
    );

    // Then
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    expect(screen.queryByText('Research')).not.toBeInTheDocument();
  });

  test('given user clicks Home then callback is invoked', async () => {
    // Given
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const onHomeClick = vi.fn();
    const navItemsWithSpy = MOCK_NAV_ITEMS.map((item) =>
      item.label === 'Home' ? { ...item, onClick: onHomeClick } : item
    );

    // When
    renderWithCountry(
      <MobileMenu opened onOpen={onOpen} onClose={onClose} navItems={navItemsWithSpy} />,
      'us'
    );

    await user.click(screen.getByText('Home'));

    // Then
    expect(onHomeClick).toHaveBeenCalled();
  });
});
