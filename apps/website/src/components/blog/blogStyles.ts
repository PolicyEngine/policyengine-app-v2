/**
 * Blog Component Styling
 *
 * Color and typography mappings from the old app's style system
 * to the new Mantine-based design tokens
 */

import { colors, typography } from '@policyengine/design-system';

/**
 * Color palette for blog components
 * Centralized color definitions for markdown rendering
 */
export const blogColors = {
  // Primary brand colors
  primary: colors.primary[600],
  primaryLight: colors.primary[100],
  primaryHover: colors.primary[700],

  // Text colors (semantic naming)
  textPrimary: '#333', // Main body text
  textSecondary: '#555', // Muted text, quotes
  textTertiary: '#666', // Very muted (code labels)
  textHeading: '#222', // Headings (darkest)
  textHeading2: '#333', // H2 headings
  textHeading3: '#444', // H3 headings
  textHeading4: '#555', // H4 headings

  // Background colors (semantic naming)
  backgroundPrimary: colors.white, // Main content background
  backgroundSecondary: '#f9f9f9', // Light panels (quotes, footnotes)
  backgroundCode: '#f5f5f5', // Code blocks
  backgroundCodeLabel: '#f0f0f0', // Code language label
  backgroundTable: '#f2f2f2', // Alternate table rows

  // Border colors
  borderLight: '#f0f0f0', // Very light borders (h2)
  borderMedium: '#eee', // Medium borders (code blocks)
  borderDark: '#ddd', // Darker borders (footnotes, labels)

  // Link colors
  link: colors.primary[600],
  linkHover: colors.primary[700],

  // Anchor link colors (heading permalinks)
  anchorLink: colors.gray[400], // Subtle anchor links

  // Legacy color mappings (from old app - DEPRECATED, use semantic names above)
  /** @deprecated Use textHeading instead */
  blue: colors.primary[600],
  /** @deprecated Use textPrimary instead */
  darkGray: colors.gray[800],
  /** @deprecated Use textSecondary instead */
  gray: colors.gray[600],
  /** @deprecated Use backgroundCode or backgroundSecondary instead */
  lightGray: colors.gray[100],
  /** @deprecated Use anchorLink instead */
  mediumLightGray: colors.gray[400],
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
 * Border radius values (in pixels)
 */
export const blogRadius = {
  none: 0,
  sm: 2, // Links, code
  md: 8, // Images, tables, footnotes
  blockquote: '0 4px 4px 0', // Asymmetric for left-border effect
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
