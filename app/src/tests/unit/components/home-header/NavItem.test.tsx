import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import NavItem from '@/components/home-header/NavItem';
import {
  MOCK_SIMPLE_NAV_ITEM,
  MOCK_DROPDOWN_NAV_ITEM,
} from '@/tests/fixtures/components/home-header/NavItemMocks';

describe('NavItem', () => {
  describe('Simple link behavior', () => {
    test('given simple nav item then displays label', () => {
      // Given/When
      render(<NavItem setup={MOCK_SIMPLE_NAV_ITEM} />);

      // Then
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    test('given simple nav item clicked then callback is invoked', async () => {
      // Given
      const user = userEvent.setup();
      const onClick = vi.fn();
      const navItem = { ...MOCK_SIMPLE_NAV_ITEM, onClick };

      // When
      render(<NavItem setup={navItem} />);
      await user.click(screen.getByText('Home'));

      // Then
      expect(onClick).toHaveBeenCalledOnce();
    });

    test('given simple nav item then renders as anchor', () => {
      // Given/When
      render(<NavItem setup={MOCK_SIMPLE_NAV_ITEM} />);

      // Then
      const link = screen.getByText('Home');
      expect(link.tagName).toBe('A');
    });
  });

  describe('Dropdown behavior', () => {
    test('given dropdown nav item then displays label with chevron', () => {
      // Given/When
      render(<NavItem setup={MOCK_DROPDOWN_NAV_ITEM} />);

      // Then
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    test('given dropdown nav item then does not show dropdown items initially', () => {
      // Given/When
      render(<NavItem setup={MOCK_DROPDOWN_NAV_ITEM} />);

      // Then
      expect(screen.queryByText('Team')).not.toBeInTheDocument();
      expect(screen.queryByText('Supporters')).not.toBeInTheDocument();
    });

    test('given dropdown clicked then shows dropdown items', async () => {
      // Given
      const user = userEvent.setup();
      render(<NavItem setup={MOCK_DROPDOWN_NAV_ITEM} />);

      // When
      await user.click(screen.getByText('About'));

      // Then
      expect(screen.getByText('Team')).toBeInTheDocument();
      expect(screen.getByText('Supporters')).toBeInTheDocument();
    });

    test('given dropdown item clicked then callback is invoked', async () => {
      // Given
      const user = userEvent.setup();
      const onTeamClick = vi.fn();
      const navItem = {
        ...MOCK_DROPDOWN_NAV_ITEM,
        dropdownItems: [
          { label: 'Team', onClick: onTeamClick },
          { label: 'Supporters', onClick: vi.fn() },
        ],
      };

      // When
      render(<NavItem setup={navItem} />);
      await user.click(screen.getByText('About'));
      await user.click(screen.getByText('Team'));

      // Then
      expect(onTeamClick).toHaveBeenCalledOnce();
    });

    test('given dropdown nav item with empty items then renders dropdown', async () => {
      // Given
      const user = userEvent.setup();
      const navItem = {
        label: 'Empty',
        onClick: vi.fn(),
        hasDropdown: true,
        dropdownItems: [],
      };

      // When
      render(<NavItem setup={navItem} />);
      await user.click(screen.getByText('Empty'));

      // Then
      expect(screen.getByText('Empty')).toBeInTheDocument();
    });

    test('given dropdown parent clicked then parent callback is invoked', async () => {
      // Given
      const user = userEvent.setup();
      const onParentClick = vi.fn();
      const navItem = { ...MOCK_DROPDOWN_NAV_ITEM, onClick: onParentClick };

      // When
      render(<NavItem setup={navItem} />);
      await user.click(screen.getByText('About'));

      // Then
      expect(onParentClick).toHaveBeenCalledOnce();
    });
  });

  describe('Edge cases', () => {
    test('given hasDropdown true but no dropdownItems then renders as simple link', () => {
      // Given
      const navItem = {
        label: 'NoItems',
        onClick: vi.fn(),
        hasDropdown: true,
        // No dropdownItems provided
      };

      // When
      render(<NavItem setup={navItem} />);

      // Then
      const link = screen.getByText('NoItems');
      expect(link.tagName).toBe('A');
    });

    test('given hasDropdown false with dropdownItems then renders as simple link', () => {
      // Given
      const navItem = {
        label: 'ShouldBeSimple',
        onClick: vi.fn(),
        hasDropdown: false,
        dropdownItems: [{ label: 'Hidden', onClick: vi.fn() }],
      };

      // When
      render(<NavItem setup={navItem} />);

      // Then
      const link = screen.getByText('ShouldBeSimple');
      expect(link.tagName).toBe('A');
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    });

    test('given multiple dropdown items then all are clickable', async () => {
      // Given
      const user = userEvent.setup();
      const onTeamClick = vi.fn();
      const onSupportersClick = vi.fn();
      const navItem = {
        ...MOCK_DROPDOWN_NAV_ITEM,
        dropdownItems: [
          { label: 'Team', onClick: onTeamClick },
          { label: 'Supporters', onClick: onSupportersClick },
        ],
      };

      // When
      render(<NavItem setup={navItem} />);
      await user.click(screen.getByText('About'));
      await user.click(screen.getByText('Team'));

      // Re-open dropdown for second item
      await user.click(screen.getByText('About'));
      await user.click(screen.getByText('Supporters'));

      // Then
      expect(onTeamClick).toHaveBeenCalledOnce();
      expect(onSupportersClick).toHaveBeenCalledOnce();
    });
  });
});
