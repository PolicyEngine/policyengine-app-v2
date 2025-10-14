import { TextColumnConfig } from '@/components/columns/types';

// Test constants
export const DEFAULT_TEXT = 'Test content';

// Mock column configurations
export const DEFAULT_CONFIG: TextColumnConfig = {
  key: 'status',
  header: 'Status',
  type: 'text',
};

export const LARGE_SIZE_CONFIG: TextColumnConfig = {
  ...DEFAULT_CONFIG,
  size: 'lg',
};

export const BOLD_WEIGHT_CONFIG: TextColumnConfig = {
  ...DEFAULT_CONFIG,
  weight: 'bold',
};

export const RED_COLOR_CONFIG: TextColumnConfig = {
  ...DEFAULT_CONFIG,
  color: 'red',
};

export const STYLED_CONFIG: TextColumnConfig = {
  ...DEFAULT_CONFIG,
  size: 'sm',
  weight: 'semibold',
};

// Mock text values
export const mockTextValue = { text: DEFAULT_TEXT };
export const mockEmptyTextValue = { text: '' };
export const mockLoadingTextValue = { text: DEFAULT_TEXT, loading: true };
export const mockNotLoadingTextValue = { text: DEFAULT_TEXT, loading: false };
