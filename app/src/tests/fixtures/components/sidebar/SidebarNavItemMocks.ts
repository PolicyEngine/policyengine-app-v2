import { IconHome, IconSettings } from '@tabler/icons-react';

export const MOCK_NAV_ITEMS = {
  ACTIVE: {
    label: 'Reports',
    icon: IconHome,
    path: '/us/reports',
    isActive: true,
  },
  INACTIVE: {
    label: 'Policies',
    icon: IconSettings,
    path: '/us/policies',
    isActive: false,
  },
  EXTERNAL: {
    label: 'GitHub',
    icon: IconHome,
    path: 'https://github.com/PolicyEngine',
    external: true,
  },
  DISABLED: {
    label: 'Account settings',
    icon: IconSettings,
    path: '/us/account',
    disabled: true,
  },
} as const;
