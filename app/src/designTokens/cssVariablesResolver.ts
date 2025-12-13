/**
 * CSS Variables Resolver for Mantine
 *
 * Defines all PolicyEngine design tokens as CSS custom properties with
 * light and dark theme variants. This enables dark mode to work across
 * all components that use design tokens, not just Mantine components.
 *
 * Dark Mode Design Philosophy:
 * - Uses teal-tinted dark grays to maintain brand identity
 * - Follows elevation principle: surfaces get lighter as they elevate
 * - Off-white text (#E7E9EA) to reduce eye strain vs pure white
 * - Teal accent remains vibrant but slightly desaturated for harmony
 * - 4.5:1+ contrast ratio for accessibility (WCAG AA)
 *
 * The resolver is passed to MantineProvider's cssVariablesResolver prop.
 */

import type { CSSVariablesResolver } from '@mantine/core';

/**
 * Light theme color values
 * These are the default colors used in light mode
 */
const lightColors = {
  // Primary brand colors - teal
  'primary-50': '#E6FFFA',
  'primary-100': '#B2F5EA',
  'primary-200': '#81E6D9',
  'primary-300': '#4FD1C5',
  'primary-400': '#38B2AC',
  'primary-500': '#319795',
  'primary-600': '#2C7A7B',
  'primary-700': '#285E61',
  'primary-800': '#234E52',
  'primary-900': '#1D4044',
  'primary-alpha-40': 'rgba(49, 151, 149, 0.4)',
  'primary-alpha-50': 'rgba(49, 151, 149, 0.5)',
  'primary-alpha-60': 'rgba(49, 151, 149, 0.6)',

  // Secondary colors
  'secondary-50': '#F0F9FF',
  'secondary-100': '#F2F4F7',
  'secondary-200': '#E2E8F0',
  'secondary-300': '#CBD5E1',
  'secondary-400': '#94A3B8',
  'secondary-500': '#64748B',
  'secondary-600': '#475569',
  'secondary-700': '#344054',
  'secondary-800': '#1E293B',
  'secondary-900': '#101828',

  // Blue colors
  'blue-50': '#F0F9FF',
  'blue-100': '#E0F2FE',
  'blue-200': '#BAE6FD',
  'blue-300': '#7DD3FC',
  'blue-400': '#38BDF8',
  'blue-500': '#0EA5E9',
  'blue-600': '#0284C7',
  'blue-700': '#026AA2',
  'blue-800': '#075985',
  'blue-900': '#0C4A6E',

  // Semantic colors
  success: '#22C55E',
  warning: '#FEC601',
  error: '#EF4444',
  info: '#1890FF',

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',

  // Gray scale
  'gray-50': '#F9FAFB',
  'gray-100': '#F2F4F7',
  'gray-200': '#E2E8F0',
  'gray-300': '#D1D5DB',
  'gray-400': '#9CA3AF',
  'gray-500': '#6B7280',
  'gray-600': '#4B5563',
  'gray-700': '#344054',
  'gray-800': '#1F2937',
  'gray-900': '#101828',

  // Background colors
  'background-primary': '#FFFFFF',
  'background-secondary': '#F5F9FF',
  'background-tertiary': '#F1F5F9',
  'background-sider': '#FFFFFF',

  // Text colors
  'text-primary': '#000000',
  'text-secondary': '#5A5A5A',
  'text-tertiary': '#9CA3AF',
  'text-inverse': '#FFFFFF',
  'text-title': '#000000',

  // Border colors
  'border-light': '#E2E8F0',
  'border-medium': '#CBD5E1',
  'border-dark': '#94A3B8',

  // Shadow colors
  'shadow-light': 'rgba(16, 24, 40, 0.05)',
  'shadow-medium': 'rgba(16, 24, 40, 0.1)',
  'shadow-dark': 'rgba(16, 24, 40, 0.2)',

  // Static colors - these DO NOT change with theme
  // Use for brand elements on colored backgrounds (e.g., white text on teal header)
  'static-white': '#FFFFFF',
  'static-black': '#000000',

  // Header colors (light mode: teal header)
  'header-bg': '#2C7A7B',
  'header-text': '#FFFFFF',
  'header-border': '#285E61',

  // Hero section (light mode: warm teal to cream gradient from redesign)
  'hero-bg-start': '#ECFDF5',
  'hero-bg-end': '#FAFBFC',
  'hero-text': '#234E52',
  'hero-accent': '#319795',
  // Exact gradient strings from redesign
  'hero-gradient': `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(13, 148, 136, 0.15), transparent), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(13, 148, 136, 0.08), transparent), linear-gradient(180deg, #ECFDF5 0%, #FAFBFC 50%, #FAFBFC 100%)`,
  'hero-mesh': `radial-gradient(at 40% 20%, rgba(13, 148, 136, 0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(52, 211, 153, 0.1) 0px, transparent 40%), radial-gradient(at 0% 50%, rgba(13, 148, 136, 0.05) 0px, transparent 50%)`,

  // Card backgrounds for feature sections (light mode: white cards)
  'card-feature-bg': '#FFFFFF',
  'card-feature-border': '#E2E8F0',
  'card-feature-text': '#101828',
  'card-feature-description': '#5A5A5A',
  'card-feature-icon-bg': 'rgba(49, 151, 149, 0.1)',

  // CTA section (light mode: teal gradient)
  'cta-bg-start': '#2C7A7B',
  'cta-bg-end': '#319795',
  'cta-text': '#FFFFFF',

  // Logo/partner section (light mode: light background)
  'partner-bg': '#F5F9FF',
  'partner-text': '#5A5A5A',

  // Footer (light mode: teal)
  'footer-bg': '#2C7A7B',
  'footer-text': '#FFFFFF',
  'footer-border': '#285E61',

  // Button styles
  'button-primary-bg': '#2C7A7B',
  'button-primary-text': '#FFFFFF',
  'button-primary-hover': '#285E61',
  'button-secondary-bg': 'transparent',
  'button-secondary-text': '#FFFFFF',
  'button-secondary-border': '#FFFFFF',
};

