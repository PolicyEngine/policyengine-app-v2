// Components submodule for Mantine theme
import { colors, typography, spacing } from '../designTokens';
import { themeDefaults } from './defaults';

export const themeComponents = {
  Button: {
    defaultProps: themeDefaults.Button,
    styles: {
      root: {
        fontFamily: typography.fontFamily.primary,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight['20'],
        borderRadius: spacing.radius.md,
        padding: spacing.component.button.padding,
        boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
        border: 'none',
        transition: 'all 0.2s ease',
      },
    },
    variants: {
      primary: () => ({
        root: {
          backgroundColor: colors.primary[500],
          color: colors.white,
          '&:hover': {
            backgroundColor: colors.primary[600],
          },
        },
      }),
      secondary: () => ({
        root: {
          backgroundColor: colors.white,
          color: colors.text.secondary,
          border: `1px solid ${colors.border.light}`,
          '&:hover': {
            backgroundColor: colors.background.secondary,
          },
        },
      }),
      ghost: () => ({
        root: {
          backgroundColor: 'transparent',
          color: colors.text.secondary,
          '&:hover': {
            backgroundColor: colors.background.secondary,
          },
        },
      }),
      accent: () => ({
        root: {
          backgroundColor: colors.warning,
          color: colors.black,
          '&:hover': {
            backgroundColor: '#E6B300',
          },
        },
      }),
    },
  },
  
  Text: {
    defaultProps: themeDefaults.Text,
    styles: {
      root: {
        fontFamily: typography.fontFamily.primary,
        color: colors.text.primary,
      },
    },
    variants: {
      heading: () => ({
        root: {
          fontFamily: typography.fontFamily.secondary,
          fontSize: typography.fontSize['3xl'],
          fontWeight: typography.fontWeight.bold,
          lineHeight: '1.33',
          color: colors.primary[900],
        },
      }),
      body: () => ({
        root: {
          fontFamily: typography.fontFamily.body,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.normal,
          lineHeight: typography.lineHeight['22'],
          color: colors.text.primary,
        },
      }),
      small: () => ({
        root: {
          fontFamily: typography.fontFamily.primary,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          lineHeight: typography.lineHeight['20'],
          color: colors.text.secondary,
        },
      }),
      caption: () => ({
        root: {
          fontFamily: typography.fontFamily.primary,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.normal,
          lineHeight: typography.lineHeight['24'],
          color: colors.text.secondary,
        },
      }),
    },
  },
  
  Badge: {
    defaultProps: themeDefaults.Badge,
    styles: {
      root: {
        fontFamily: typography.fontFamily.primary,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        lineHeight: typography.lineHeight['20'],
        padding: spacing.component.badge.padding,
      },
    },
    variants: {
      blue: () => ({
        root: {
          backgroundColor: colors.blue[50],
          color: colors.blue[700],
        },
      }),
      gray: () => ({
        root: {
          backgroundColor: colors.gray[100],
          color: colors.gray[700],
        },
      }),
    },
  },
};