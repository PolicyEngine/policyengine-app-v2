import { createTheme } from '@mantine/core';
import { themeColors, themeComponents, themeSpacing, themeTypography } from './styles';

export const policyEngineTheme = createTheme({
  // Colors from design tokens
  colors: themeColors,

  // Typography from design tokens
  fontFamily: themeTypography.fontFamily,
  fontFamilyMonospace: themeTypography.fontFamilyMonospace,
  fontSizes: themeTypography.fontSizes,
  lineHeights: themeTypography.lineHeights,

  // Spacing from design tokens
  spacing: themeSpacing.spacing,
  radius: themeSpacing.radius,
  shadows: themeSpacing.shadows,

  // Theme configuration
  // Use 'teal' instead of 'primary' because 'teal' has raw hex values
  // that Mantine can use for internal color calculations (hover states, etc.)
  // The 'primary' palette uses CSS variables which Mantine can't compute from
  primaryColor: 'teal',
  // Different shade indices for light vs dark mode:
  // - Light mode uses index 6 (#2C7A7B)
  // - Dark mode uses index 4 (#0D9488)
  primaryShade: { light: 6, dark: 4 },
  focusRing: 'auto',

  // Component styles from design tokens
  components: themeComponents,
});
