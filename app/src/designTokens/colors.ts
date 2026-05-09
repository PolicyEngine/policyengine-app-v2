/**
 * Color tokens - use CSS variables instead
 * These are available in CSS as var(--color-primary-500), var(--color-teal-500), etc.
 * For runtime usage, access via getComputedStyle or use hardcoded values.
 */

// Hardcoded color values for runtime use (matches ui-kit theme.css)
export const colors = {
  primary: {
    50: "#E6FFFA",
    100: "#B2F5EA",
    200: "#81E6D9",
    300: "#4FD1C5",
    400: "#38B2AC",
    500: "#319795",
    600: "#2C7A7B",
    700: "#285E61",
    800: "#234E52",
    900: "#1D4044",
  },
  teal: {
    50: "#E6FFFA",
    100: "#B2F5EA",
    200: "#81E6D9",
    300: "#4FD1C5",
    400: "#38B2AC",
    500: "#319795",
    600: "#2C7A7B",
    700: "#285E61",
    800: "#234E52",
    900: "#1D4044",
  },
  gray: {
    50: "#F0F9FF",
    100: "#F2F4F7",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#344054",
    800: "#1E293B",
    900: "#101828",
  },
  blue: {
    50: "#F0F9FF",
    100: "#E0F2FE",
    200: "#BAE6FD",
    300: "#7DD3FC",
    400: "#38BDF8",
    500: "#0EA5E9",
    600: "#0284C7",
    700: "#026AA2",
    800: "#075985",
    900: "#0C4A6E",
  },
} as const;
