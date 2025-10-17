/**
 * Mock data and fixtures for testing useChartDimensions hooks
 */

// Mock window dimensions
export const MOCK_DESKTOP_WIDTH = 1920;
export const MOCK_DESKTOP_HEIGHT = 1080;
export const MOCK_TABLET_WIDTH = 768;
export const MOCK_TABLET_HEIGHT = 1024;
export const MOCK_MOBILE_WIDTH = 375;
export const MOCK_MOBILE_HEIGHT = 667;

// Mock container dimensions
export const MOCK_CONTAINER_WIDTH_LARGE = 800;
export const MOCK_CONTAINER_WIDTH_MEDIUM = 600;
export const MOCK_CONTAINER_WIDTH_SMALL = 400;

// Mock Mantine theme breakpoints (defaults)
export const MOCK_THEME_BREAKPOINTS = {
  xs: '36em', // 576px
  sm: '48em', // 768px
  md: '62em', // 992px
  lg: '75em', // 1200px
  xl: '88em', // 1408px
};

// Expected mobile detection results
// Note: Mantine's sm breakpoint is 48em = 768px
// So mobile is defined as < 768px
export const EXPECTED_MOBILE_AT_375 = true; // 375 < 768
export const EXPECTED_MOBILE_AT_768 = false; // 768 is not < 768
export const EXPECTED_MOBILE_AT_1920 = false; // 1920 is not < 768

// Helper to create mock ResizeObserver entry
export function createMockResizeObserverEntry(width: number, height: number = 400) {
  return {
    contentRect: {
      width,
      height,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      x: 0,
      y: 0,
    },
    target: document.createElement('div'),
    borderBoxSize: [],
    contentBoxSize: [],
    devicePixelContentBoxSize: [],
  };
}
