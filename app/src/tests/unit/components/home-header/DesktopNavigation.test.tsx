import { renderWithCountry, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import DesktopNavigation from '@/components/home-header/DesktopNavigation';
import {
  MOCK_ABOUT_LINKS,
  MOCK_LEARN_LINKS,
  MOCK_NAV_LINKS,
} from '@/tests/fixtures/components/home/HomeMocks';

describe('DesktopNavigation', () => {
  test('given nav links then displays nav items', () => {
    // Given
    const onNavClick = vi.fn();

    // When
    renderWithCountry(
      <DesktopNavigation
        navLinks={MOCK_NAV_LINKS}
        aboutLinks={MOCK_ABOUT_LINKS}
        learnLinks={MOCK_LEARN_LINKS}
        onNavClick={onNavClick}
      />,
      'us'
    );

    // Then
    expect(screen.getByText('Donate')).toBeInTheDocument();
  });

  test('given about links then displays About dropdown', async () => {
    // Given
    const { userEvent } = await import('@test-utils');
    const onNavClick = vi.fn();
    const user = userEvent.setup();

    // When
    renderWithCountry(
      <DesktopNavigation
        navLinks={MOCK_NAV_LINKS}
        aboutLinks={MOCK_ABOUT_LINKS}
        learnLinks={MOCK_LEARN_LINKS}
        onNavClick={onNavClick}
      />,
      'us'
    );
    await user.click(screen.getByText('About'));

    // Then
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Supporters')).toBeInTheDocument();
  });

  test('given user clicks nav link then callback is invoked', async () => {
    // Given
    const { userEvent } = await import('@test-utils');
    const onNavClick = vi.fn();
    const user = userEvent.setup();

    // When
    renderWithCountry(
      <DesktopNavigation
        navLinks={MOCK_NAV_LINKS}
        aboutLinks={MOCK_ABOUT_LINKS}
        learnLinks={MOCK_LEARN_LINKS}
        onNavClick={onNavClick}
      />,
      'us'
    );
    await user.click(screen.getByText('Donate'));

    // Then
    expect(onNavClick).toHaveBeenCalledWith('/us/donate');
  });

  test('given user clicks about link then callback is invoked', async () => {
    // Given
    const { userEvent } = await import('@test-utils');
    const onNavClick = vi.fn();
    const user = userEvent.setup();

    // When
    renderWithCountry(
      <DesktopNavigation
        navLinks={MOCK_NAV_LINKS}
        aboutLinks={MOCK_ABOUT_LINKS}
        learnLinks={MOCK_LEARN_LINKS}
        onNavClick={onNavClick}
      />,
      'us'
    );
    await user.click(screen.getByText('About'));
    await user.click(screen.getByText('Team'));

    // Then
    expect(onNavClick).toHaveBeenCalledWith('/us/team');
  });

  test('given user clicks Home then navigates to PolicyEngine homepage', async () => {
    // Given
    const { userEvent } = await import('@test-utils');
    const onNavClick = vi.fn();
    const user = userEvent.setup();

    // When
    renderWithCountry(
      <DesktopNavigation
        navLinks={MOCK_NAV_LINKS}
        aboutLinks={MOCK_ABOUT_LINKS}
        learnLinks={MOCK_LEARN_LINKS}
        onNavClick={onNavClick}
      />,
      'us'
    );
    await user.click(screen.getByText('Home'));

    // Then
    expect(onNavClick).toHaveBeenCalledWith('https://policyengine.org/us');
  });
});
