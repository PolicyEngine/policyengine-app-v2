/**
 * Mock data and fixtures for mapExportUtils tests
 */

import { vi } from 'vitest';

// ============================================================================
// Test Constants
// ============================================================================

export const TEST_FILENAMES = {
  ABSOLUTE_DISTRICT: 'absolute-change-by-congressional-district',
  RELATIVE_CONSTITUENCY: 'relative-change-by-constituency',
} as const;

export const TEST_DATA_URLS = {
  PNG: 'data:image/png;base64,mockPngData',
  SVG: 'data:image/svg+xml;charset=utf-8,mockSvgData',
} as const;

export const DEFAULT_BACKGROUND_COLOR = '#ffffff';
export const CUSTOM_BACKGROUND_COLOR = '#f0f0f0';
export const DEFAULT_PIXEL_RATIO = 2;
export const CUSTOM_PIXEL_RATIO = 3;

// ============================================================================
// Mock html-to-image Functions
// ============================================================================

export const mockToPng = vi.fn().mockResolvedValue(TEST_DATA_URLS.PNG);
export const mockToSvg = vi.fn().mockResolvedValue(TEST_DATA_URLS.SVG);

/**
 * Reset all html-to-image mocks to defaults
 */
export function resetHtmlToImageMocks(): void {
  mockToPng.mockReset().mockResolvedValue(TEST_DATA_URLS.PNG);
  mockToSvg.mockReset().mockResolvedValue(TEST_DATA_URLS.SVG);
}

// ============================================================================
// Mock DOM Elements
// ============================================================================

/**
 * Create a mock container div with optional child elements
 */
export function createMockContainer(options?: {
  withTooltip?: boolean;
  withMultipleExcluded?: boolean;
}): HTMLDivElement {
  const container = document.createElement('div');

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  container.appendChild(svg);

  if (options?.withTooltip) {
    const tooltip = document.createElement('div');
    tooltip.setAttribute('data-export-exclude', '');
    tooltip.textContent = 'Tooltip content';
    container.appendChild(tooltip);
  }

  if (options?.withMultipleExcluded) {
    for (let i = 0; i < 3; i++) {
      const excluded = document.createElement('div');
      excluded.setAttribute('data-export-exclude', '');
      excluded.textContent = `Excluded ${i}`;
      container.appendChild(excluded);
    }
  }

  return container;
}

// ============================================================================
// Mock Link Element for Download Verification
// ============================================================================

export const mockLinkClick = vi.fn();

/**
 * Spy on HTMLAnchorElement.prototype.click and capture anchor elements
 * created by triggerDownload so we can verify href/download properties.
 */
export function setupDownloadSpy(): {
  getLastAnchor: () => HTMLAnchorElement | null;
} {
  let lastAnchor: HTMLAnchorElement | null = null;

  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation(
    (tag: string, options?: ElementCreationOptions) => {
      const el = originalCreateElement(tag, options);
      if (tag === 'a') {
        lastAnchor = el as HTMLAnchorElement;
        vi.spyOn(el, 'click').mockImplementation(mockLinkClick);
      }
      return el;
    }
  );

  return {
    getLastAnchor: () => lastAnchor,
  };
}
