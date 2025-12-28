import { typography } from '@policyengine/design-system';

// Defaults submodule for Mantine theme
export const themeDefaults = {
  Button: {
    radius: 'md',
    size: 'md',
  },
  Card: {
    radius: 'lg',
    shadow: 'xs',
  },
  Input: {
    radius: 'md',
    size: 'md',
  },
  Text: {
    size: 'md',
    lineHeight: '24',
  },
  Badge: {
    radius: 'xl',
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
