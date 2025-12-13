/**
 * Design Token Colors
 *
 * These colors are defined as CSS variable references, allowing them to
 * automatically adapt to the current color scheme (light/dark mode).
 *
 * The actual color values are defined in cssVariablesResolver.ts and
 * injected by Mantine's CSS variables system.
 *
 * Usage:
 *   import { colors } from '@/designTokens';
 *   style={{ color: colors.text.primary }}
 *
 * This will output: color: var(--pe-text-primary)
 * And CSS will resolve to the appropriate light or dark value.
 */

export const colors = {
  // Primary brand colors - teal
  primary: {
    50: 'var(--pe-primary-50)',
    100: 'var(--pe-primary-100)',
    200: 'var(--pe-primary-200)',
    300: 'var(--pe-primary-300)',
    400: 'var(--pe-primary-400)',
    500: 'var(--pe-primary-500)',
    600: 'var(--pe-primary-600)',
    700: 'var(--pe-primary-700)',
    800: 'var(--pe-primary-800)',
    900: 'var(--pe-primary-900)',
    alpha: {
      40: 'var(--pe-primary-alpha-40)',
      50: 'var(--pe-primary-alpha-50)',
      60: 'var(--pe-primary-alpha-60)',
    },
  },

  // Secondary colors
  secondary: {
    50: 'var(--pe-secondary-50)',
    100: 'var(--pe-secondary-100)',
    200: 'var(--pe-secondary-200)',
    300: 'var(--pe-secondary-300)',
    400: 'var(--pe-secondary-400)',
    500: 'var(--pe-secondary-500)',
    600: 'var(--pe-secondary-600)',
    700: 'var(--pe-secondary-700)',
    800: 'var(--pe-secondary-800)',
    900: 'var(--pe-secondary-900)',
  },

  // Blue colors
  blue: {
    50: 'var(--pe-blue-50)',
    100: 'var(--pe-blue-100)',
    200: 'var(--pe-blue-200)',
    300: 'var(--pe-blue-300)',
    400: 'var(--pe-blue-400)',
    500: 'var(--pe-blue-500)',
    600: 'var(--pe-blue-600)',
    700: 'var(--pe-blue-700)',
    800: 'var(--pe-blue-800)',
    900: 'var(--pe-blue-900)',
  },

  // Semantic colors
  success: 'var(--pe-success)',
  warning: 'var(--pe-warning)',
  error: 'var(--pe-error)',
  info: 'var(--pe-info)',

  // Neutral colors
  white: 'var(--pe-white)',
  black: 'var(--pe-black)',

  // Gray scale
  gray: {
    50: 'var(--pe-gray-50)',
    100: 'var(--pe-gray-100)',
    200: 'var(--pe-gray-200)',
    300: 'var(--pe-gray-300)',
    400: 'var(--pe-gray-400)',
    500: 'var(--pe-gray-500)',
    600: 'var(--pe-gray-600)',
    700: 'var(--pe-gray-700)',
    800: 'var(--pe-gray-800)',
    900: 'var(--pe-gray-900)',
  },

  // Background colors
  background: {
    primary: 'var(--pe-background-primary)',
    secondary: 'var(--pe-background-secondary)',
    tertiary: 'var(--pe-background-tertiary)',
    sider: 'var(--pe-background-sider)',
  },

  // Text colors
  text: {
    primary: 'var(--pe-text-primary)',
    secondary: 'var(--pe-text-secondary)',
    tertiary: 'var(--pe-text-tertiary)',
    inverse: 'var(--pe-text-inverse)',
    title: 'var(--pe-text-title)',
  },

  // Teal (alias for primary)
  teal: {
    500: 'var(--pe-primary-500)',
  },

  // Border colors
  border: {
    light: 'var(--pe-border-light)',
    medium: 'var(--pe-border-medium)',
    dark: 'var(--pe-border-dark)',
  },

  // Shadow colors
  shadow: {
    light: 'var(--pe-shadow-light)',
    medium: 'var(--pe-shadow-medium)',
    dark: 'var(--pe-shadow-dark)',
  },

  // Static colors - these DO NOT change with theme
  // Use for brand elements on colored backgrounds (e.g., white text on teal header/footer)
  static: {
    white: 'var(--pe-static-white)',
    black: 'var(--pe-static-black)',
  },

  // Header colors - adapts to light/dark mode
  header: {
    bg: 'var(--pe-header-bg)',
    text: 'var(--pe-header-text)',
    border: 'var(--pe-header-border)',
  },

  // Hero section colors
  hero: {
    bgStart: 'var(--pe-hero-bg-start)',
    bgEnd: 'var(--pe-hero-bg-end)',
    text: 'var(--pe-hero-text)',
    accent: 'var(--pe-hero-accent)',
    gradient: 'var(--pe-hero-gradient)',
    mesh: 'var(--pe-hero-mesh)',
  },

  // Feature card colors
  cardFeature: {
    bg: 'var(--pe-card-feature-bg)',
    border: 'var(--pe-card-feature-border)',
    text: 'var(--pe-card-feature-text)',
    description: 'var(--pe-card-feature-description)',
    iconBg: 'var(--pe-card-feature-icon-bg)',
  },

  // CTA section colors
  cta: {
    bgStart: 'var(--pe-cta-bg-start)',
    bgEnd: 'var(--pe-cta-bg-end)',
    text: 'var(--pe-cta-text)',
  },

  // Partner/logo section colors
  partner: {
    bg: 'var(--pe-partner-bg)',
    text: 'var(--pe-partner-text)',
  },

  // Footer colors
  footer: {
    bg: 'var(--pe-footer-bg)',
    text: 'var(--pe-footer-text)',
    border: 'var(--pe-footer-border)',
  },

  // Button colors
  button: {
    primaryBg: 'var(--pe-button-primary-bg)',
    primaryText: 'var(--pe-button-primary-text)',
    primaryHover: 'var(--pe-button-primary-hover)',
    secondaryBg: 'var(--pe-button-secondary-bg)',
    secondaryText: 'var(--pe-button-secondary-text)',
    secondaryBorder: 'var(--pe-button-secondary-border)',
  },
};

/**
 * Raw color values for cases where CSS variables won't work
 * (e.g., in JavaScript calculations, canvas rendering, etc.)
 *
 * Use sparingly - prefer the CSS variable-based `colors` export.
 */
export const rawColors = {
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
  },
  white: '#FFFFFF',
  black: '#000000',
  success: '#22C55E',
  warning: '#FEC601',
  error: '#EF4444',
  info: '#1890FF',
};