/**
 * Dark theme color values
 *
 * Design rationale (from redesign worktree):
 * - Base background (#0A0F14): Rich navy-black
 * - Header/navbar uses dark teal (#0A3D38) not pure black
 * - Hero uses radial gradients with teal undertones
 * - Buttons use primary[500] (#0D9488) - vibrant teal
 * - Footer uses deepest teal (#042F2E)
 */
const darkColors = {
  // Primary brand colors - teal adjusted for dark backgrounds
  'primary-50': '#042F2E', // Deepest teal (footer bg)
  'primary-100': '#0A3D38', // Dark teal (navbar bg)
  'primary-200': '#115E59',
  'primary-300': '#134E4A',
  'primary-400': '#0F766E',
  'primary-500': '#0D9488', // Main button color
  'primary-600': '#14B8A6',
  'primary-700': '#2DD4BF',
  'primary-800': '#5EEAD4',
  'primary-900': '#99F6E4',
  'primary-alpha-40': 'rgba(13, 148, 136, 0.4)',
  'primary-alpha-50': 'rgba(13, 148, 136, 0.5)',
  'primary-alpha-60': 'rgba(13, 148, 136, 0.6)',

  // Secondary colors - navy palette for dark mode
  'secondary-50': '#0A0F14', // Deepest background
  'secondary-100': '#111827', // Elevated surface level 1
  'secondary-200': '#1F2937', // Elevated surface level 2
  'secondary-300': '#334155', // Elevated surface level 3 / borders
  'secondary-400': '#475569', // Muted elements
  'secondary-500': '#64748B', // Secondary text / icons
  'secondary-600': '#94A3B8', // Tertiary text
  'secondary-700': '#CBD5E1', // Subtle text
  'secondary-800': '#E2E8F0', // Body text
  'secondary-900': '#F1F5F9', // Primary text

  // Blue colors - adjusted for dark mode
  'blue-50': '#0C2D48',
  'blue-100': '#0E3A5C',
  'blue-200': '#0D4A70',
  'blue-300': '#0C5A8A',
  'blue-400': '#1D7ABF',
  'blue-500': '#58A6FF',
  'blue-600': '#79B8FF',
  'blue-700': '#A5D6FF',
  'blue-800': '#CAE8FF',
  'blue-900': '#E6F4FF',

  // Semantic colors
  success: '#34D399', // Green-teal accent
  warning: '#D29922',
  error: '#F85149',
  info: '#58A6FF',

  // Neutral colors - semantic swap for dark mode
  white: '#0A0F14', // "White" becomes the darkest background
  black: '#F1F5F9', // "Black" becomes the lightest text

  // Gray scale - navy-tinted dark grays
  'gray-50': '#0A0F14', // Base background
  'gray-100': '#111827', // Card/surface level 1
  'gray-200': '#1F2937', // Surface level 2
  'gray-300': '#334155', // Surface level 3 / borders
  'gray-400': '#475569', // Disabled state
  'gray-500': '#64748B', // Muted text / icons
  'gray-600': '#94A3B8', // Secondary icons
  'gray-700': '#CBD5E1', // Tertiary text
  'gray-800': '#E2E8F0', // Secondary text
  'gray-900': '#F1F5F9', // Primary text

  // Background colors - elevation-based
  'background-primary': '#0A0F14', // Main app background
  'background-secondary': '#111827', // Cards, modals, elevated surfaces
  'background-tertiary': '#1F2937', // Nested cards, hover states
  'background-sider': '#111827', // Sidebar background

  // Text colors - optimized for readability
  'text-primary': '#F1F5F9', // Main text - off-white
  'text-secondary': '#CBD5E1', // Secondary text
  'text-tertiary': '#94A3B8', // Muted text
  'text-inverse': '#0F172A', // Text on light/accent backgrounds
  'text-title': '#F1F5F9', // Titles

  // Border colors
  'border-light': '#1E293B', // Subtle borders
  'border-medium': '#334155', // Standard borders
  'border-dark': '#475569', // Emphasized borders

  // Shadow colors
  'shadow-light': 'rgba(0, 0, 0, 0.3)',
  'shadow-medium': 'rgba(0, 0, 0, 0.4)',
  'shadow-dark': 'rgba(0, 0, 0, 0.5)',

  // Static colors - these DO NOT change with theme
  'static-white': '#FFFFFF',
  'static-black': '#000000',

  // Header colors (dark mode: dark TEAL header, not black)
  'header-bg': '#0A3D38', // primary[900] - dark teal
  'header-text': '#FFFFFF',
  'header-border': '#115E59', // primary[800]

  // Hero section (dark mode: deep navy with teal accents from redesign)
  'hero-bg-start': '#0A1A1F',
  'hero-bg-end': '#0A0F14',
  'hero-text': '#F1F5F9',
  'hero-accent': '#34D399',
  // Exact gradient strings from redesign
  'hero-gradient': `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(13, 148, 136, 0.25), transparent), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(13, 148, 136, 0.12), transparent), linear-gradient(180deg, #0A1A1F 0%, #0A0F14 50%, #0A0F14 100%)`,
  'hero-mesh': `radial-gradient(at 40% 20%, rgba(13, 148, 136, 0.2) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(52, 211, 153, 0.15) 0px, transparent 40%), radial-gradient(at 0% 50%, rgba(13, 148, 136, 0.08) 0px, transparent 50%)`,

  // Card backgrounds for feature sections
  'card-feature-bg': '#111827',
  'card-feature-border': '#1E293B',
  'card-feature-text': '#F1F5F9',
  'card-feature-description': '#94A3B8',
  'card-feature-icon-bg': 'rgba(13, 148, 136, 0.2)',

  // CTA section (dark mode: teal gradient)
  'cta-bg-start': '#134E4A',
  'cta-bg-end': '#0F766E',
  'cta-text': '#FFFFFF',

  // Logo/partner section
  'partner-bg': '#0A0F14',
  'partner-text': '#94A3B8',

  // Footer (dark mode: deepest teal)
  'footer-bg': '#042F2E', // primary[950]
  'footer-text': '#F1F5F9',
  'footer-border': '#115E59',

  // Button styles (dark mode) - vibrant teal (matches teal[4] in theme)
  'button-primary-bg': '#0D9488',
  'button-primary-text': '#FFFFFF',
  'button-primary-hover': '#0F766E',
  'button-secondary-bg': 'transparent',
  'button-secondary-text': '#F1F5F9',
  'button-secondary-border': '#334155',
};

/**
 * Generate CSS variable declarations from a color map
 */
function generateVariables(
  colors: Record<string, string>
): Record<string, string> {
  const variables: Record<string, string> = {};
  for (const [key, value] of Object.entries(colors)) {
    variables[`--pe-${key}`] = value;
  }
  return variables;
}

/**
 * CSS Variables Resolver for Mantine
 *
 * This function is called by Mantine to generate CSS custom properties.
 * It returns different values based on the current color scheme (light/dark).
 */
export const cssVariablesResolver: CSSVariablesResolver = (theme) => ({
  variables: {
    // These are always the same regardless of color scheme
    '--pe-font-family': theme.fontFamily || 'inherit',
  },
  light: generateVariables(lightColors),
  dark: generateVariables(darkColors),
});

// Export the color maps for reference/testing
export { lightColors, darkColors };
