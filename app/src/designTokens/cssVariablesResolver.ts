/**
 * CSS Variables Resolver for Mantine
 *
 * Defines all PolicyEngine design tokens as CSS custom properties with
 * light and dark theme variants. This enables dark mode to work across
 * all components that use design tokens, not just Mantine components.
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
};

/**
 * Dark theme color values
 * These colors are used when dark mode is active
 */
const darkColors = {
  // Primary brand colors - brighter teal for dark backgrounds
  'primary-50': '#087F5B',
  'primary-100': '#099268',
  'primary-200': '#0CA678',
  'primary-300': '#12B886',
  'primary-400': '#20C997',
  'primary-500': '#38D9A9',
  'primary-600': '#63E6BE',
  'primary-700': '#96F2D7',
  'primary-800': '#C3FAE8',
  'primary-900': '#E6FCF5',
  'primary-alpha-40': 'rgba(56, 217, 169, 0.4)',
  'primary-alpha-50': 'rgba(56, 217, 169, 0.5)',
  'primary-alpha-60': 'rgba(56, 217, 169, 0.6)',

  // Secondary colors - inverted for dark mode
  'secondary-50': '#101828',
  'secondary-100': '#1E293B',
  'secondary-200': '#344054',
  'secondary-300': '#475569',
  'secondary-400': '#64748B',
  'secondary-500': '#94A3B8',
  'secondary-600': '#CBD5E1',
  'secondary-700': '#E2E8F0',
  'secondary-800': '#F2F4F7',
  'secondary-900': '#F0F9FF',

  // Blue colors - adjusted for dark mode
  'blue-50': '#0C4A6E',
  'blue-100': '#075985',
  'blue-200': '#026AA2',
  'blue-300': '#0284C7',
  'blue-400': '#0EA5E9',
  'blue-500': '#38BDF8',
  'blue-600': '#7DD3FC',
  'blue-700': '#BAE6FD',
  'blue-800': '#E0F2FE',
  'blue-900': '#F0F9FF',

  // Semantic colors - slightly adjusted for dark backgrounds
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',

  // Neutral colors - swapped
  white: '#1A1B1E',
  black: '#E4E4E7',

  // Gray scale - inverted for dark mode
  'gray-50': '#101113',
  'gray-100': '#141517',
  'gray-200': '#1A1B1E',
  'gray-300': '#25262B',
  'gray-400': '#2C2E33',
  'gray-500': '#373A40',
  'gray-600': '#5C5F66',
  'gray-700': '#909296',
  'gray-800': '#A6A7AB',
  'gray-900': '#C1C2C5',

  // Background colors - dark variants
  'background-primary': '#1A1B1E',
  'background-secondary': '#141517',
  'background-tertiary': '#25262B',
  'background-sider': '#1A1B1E',

  // Text colors - inverted for dark mode
  'text-primary': '#E4E4E7',
  'text-secondary': '#A1A1AA',
  'text-tertiary': '#71717A',
  'text-inverse': '#18181B',
  'text-title': '#FAFAFA',

  // Border colors - dark variants
  'border-light': '#2C2E33',
  'border-medium': '#373A40',
  'border-dark': '#5C5F66',

  // Shadow colors - adjusted for dark mode
  'shadow-light': 'rgba(0, 0, 0, 0.2)',
  'shadow-medium': 'rgba(0, 0, 0, 0.3)',
  'shadow-dark': 'rgba(0, 0, 0, 0.4)',
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
