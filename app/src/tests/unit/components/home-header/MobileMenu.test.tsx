import { renderWithCountry, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import MobileMenu from '@/components/home-header/MobileMenu';
import {
  MOCK_ABOUT_LINKS,
  MOCK_NAV_LINKS,
} from '@/tests/fixtures/components/home-header/HeaderMocks';

describe('MobileMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given component renders then displays burger button and country selector', () => {
    // Given
    const onNavClick = vi.fn();
    const onOpen = vi.fn();
    const onClose = vi.fn();

    // When
    renderWithCountry(
      <MobileMenu
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
    // Both burger and country selector buttons exist
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  test('given user clicks burger then onOpen is called', async () => {
    // Given
    const { userEvent } = await import('@test-utils');
    const user = userEvent.setup();
    const onNavClick = vi.fn();
    const onOpen = vi.fn();
    const onClose = vi.fn();

    // When
    renderWithCountry(
      <MobileMenu
        opened={false}
        onOpen={onOpen}
        onClose={onClose}
        navLinks={MOCK_NAV_LINKS}
        aboutLinks={MOCK_ABOUT_LINKS}
        onNavClick={onNavClick}
      />,
      'us'
    );

    const buttons = screen.getAllByRole('button');
    const burgerButton = buttons[buttons.length - 1]; // Burger is the last button
    await user.click(burgerButton);

    // Then
    expect(onOpen).toHaveBeenCalled();
  });

  test('given menu is opened then displays about section with links', () => {
    // Given
    const onNavClick = vi.fn();
    const onOpen = vi.fn();
    const onClose = vi.fn();

    // When
    renderWithCountry(
      <MobileMenu
        opened
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
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Supporters')).toBeInTheDocument();
  });

  test('given menu is opened then displays divider between sections', () => {
    // Given
    const onNavClick = vi.fn();
    const onOpen = vi.fn();
    const onClose = vi.fn();

    // When
    const { container } = renderWithCountry(
      <MobileMenu
        opened
        onOpen={onOpen}
        onClose={onClose}
        navLinks={MOCK_NAV_LINKS}
        aboutLinks={MOCK_ABOUT_LINKS}
        onNavClick={onNavClick}
      />,
      'us'
    );

    // Then
    // Divider exists (Mantine Divider renders as hr)
    const divider = container.querySelector('hr');
    expect(divider).toBeInTheDocument();
  });

  test('given menu is opened then displays navigation links section', () => {
    // Given
    const onNavClick = vi.fn();
    const onOpen = vi.fn();
    const onClose = vi.fn();

    // When
    renderWithCountry(
      <MobileMenu
        opened
        onOpen={onOpen}
        onClose={onClose}
        navLinks={MOCK_NAV_LINKS}
        aboutLinks={MOCK_ABOUT_LINKS}
        onNavClick={onNavClick}
      />,
      'us'
    );

    // Then
    const donateLinks = screen.getAllByText('Donate');
    expect(donateLinks.length).toBeGreaterThan(0);
  });

  test('given user clicks about link then onNavClick is called', async () => {
    // Given
    const { userEvent } = await import('@test-utils');
    const user = userEvent.setup();
    const onNavClick = vi.fn();
    const onOpen = vi.fn();
    const onClose = vi.fn();

    // When
    renderWithCountry(
      <MobileMenu
        opened
        onOpen={onOpen}
        onClose={onClose}
        navLinks={MOCK_NAV_LINKS}
        aboutLinks={MOCK_ABOUT_LINKS}
        onNavClick={onNavClick}
      />,
      'us'
    );

    await user.click(screen.getByText('Team'));

    // Then
    expect(onNavClick).toHaveBeenCalledWith('/us/team');
  });

  test('given user clicks nav link then onNavClick is called', async () => {
    // Given
    const { userEvent } = await import('@test-utils');
    const user = userEvent.setup();
    const onNavClick = vi.fn();
    const onOpen = vi.fn();
    const onClose = vi.fn();

    // When
    renderWithCountry(
      <MobileMenu
        opened
        onOpen={onOpen}
        onClose={onClose}
        navLinks={MOCK_NAV_LINKS}
        aboutLinks={MOCK_ABOUT_LINKS}
        onNavClick={onNavClick}
      />,
      'us'
    );

    const donateLinks = screen.getAllByText('Donate');
    await user.click(donateLinks[0]);

    // Then
    expect(onNavClick).toHaveBeenCalledWith('/us/donate');
  });
});
