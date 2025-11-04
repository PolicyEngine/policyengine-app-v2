import { vi } from 'vitest';
import { NavItemSetup } from '@/components/home-header/NavItem';

export const MOCK_NAV_ITEMS: NavItemSetup[] = [
  {
    label: 'Home',
    onClick: vi.fn(),
    hasDropdown: false,
  },
  {
    label: 'Blog',
    onClick: vi.fn(),
    hasDropdown: false,
  },
  {
    label: 'About',
    onClick: vi.fn(),
    hasDropdown: true,
    dropdownItems: [
      { label: 'Team', onClick: vi.fn() },
      { label: 'Supporters', onClick: vi.fn() },
    ],
  },
  {
    label: 'Donate',
    onClick: vi.fn(),
    hasDropdown: false,
  },
];

export const EXPECTED_TEXT = {
  US: {
    HERO_TITLE: 'Computing public policy for everyone',
    SUBTITLE: 'Understand and analyze the impacts of tax and benefit policies',
    TRANSFORMATION: 'Transforming how policy professionals analyze and implement',
  },
  UK: {
    HERO_TITLE: 'Computing public policy for everyone',
    SUBTITLE: 'Understand and analyse the impacts of tax and benefit policies',
    TRANSFORMATION: 'Transforming how policy professionals analyse and implement',
  },
} as const;
