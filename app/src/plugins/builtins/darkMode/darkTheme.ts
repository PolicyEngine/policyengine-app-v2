/**
 * Dark Theme Configuration
 *
 * Defines the dark color scheme for the PolicyEngine app.
 * These colors are applied when the Dark Mode plugin is active.
 */

import type { MantineColorsTuple, MantineThemeOverride } from '@mantine/core';

/**
 * Dark gray color palette
 * Used for backgrounds and surfaces in dark mode
 */
const darkGray: MantineColorsTuple = [
  '#C1C2C5', // 0 - lightest (text on dark)
  '#A6A7AB', // 1
  '#909296', // 2
  '#5C5F66', // 3
  '#373A40', // 4 - borders
  '#2C2E33', // 5 - elevated surfaces
  '#25262B', // 6 - main background
  '#1A1B1E', // 7 - deeper background
  '#141517', // 8
  '#101113', // 9 - darkest
];

/**
 * Teal color adjusted for dark mode
 * Slightly brighter for better contrast on dark backgrounds
 */
const darkTeal: MantineColorsTuple = [
  '#E6FCF5', // 0
  '#C3FAE8', // 1
  '#96F2D7', // 2
  '#63E6BE', // 3
  '#38D9A9', // 4
  '#20C997', // 5 - primary
  '#12B886', // 6
  '#0CA678', // 7
  '#099268', // 8
  '#087F5B', // 9
];

/**
 * Get dark theme overrides for Mantine
 */
export function getDarkThemeOverrides(): MantineThemeOverride {
  return {
    colors: {
      dark: darkGray,
      primary: darkTeal,
    },
    primaryColor: 'primary',
    other: {
      // Custom property to indicate dark mode is active
      isDarkMode: true,
    },
  };
}

export { darkGray, darkTeal };
