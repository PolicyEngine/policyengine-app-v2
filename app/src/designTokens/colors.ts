const cssVar = (name: string) => `var(${name})`;

/**
 * PolicyEngine color palette.
 *
 * Keep this runtime object in sync with @policyengine/ui-kit/theme.css while
 * existing inline styles are migrated to CSS utilities.
 */

export const colors = {
  primary: {
    50: '#E6FFFA',
    100: '#B2F5EA',
    200: '#81E6D9',
    300: '#4FD1C5',
    400: '#38B2AC',
    500: '#319795',
    600: '#2C7A7B',
    700: '#285E61',
    800: '#234E52',
    900: '#1D4044',
    alpha: {
      40: '#31979566',
      50: '#31979580',
      60: '#31979599',
    },
  },

  secondary: {
    50: '#F0F9FF',
    100: '#F2F4F7',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#344054',
    800: '#1E293B',
    900: '#101828',
  },

  warning: '#FEC601',
  error: '#EF4444',
  info: '#2C7A7B',

  white: '#FFFFFF',
  black: '#000000',

  gray: {
    50: '#F9FAFB',
    100: '#F2F4F7',
    200: '#E2E8F0',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#344054',
    800: '#1F2937',
    900: '#101828',
  },

  background: {
    primary: cssVar('--tw-color-bg-primary'),
    secondary: cssVar('--tw-color-bg-secondary'),
    tertiary: cssVar('--tw-color-bg-tertiary'),
    sider: cssVar('--tw-color-bg-primary'),
    elevated: cssVar('--tw-color-card'),
    accent: cssVar('--pe-color-surface-accent'),
    overlay: cssVar('--pe-color-surface-overlay'),
    hover: cssVar('--pe-color-surface-hover'),
  },

  text: {
    primary: cssVar('--tw-color-text-primary'),
    secondary: cssVar('--tw-color-text-secondary'),
    tertiary: cssVar('--tw-color-text-tertiary'),
    inverse: '#FFFFFF',
    title: cssVar('--tw-color-text-primary'),
    link: cssVar('--tw-color-text-link'),
    linkHover: cssVar('--tw-color-text-link-hover'),
    warning: '#d9480f',
  },

  teal: {
    500: '#319795',
  },

  border: {
    light: cssVar('--tw-color-border-light'),
    medium: cssVar('--tw-color-border-medium'),
    dark: cssVar('--tw-color-border-dark'),
  },

  shadow: {
    light: cssVar('--pe-shadow-light'),
    medium: cssVar('--pe-shadow-medium'),
    dark: cssVar('--pe-shadow-dark'),
  },
} as const;

export const TEAL_PRIMARY = colors.primary[500];
export const TEAL_ACCENT = '#39C6C0';

export const WARNING_YELLOW = colors.warning;
export const ERROR_RED = colors.error;
export const INFO_COLOR = colors.info;

export const BACKGROUND_PRIMARY = colors.background.primary;
export const BACKGROUND_SIDEBAR = colors.background.secondary;
export const BACKGROUND_TERTIARY = colors.background.tertiary;

export const TEXT_PRIMARY = colors.text.primary;
export const TEXT_SECONDARY = colors.text.secondary;
export const TEXT_TERTIARY = colors.text.tertiary;

export const BORDER_LIGHT = colors.border.light;

export type Colors = typeof colors;
