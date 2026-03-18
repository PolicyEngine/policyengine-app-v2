import { typography } from '../designTokens';

// Defaults submodule for Mantine theme
export const themeDefaults = {
  Button: {
    radius: 'md',
    size: 'md',
  },
  Card: {
    radius: 'md',
    shadow: 'xs',
  },
  Input: {
    radius: 'sm',
    size: 'md',
  },
  Text: {
    size: 'md',
    lineHeight: '24',
  },
  Badge: {
    radius: 'lg',
    size: 'md',
  },
  ActionIcon: {
    size: 'input-sm',
  },
};

// Global styles for HTML elements
export const globalStyles = {
  em: {
    fontStyle: 'italic',
  },
  strong: {
    fontWeight: typography.fontWeight.bold,
  },
};
