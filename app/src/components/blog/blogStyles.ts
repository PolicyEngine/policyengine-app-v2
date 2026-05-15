/**
 * Blog Component Styling
 *
 * Color and typography mappings from the old app's style system
 * to the new Mantine-based design tokens
 */

import { colors, spacing, typography } from '@/designTokens';

/**
 * Color palette for blog components
 * Centralized color definitions for markdown rendering
 */
export const blogColors = {
  // Primary brand colors
  primary: colors.primary[600],
  primaryLight: colors.background.accent,
  primaryHover: colors.primary[700],

  // Text colors (semantic naming)
  textPrimary: colors.text.primary, // Main body text
  textSecondary: colors.text.secondary, // Muted text, quotes
  textTertiary: colors.text.tertiary, // Very muted (code labels)
  textHeading: colors.text.title, // Headings (darkest)
  textHeading2: colors.text.title, // H2 headings
  textHeading3: colors.text.primary, // H3 headings
  textHeading4: colors.text.secondary, // H4 headings

  // Background colors (semantic naming)
  backgroundPrimary: colors.background.primary, // Main content background
  backgroundSecondary: colors.background.secondary, // Light panels (quotes, footnotes)
  backgroundCode: colors.background.tertiary, // Code blocks
  backgroundCodeLabel: colors.background.tertiary, // Code language label
  backgroundTable: colors.background.secondary, // Alternate table rows

  // Border colors
  borderLight: colors.border.light, // Very light borders (h2)
  borderMedium: colors.border.medium, // Medium borders (code blocks)
  borderDark: colors.border.dark, // Darker borders (footnotes, labels)

  // Link colors
  link: colors.primary[600],
  linkHover: colors.primary[700],

  // Anchor link colors (heading permalinks)
  anchorLink: colors.text.tertiary, // Subtle anchor links

  // Legacy color mappings (from old app - DEPRECATED, use semantic names above)
  /** @deprecated Use textHeading instead */
  blue: colors.primary[600],
  /** @deprecated Use textPrimary instead */
  darkGray: colors.text.primary,
  /** @deprecated Use textSecondary instead */
  gray: colors.text.secondary,
  /** @deprecated Use backgroundCode or backgroundSecondary instead */
  lightGray: colors.background.tertiary,
  /** @deprecated Use anchorLink instead */
  mediumLightGray: colors.text.tertiary,
} as const;

/**
 * Typography settings for blog components
 */
export const blogTypography = {
  // Font families
  headingFont: typography.fontFamily.primary,
  bodyFont: typography.fontFamily.primary,
  monoFont: typography.fontFamily.mono || 'monospace',

  // Font sizes (responsive)
  h1Desktop: '2.5rem',
  h1Mobile: '2rem',
  h2Desktop: '2rem',
  h2Mobile: '1.75rem',
  h3Desktop: '1.5rem',
  h3Mobile: '1.25rem',
  h4Desktop: '1.25rem',
  h4Mobile: '1.125rem',
  h5Desktop: '1.125rem',
  h5Mobile: '1rem',
  h6Desktop: '1rem',
  h6Mobile: '0.875rem',
  bodyDesktop: '18px', // Standard text size
  bodyMobile: '18px', // Standard text size
  smallDesktop: '0.875rem',
  smallMobile: '0.75rem',

  // Line heights
  headingLineHeight: '1.3',
  bodyLineHeight: '1.6',

  // Font weights
  bold: 700,
  semiBold: 600,
  medium: 500,
  regular: 400,
} as const;

/**
 * Spacing values for blog components (in pixels for consistency with old app)
 */
export const blogSpacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  // Specific spacings from old app
  marginBottom: {
    paragraph: 8, // Reduced from 16px
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
    code: '2px 6px',
    codeBlock: 16,
    table: { cell: 8, header: 10 },
  },
} as const;

/**
 * Border radius values — mapped from design tokens
 */
export const blogRadius = {
  none: spacing.radius.none,
  sm: spacing.radius.chip,
  md: spacing.radius.container,
  blockquote: `0 ${spacing.radius.element} ${spacing.radius.element} 0`,
} as const;

/**
 * Font weight values
 */
export const blogFontWeights = {
  regular: 400,
  medium: 500,
  semiBold: 600,
  bold: 700,
} as const;

/**
 * Breakpoints for responsive design
 */
export const blogBreakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const;

/**
 * Shadow values (exact values from old app)
 */
export const blogShadows = {
  image: '0 4px 12px rgba(0,0,0,0.08)', // Images
  table: '0 4px 6px rgba(0,0,0,0.1)', // Tables
  tableCell: '0 1px 2px rgba(0,0,0,0.05)', // Table cells, inline code
  codeBlock: '0 2px 8px rgba(0,0,0,0.05)', // Code blocks
  highlightedBlock: '0px 0px 10px 0px rgba(0,0,0,0.75)', // Highlighted side-by-side blocks
} as const;
