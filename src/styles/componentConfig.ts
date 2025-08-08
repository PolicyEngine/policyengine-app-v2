// Component-specific styles using design tokens
import { colors, typography, spacing } from '../designTokens';

export const componentStyles = {
  // Button styles
  Button: {
    primary: {
      backgroundColor: colors.primary[500],
      color: colors.white,
      border: 'none',
      borderRadius: spacing.radius.md,
      padding: spacing.component.button.padding,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight['20'],
      fontFamily: typography.fontFamily.primary,
      boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
      '&:hover': {
        backgroundColor: colors.primary[600],
      },
    },
    accent: {
      backgroundColor: colors.warning,
      color: colors.black,
      border: 'none',
      borderRadius: spacing.radius.md,
      padding: spacing.component.button.padding,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight['20'],
      fontFamily: typography.fontFamily.primary,
      boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
      '&:hover': {
        backgroundColor: '#E6B300',
      },
    },
    
    secondary: {
      backgroundColor: colors.white,
      color: colors.text.secondary,
      border: `1px solid ${colors.border.light}`,
      borderRadius: spacing.radius.md,
      padding: spacing.component.button.padding,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight['20'],
      fontFamily: typography.fontFamily.primary,
      boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
      '&:hover': {
        backgroundColor: colors.background.secondary,
      },
    },
    
    ghost: {
      backgroundColor: 'transparent',
      color: colors.text.secondary,
      border: 'none',
      borderRadius: spacing.radius.md,
      padding: spacing.component.button.padding,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight['20'],
      fontFamily: typography.fontFamily.primary,
      '&:hover': {
        backgroundColor: colors.background.secondary,
      },
    },
  },

  // Text styles
  Text: {
    heading: {
      fontFamily: typography.fontFamily.secondary,
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: '1.33',
      color: colors.primary[900],
    },
    
    body: {
      fontFamily: typography.fontFamily.body,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight['22'],
      color: colors.text.primary,
    },
    
    small: {
      fontFamily: typography.fontFamily.primary,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight['20'],
      color: colors.text.secondary,
    },
    
    caption: {
      fontFamily: typography.fontFamily.primary,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight['24'],
      color: colors.text.secondary,
    },
  },

  // Badge styles
  Badge: {
    blue: {
      backgroundColor: colors.blue[50],
      color: colors.blue[700],
      borderRadius: spacing.radius['2xl'],
      padding: spacing.component.badge.padding,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight['20'],
      fontFamily: typography.fontFamily.primary,
    },
    
    gray: {
      backgroundColor: colors.gray[100],
      color: colors.gray[700],
      borderRadius: spacing.radius['2xl'],
      padding: spacing.component.badge.padding,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight['20'],
      fontFamily: typography.fontFamily.primary,
    },
  },
};
