// Components submodule for Mantine theme
import { Button, Card, Container, Title } from '@mantine/core';
import { colors, spacing, typography } from '../designTokens';
import { themeDefaults } from './defaults';

// TODO: Remove variants from components, as these do not work correctly;
// determine how to correctly code each case
export const themeComponents = {
  Text: {
    defaultProps: themeDefaults.Text,
    styles: {
      root: {
        fontFamily: typography.fontFamily.primary,
        color: colors.text.primary,
      },
    },
  },

  Badge: {
    styles: {
      root: {
        fontFamily: typography.fontFamily.primary,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        lineHeight: typography.lineHeight['20'],
        padding: spacing.component.badge.padding,
      },
    },
  },
  Container: Container.extend({
    styles: (_theme, params) => {
      if (params.variant === 'guttered') {
        return {
          root: {
            paddingLeft: spacing.container['2xl'],
            paddingRight: spacing.container['2xl'],
            paddingTop: spacing.container.lg,
            paddingBottom: spacing.container.lg,
          },
        };
      }
      return {};
    },
  }),
  Card: Card.extend({
    styles: (_theme, params) => {
      // Card List variants - compact styling for variable-length lists
      if (params.variant === 'cardList--active') {
        return {
          root: {
            padding: spacing.sm,
            backgroundColor: colors.secondary[100],
            border: `1px solid ${colors.primary[500]}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: colors.secondary[200],
              borderColor: colors.primary[600],
            },
          },
        };
      }

      if (params.variant === 'cardList--inactive') {
        return {
          root: {
            padding: spacing.sm,
            backgroundColor: colors.white,
            border: `1px solid ${colors.border.light}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: colors.gray[50],
              borderColor: colors.border.medium,
            },
          },
        };
      }

      // Setup Condition variants - for setup steps with fulfillment indicators
      if (params.variant === 'setupCondition--active') {
        return {
          root: {
            padding: spacing.md,
            marginBottom: spacing.md,
            backgroundColor: colors.secondary[100],
            border: `1px solid ${colors.primary[500]}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: colors.secondary[200],
              borderColor: colors.primary[600],
            },
          },
        };
      }

      if (params.variant === 'setupCondition--fulfilled') {
        return {
          root: {
            padding: spacing.md,
            marginBottom: spacing.md,
            backgroundColor: colors.white,
            border: `1px solid ${colors.border.light}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: colors.gray[50],
              borderColor: colors.border.medium,
            },
          },
        };
      }

      if (params.variant === 'setupCondition--unfulfilled') {
        return {
          root: {
            padding: spacing.md,
            marginBottom: spacing.md,
            backgroundColor: colors.white,
            border: `1px solid ${colors.border.light}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: colors.gray[50],
              borderColor: colors.border.medium,
            },
          },
        };
      }

      // Button Panel variants - for navigation/action panels with carets
      if (params.variant === 'buttonPanel--active') {
        return {
          root: {
            padding: spacing.md,
            marginBottom: spacing.md,
            backgroundColor: colors.secondary[100],
            border: `1px solid ${colors.primary[500]}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: colors.secondary[200],
              borderColor: colors.primary[600],
            },
          },
        };
      }

      if (params.variant === 'buttonPanel--inactive') {
        return {
          root: {
            padding: spacing.md,
            marginBottom: spacing.md,
            backgroundColor: colors.white,
            border: `1px solid ${colors.border.light}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: colors.gray[50],
              borderColor: colors.border.medium,
            },
          },
        };
      }

      // Legacy selection variants - kept for backward compatibility
      if (params.variant === 'selection--active') {
        return {
          root: {
            padding: spacing.md,
            marginBottom: spacing.md,
            backgroundColor: colors.secondary[100],
            border: `1px solid ${colors.primary[500]}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: colors.secondary[200],
              borderColor: colors.primary[600],
            },
          },
        };
      }

      if (params.variant === 'selection--inactive') {
        return {
          root: {
            padding: spacing.md,
            marginBottom: spacing.md,
            backgroundColor: colors.white,
            border: `1px solid ${colors.border.light}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: colors.gray[50],
              borderColor: colors.border.medium,
            },
          },
        };
      }

      return {};
    },
  }),
  ActionIcon: {
    defaultProps: themeDefaults.ActionIcon,
  },
  Title: Title.extend({
    styles: (_theme, params) => {
      if (params.variant === 'colored') {
        return {
          root: {
            color: colors.primary[700],
          },
        };
      }
      return {};
    },
  }),
  Button: Button.extend({
    styles: (_theme, params) => {
      if (params.variant === 'primary') {
        return {
          root: {
            backgroundColor: colors.teal[500],
            fontFamily: typography.fontFamily.primary,
            padding: spacing.md,
            borderRadius: spacing.radius.md,
            '&:hover': {
              backgroundColor: colors.gray[600],
            },
          },
        };
      }
      return {};
    },
  }),
};
