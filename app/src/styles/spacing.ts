// Spacing submodule for Mantine theme
import { spacing } from '../designTokens';

export const themeSpacing = {
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

  radius: {
    xs: spacing.radius.chip,
    sm: spacing.radius.element,
    md: spacing.radius.container,
    lg: spacing.radius.feature,
    xl: spacing.radius.feature,
  },

  shadows: {
    xs: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
    sm: '0px 1px 3px 0px rgba(16, 24, 40, 0.1)',
    md: '0px 4px 6px -1px rgba(16, 24, 40, 0.1)',
    lg: '0px 10px 15px -3px rgba(16, 24, 40, 0.1)',
    xl: '0px 20px 25px -5px rgba(16, 24, 40, 0.1)',
  },
};
