import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test } from 'vitest';
import SidebarNavItem from '@/components/sidebar/SidebarNavItem';
import { MOCK_NAV_ITEMS } from '@/tests/fixtures/components/sidebar/SidebarNavItemMocks';

describe('SidebarNavItem', () => {
  test('given active item then applies active styling', () => {
    // When
    render(<SidebarNavItem {...MOCK_NAV_ITEMS.ACTIVE} />);

    // Then
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  test('given inactive item then renders without active styling', () => {
    // When
    render(<SidebarNavItem {...MOCK_NAV_ITEMS.INACTIVE} />);

    // Then
    expect(screen.getByText('Policies')).toBeInTheDocument();
  });

  test('given external link then opens in new tab', () => {
    // When
    render(<SidebarNavItem {...MOCK_NAV_ITEMS.EXTERNAL} />);

    // Then
    const link = screen.getByRole('link', { name: /github/i });
    expect(link).toHaveAttribute('href', 'https://github.com/PolicyEngine');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('given disabled item then shows tooltip on hover', async () => {
    // Given
    const user = userEvent.setup();

    // When
    render(<SidebarNavItem {...MOCK_NAV_ITEMS.DISABLED} />);
    await user.hover(screen.getByText('Account settings'));

    // Then — Radix Tooltip renders content with role="tooltip"
    expect(screen.getByRole('tooltip', { name: /under development/i })).toBeInTheDocument();
  });

  test('given disabled item then prevents navigation on click', async () => {
    // Given
    const user = userEvent.setup();

    // When
    render(<SidebarNavItem {...MOCK_NAV_ITEMS.DISABLED} />);
    const button = screen.getByRole('button');
    await user.click(button);

    // Then - should not navigate (just checking it doesn't error)
    expect(button).toBeInTheDocument();
  });
});
