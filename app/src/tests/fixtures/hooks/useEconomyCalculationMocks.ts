import { vi } from 'vitest';

// Test constants
export const GC_WORKFLOW_TIMEOUT = 25 * 60 * 1000; // 25 minutes

export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

export const TEST_POLICY_IDS = {
  REFORM: '123',
  BASELINE: '456',
} as const;

export const TEST_REGIONS = {
  ENHANCED_US: 'enhanced_us',
  STANDARD: 'standard',
} as const;

// Mock callbacks
export const mockOnSuccess = vi.fn();
export const mockOnError = vi.fn();
export const mockOnQueueUpdate = vi.fn();