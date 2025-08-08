// Typography submodule for Mantine theme
import { typography } from '../designTokens';

export const themeTypography = {
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
};
