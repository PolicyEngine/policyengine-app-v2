import { createTheme } from '@mantine/core';
import { colors, typography, spacing } from './theme';

export const policyEngineTheme = createTheme({
  // Colors from design tokens
  colors: {
    primary: [
      colors.primary[50],
      colors.primary[100],
      colors.primary[200],
      colors.primary[300],
      colors.primary[400],
      colors.primary[500],
      colors.primary[600],
      colors.primary[700],
      colors.primary[800],
      colors.primary[900],
    ],
    secondary: [
      colors.secondary[50],
      colors.secondary[100],
      colors.secondary[200],
      colors.secondary[300],
      colors.secondary[400],
      colors.secondary[500],
      colors.secondary[600],
      colors.secondary[700],
      colors.secondary[800],
      colors.secondary[900],
    ],
    blue: [
      colors.blue[50],
      colors.blue[100],
      colors.blue[200],
      colors.blue[300],
      colors.blue[400],
      colors.blue[500],
      colors.blue[600],
      colors.blue[700],
      colors.blue[800],
      colors.blue[900],
    ],
    gray: [
      colors.gray[50],
      colors.gray[100],
      colors.gray[200],
      colors.gray[300],
      colors.gray[400],
      colors.gray[500],
      colors.gray[600],
      colors.gray[700],
      colors.gray[800],
      colors.gray[900],
    ],
  },

  // Typography from design tokens
  fontFamily: typography.fontFamily.primary,
  fontFamilyMonospace: typography.fontFamily.mono,
  
  fontSizes: {
    xs: typography.fontSize.xs,
    sm: typography.fontSize.sm,
    md: typography.fontSize.base,
    lg: typography.fontSize.lg,
    xl: typography.fontSize.xl,
    '2xl': typography.fontSize['2xl'],
    '3xl': typography.fontSize['3xl'],
    '4xl': typography.fontSize['4xl'],
  },
  
  lineHeights: {
    xs: typography.lineHeight.tight,
    sm: typography.lineHeight.snug,
    md: typography.lineHeight.normal,
    lg: typography.lineHeight.relaxed,
    xl: typography.lineHeight.loose,
    '20': typography.lineHeight['20'],
    '22': typography.lineHeight['22'],
    '24': typography.lineHeight['24'],
  },
  
  fontWeights: {
    thin: typography.fontWeight.thin,
    light: typography.fontWeight.light,
    normal: typography.fontWeight.normal,
    medium: typography.fontWeight.medium,
    semibold: typography.fontWeight.semibold,
    bold: typography.fontWeight.bold,
    extrabold: typography.fontWeight.extrabold,
    black: typography.fontWeight.black,
  },

  // Spacing from design tokens
  spacing: {
    xs: spacing.xs,
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl,
    '2xl': spacing['2xl'],
    '3xl': spacing['3xl'],
    '4xl': spacing['4xl'],
    '5xl': spacing['5xl'],
  },
  
  // Border radius from design tokens
  radius: {
    xs: spacing.radius.xs,
    sm: spacing.radius.sm,
    md: spacing.radius.md,
    lg: spacing.radius.lg,
    xl: spacing.radius.xl,
    '2xl': spacing.radius['2xl'],
    '3xl': spacing.radius['3xl'],
    '4xl': spacing.radius['4xl'],
  },
  
  // Shadows from design
  shadows: {
    xs: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
    sm: '0px 1px 3px 0px rgba(16, 24, 40, 0.1)',
    md: '0px 4px 6px -1px rgba(16, 24, 40, 0.1)',
    lg: '0px 10px 15px -3px rgba(16, 24, 40, 0.1)',
    xl: '0px 20px 25px -5px rgba(16, 24, 40, 0.1)',
  },

  // Theme configuration
  primaryColor: 'primary',
  focusRing: 'auto',
  
  // Default props for components
  defaultProps: {
    Button: {
      radius: 'md',
      size: 'md',
    },
    Card: {
      radius: 'lg',
      shadow: 'xs',
    },
    Input: {
      radius: 'md',
      size: 'md',
    },
    Text: {
      size: 'md',
      lineHeight: '24',
    },
  },
});
