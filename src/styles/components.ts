// Components submodule for Mantine theme
import { Container, Title } from '@mantine/core';
import { colors, typography, spacing } from '../designTokens';
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
  Container: Container.extend({
    styles: (theme, params) => {
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
  ActionIcon: {
    defaultProps: themeDefaults.ActionIcon,
  },
  Title: Title.extend({
    styles: (theme, params) => {
      if (params.variant === 'colored') {
        return {
          root: {
            color: colors.primary[700],
          }
        }
      }
      return {};
    },
  }),
};