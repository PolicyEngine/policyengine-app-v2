import { renderWithCountry, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import DesktopNavigation from '@/components/home-header/DesktopNavigation';
import { MOCK_NAV_ITEMS } from '@/tests/fixtures/components/home/HomeMocks';

describe('DesktopNavigation', () => {
  test('given nav items then displays all nav labels', () => {
    // Given/When
    renderWithCountry(<DesktopNavigation navItems={MOCK_NAV_ITEMS} />, 'us');

    // Then
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Research')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Donate')).toBeInTheDocument();
  });

  test('given about dropdown then displays dropdown items on click', async () => {
    // Given
    const { userEvent } = await import('@test-utils');
    const user = userEvent.setup();

    // When
    renderWithCountry(<DesktopNavigation navItems={MOCK_NAV_ITEMS} />, 'us');
    await user.click(screen.getByText('About'));

    // Then
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Supporters')).toBeInTheDocument();
  });

  test('given user clicks nav link then callback is invoked', async () => {
    // Given
    const { userEvent } = await import('@test-utils');
    const user = userEvent.setup();
    const onDonateClick = vi.fn();
    const navItemsWithSpy = MOCK_NAV_ITEMS.map((item) =>
      item.label === 'Donate' ? { ...item, onClick: onDonateClick } : item
    );

    // When
    renderWithCountry(<DesktopNavigation navItems={navItemsWithSpy} />, 'us');
    await user.click(screen.getByText('Donate'));

    // Then
    expect(onDonateClick).toHaveBeenCalled();
  });

  test('given user clicks about dropdown item then callback is invoked', async () => {
    // Given
    const { userEvent } = await import('@test-utils');
    const user = userEvent.setup();
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
    renderWithCountry(<DesktopNavigation navItems={navItemsWithSpy} />, 'us');
    await user.click(screen.getByText('About'));
    await user.click(screen.getByText('Team'));

    // Then
    expect(onTeamClick).toHaveBeenCalled();
  });

  test('given user clicks Home then callback is invoked', async () => {
    // Given
    const { userEvent } = await import('@test-utils');
    const user = userEvent.setup();
    const onHomeClick = vi.fn();
    const navItemsWithSpy = MOCK_NAV_ITEMS.map((item) =>
      item.label === 'Home' ? { ...item, onClick: onHomeClick } : item
    );

    // When
    renderWithCountry(<DesktopNavigation navItems={navItemsWithSpy} />, 'us');
    await user.click(screen.getByText('Home'));

    // Then
    expect(onHomeClick).toHaveBeenCalled();
  });
});
