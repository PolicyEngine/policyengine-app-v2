/**
 * Mock data and fixtures for MapDownloadMenu tests
 */

import { vi } from 'vitest';

// ============================================================================
// Test Constants
// ============================================================================

export const TEST_FILENAME = 'absolute-change-by-congressional-district';

export const MENU_LABELS = {
  DOWNLOAD_MAP: 'Download map',
  DOWNLOAD_PNG: 'Download PNG',
  DOWNLOAD_SVG: 'Download SVG',
} as const;

// ============================================================================
// Mock Export Functions
// ============================================================================

export const mockDownloadMapAsPng = vi.fn().mockResolvedValue(undefined);
export const mockDownloadMapAsSvg = vi.fn().mockResolvedValue(undefined);

/**
 * Reset all export function mocks to defaults
 */
export function resetExportMocks(): void {
  mockDownloadMapAsPng.mockReset().mockResolvedValue(undefined);
  mockDownloadMapAsSvg.mockReset().mockResolvedValue(undefined);
}

// ============================================================================
// Mock Ref Helpers
// ============================================================================

/**
 * Create a ref object pointing to a real DOM element
 */
export function createPopulatedRef(): React.RefObject<HTMLDivElement> {
  const element = document.createElement('div');
  return { current: element };
}

/**
 * Create a ref object with null current (no element attached)
 */
export function createNullRef(): React.RefObject<HTMLDivElement | null> {
  return { current: null };
}
