/**
 * Blog component styling tokens.
 * Centralized color, typography, spacing, and shadow definitions
 * for markdown rendering in blog posts.
 */

import { colors, spacing, typography } from "@/designTokens";

export const blogColors = {
  primary: colors.primary[600],
  primaryLight: colors.background.accent,
  primaryHover: colors.primary[700],

  textPrimary: colors.text.primary,
  textSecondary: colors.text.secondary,
  textTertiary: colors.text.tertiary,
  textHeading: colors.text.title,
  textHeading2: colors.text.title,
  textHeading3: colors.text.primary,
  textHeading4: colors.text.secondary,

  backgroundPrimary: colors.background.primary,
  backgroundSecondary: colors.background.secondary,
  backgroundCode: colors.background.tertiary,
  backgroundCodeLabel: colors.background.tertiary,
  backgroundTable: colors.background.secondary,

  borderLight: colors.border.light,
  borderMedium: colors.border.medium,
  borderDark: colors.border.dark,

  link: colors.primary[600],
  linkHover: colors.primary[700],
  anchorLink: colors.text.tertiary,
} as const;

export const blogTypography = {
  headingFont: typography.fontFamily.primary,
  bodyFont: typography.fontFamily.primary,
  monoFont: typography.fontFamily.mono || "monospace",

  h1Desktop: "2.5rem",
  h1Mobile: "2rem",
  h2Desktop: "2rem",
  h2Mobile: "1.75rem",
  h3Desktop: "1.5rem",
  h3Mobile: "1.25rem",
  h4Desktop: "1.25rem",
  h4Mobile: "1.125rem",
  h5Desktop: "1.125rem",
  h5Mobile: "1rem",
  h6Desktop: "1rem",
  h6Mobile: "0.875rem",
  bodyDesktop: "18px",
  bodyMobile: "18px",
  smallDesktop: "0.875rem",
  smallMobile: "0.75rem",

  headingLineHeight: "1.3",
  bodyLineHeight: "1.6",

  bold: 700,
  semiBold: 600,
  medium: 500,
  regular: 400,
} as const;

export const blogSpacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  marginBottom: {
    paragraph: 8,
    list: 24,
    image: 25,
    table: 30,
    code: 24,
  },
  marginTop: {
    paragraph: 18,
    image: 25,
    heading1: 32,
    heading2: 28,
    heading3: 24,
    heading4: 20,
    list: 12,
    table: 30,
  },
  padding: {
    blockquote: 16,
    code: "2px 6px",
    codeBlock: 16,
    table: { cell: 8, header: 10 },
  },
} as const;

export const blogRadius = {
  none: spacing.radius.none,
  sm: spacing.radius.chip,
  md: spacing.radius.container,
  blockquote: `0 ${spacing.radius.element} ${spacing.radius.element} 0`,
} as const;

export const blogFontWeights = {
  regular: 400,
  medium: 500,
  semiBold: 600,
  bold: 700,
} as const;

export const blogBreakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const;

export const blogShadows = {
  image: "0 4px 12px rgba(0,0,0,0.08)",
  table: "0 4px 6px rgba(0,0,0,0.1)",
  tableCell: "0 1px 2px rgba(0,0,0,0.05)",
  codeBlock: "0 2px 8px rgba(0,0,0,0.05)",
  highlightedBlock: "0px 0px 10px 0px rgba(0,0,0,0.75)",
} as const;
