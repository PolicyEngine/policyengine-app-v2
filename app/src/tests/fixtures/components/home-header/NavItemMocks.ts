import { vi } from 'vitest';
import { NavItemSetup } from '@/components/home-header/NavItem';

export const MOCK_SIMPLE_NAV_ITEM: NavItemSetup = {
  label: 'Home',
  onClick: vi.fn(),
  hasDropdown: false,
};

export const MOCK_DROPDOWN_NAV_ITEM: NavItemSetup = {
  label: 'About',
  onClick: vi.fn(),
  hasDropdown: true,
  dropdownItems: [
    { label: 'Team', onClick: vi.fn() },
    { label: 'Supporters', onClick: vi.fn() },
  ],
};

export const MOCK_EMPTY_DROPDOWN_NAV_ITEM: NavItemSetup = {
  label: 'Empty',
  onClick: vi.fn(),
  hasDropdown: true,
  dropdownItems: [],
};
