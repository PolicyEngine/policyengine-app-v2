// Layout configurations using design tokens
import { colors, spacing, typography } from '.';

export const layoutConfig = {
  // Layout dimensions from Figma
  layout: {
    sidebar: spacing.layout.sidebar,
    header: spacing.layout.header,
    content: spacing.layout.content,
    container: spacing.layout.container,
  },

  // Sidebar configuration
  sidebar: {
    width: spacing.layout.sidebar,
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.light,
    headerHeight: spacing.layout.header,
    headerBackgroundColor: colors.primary[900],
  },

  // Header configuration
  header: {
    height: spacing.layout.header,
    backgroundColor: colors.white,
    borderColor: colors.border.light,
    padding: `${spacing.lg} ${spacing['4xl']}`,
  },

  // Component dimensions
  components: {
    button: {
      borderRadius: spacing.radius.md,
      padding: spacing.component.button.padding,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight['20'],
      height: spacing.component.button.height,
    },
    
    input: {
      borderRadius: spacing.radius.md,
      fontSize: typography.fontSize.sm,
      lineHeight: typography.lineHeight['20'],
      padding: spacing.component.input.padding,
      height: spacing.component.input.height,
    },
    
    badge: {
      borderRadius: spacing.radius['2xl'],
      padding: spacing.component.badge.padding,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight['20'],
    },
    
    menu: {
      itemHeight: spacing.component.menu.itemHeight,
      itemPadding: spacing.component.menu.itemPadding,
      fontSize: typography.fontSize.sm,
      lineHeight: typography.lineHeight['22'],
    },
    
    tab: {
      padding: spacing.component.tab.padding,
      fontSize: typography.fontSize.base,
      lineHeight: typography.lineHeight['24'],
      borderBottomWidth: '5px',
    },
  },
};
