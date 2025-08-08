import { createTheme } from '@mantine/core';
import { 
  themeColors, 
  themeTypography, 
  themeSpacing, 
  themeComponents, 
  themeDefaults 
} from './styles';

export const policyEngineTheme = createTheme({
  // Colors from design tokens
  colors: themeColors,
  
  // Typography from design tokens
  fontFamily: themeTypography.fontFamily,
  fontFamilyMonospace: themeTypography.fontFamilyMonospace,
  fontSizes: themeTypography.fontSizes,
  lineHeights: themeTypography.lineHeights,
  fontWeights: themeTypography.fontWeights,

  // Spacing from design tokens
  spacing: themeSpacing.spacing,
  radius: themeSpacing.radius,
  shadows: themeSpacing.shadows,

  // Theme configuration
  primaryColor: 'primary',
  focusRing: 'auto',
  
  // Default props for components
  defaultProps: themeDefaults,

  // Component styles from design tokens
  components: themeComponents,
});
