import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import {
  useChartWidth,
  useIsMobile,
  useWindowHeight,
} from '@/hooks/useChartDimensions';
import {
  EXPECTED_MOBILE_AT_1920,
  EXPECTED_MOBILE_AT_375,
  EXPECTED_MOBILE_AT_768,
  MOCK_CONTAINER_WIDTH_LARGE,
  MOCK_CONTAINER_WIDTH_MEDIUM,
  MOCK_CONTAINER_WIDTH_SMALL,
  MOCK_DESKTOP_HEIGHT,
  MOCK_DESKTOP_WIDTH,
  MOCK_MOBILE_HEIGHT,
  MOCK_MOBILE_WIDTH,
  MOCK_TABLET_WIDTH,
} from '@/tests/fixtures/hooks/useChartDimensionsMocks';
import { createRef } from 'react';

// Mock ResizeObserver
class MockResizeObserver {
  private callback: ResizeObserverCallback;
  private elements: Element[] = [];

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(element: Element) {
    this.elements.push(element);
  }

  unobserve(element: Element) {
    this.elements = this.elements.filter((el) => el !== element);
  }

  disconnect() {
    this.elements = [];
  }

  // Helper method to trigger resize
  trigger(width: number, height: number = 400) {
    const entries = this.elements.map((target) => ({
      target,
      contentRect: {
        width,
        height,
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        x: 0,
        y: 0,
        toJSON: () => ({ width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0 }),
      },
      borderBoxSize: [] as any,
      contentBoxSize: [] as any,
      devicePixelContentBoxSize: [] as any,
    }));
    this.callback(entries as any, this);
  }
}

describe('useChartDimensions', () => {
  let resizeObserver: MockResizeObserver;

  beforeEach(() => {
    // Set up ResizeObserver mock
    global.ResizeObserver = vi.fn((callback) => {
      resizeObserver = new MockResizeObserver(callback);
      return resizeObserver;
    }) as any;

    // Set up default window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: MOCK_DESKTOP_WIDTH,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: MOCK_DESKTOP_HEIGHT,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useChartWidth', () => {
    it('given container ref then returns initial width of 0', () => {
      // Given
      const containerRef = createRef<HTMLDivElement>();

      // When
      const { result } = renderHook(() => useChartWidth(containerRef));

      // Then
      expect(result.current).toBe(0);
    });

    it('given container is observed then updates width on resize', () => {
      // Given
      const containerRef = { current: document.createElement('div') };
      const { result } = renderHook(() => useChartWidth(containerRef));

      // When
      act(() => {
        resizeObserver.trigger(MOCK_CONTAINER_WIDTH_LARGE);
      });

      // Then
      expect(result.current).toBe(MOCK_CONTAINER_WIDTH_LARGE);
    });

    it('given container resizes multiple times then tracks width changes', () => {
      // Given
      const containerRef = { current: document.createElement('div') };
      const { result } = renderHook(() => useChartWidth(containerRef));

      // When - First resize
      act(() => {
        resizeObserver.trigger(MOCK_CONTAINER_WIDTH_LARGE);
      });

      // Then
      expect(result.current).toBe(MOCK_CONTAINER_WIDTH_LARGE);

      // When - Second resize
      act(() => {
        resizeObserver.trigger(MOCK_CONTAINER_WIDTH_MEDIUM);
      });

      // Then
      expect(result.current).toBe(MOCK_CONTAINER_WIDTH_MEDIUM);

      // When - Third resize
      act(() => {
        resizeObserver.trigger(MOCK_CONTAINER_WIDTH_SMALL);
      });

      // Then
      expect(result.current).toBe(MOCK_CONTAINER_WIDTH_SMALL);
    });

    it('given hook unmounts then disconnects observer', () => {
      // Given
      const containerRef = { current: document.createElement('div') };
      const { unmount } = renderHook(() => useChartWidth(containerRef));

      // When
      const disconnectSpy = vi.spyOn(resizeObserver, 'disconnect');
      unmount();

      // Then
      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('given null ref then returns 0 and does not error', () => {
      // Given
      const containerRef = { current: null };

      // When
      const { result } = renderHook(() => useChartWidth(containerRef));

      // Then
      expect(result.current).toBe(0);
    });
  });

  describe('useIsMobile', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MantineProvider>{children}</MantineProvider>
    );

    it('given desktop width then returns false', () => {
      // Given
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: MOCK_DESKTOP_WIDTH,
      });

      // When
      const { result } = renderHook(() => useIsMobile(), { wrapper });

      // Then
      expect(result.current).toBe(EXPECTED_MOBILE_AT_1920);
    });

    it('given mobile width then returns true', async () => {
      // Given
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: MOCK_MOBILE_WIDTH,
      });

      // When
      const { result } = renderHook(() => useIsMobile(), { wrapper });

      // Need to wait for the effect to run
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Then
      expect(result.current).toBe(EXPECTED_MOBILE_AT_375);
    });

    it('given tablet width at breakpoint then returns false', () => {
      // Given
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: MOCK_TABLET_WIDTH,
      });

      // When
      const { result } = renderHook(() => useIsMobile(), { wrapper });

      // Then
      expect(result.current).toBe(EXPECTED_MOBILE_AT_768);
    });

    it('given window resizes from desktop to mobile then updates state', async () => {
      // Given
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: MOCK_DESKTOP_WIDTH,
      });
      const { result } = renderHook(() => useIsMobile(), { wrapper });

      // When - Resize to mobile
      await act(async () => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: MOCK_MOBILE_WIDTH,
        });
        window.dispatchEvent(new Event('resize'));
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Then
      expect(result.current).toBe(true);
    });

    it('given window resizes from mobile to desktop then updates state', () => {
      // Given
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: MOCK_MOBILE_WIDTH,
      });
      const { result } = renderHook(() => useIsMobile(), { wrapper });

      // When - Resize to desktop
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: MOCK_DESKTOP_WIDTH,
        });
        window.dispatchEvent(new Event('resize'));
      });

      // Then
      expect(result.current).toBe(false);
    });
  });

  describe('useWindowHeight', () => {
    it('given initial render then returns current window height', () => {
      // Given
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: MOCK_DESKTOP_HEIGHT,
      });

      // When
      const { result } = renderHook(() => useWindowHeight());

      // Then
      expect(result.current).toBe(MOCK_DESKTOP_HEIGHT);
    });

    it('given window resizes then updates height', () => {
      // Given
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: MOCK_DESKTOP_HEIGHT,
      });
      const { result } = renderHook(() => useWindowHeight());

      // When
      act(() => {
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: MOCK_MOBILE_HEIGHT,
        });
        window.dispatchEvent(new Event('resize'));
      });

      // Then
      expect(result.current).toBe(MOCK_MOBILE_HEIGHT);
    });

    it('given multiple resize events then tracks height changes', () => {
      // Given
      const { result } = renderHook(() => useWindowHeight());
      const heights = [MOCK_DESKTOP_HEIGHT, MOCK_MOBILE_HEIGHT, 800, 600];

      heights.forEach((height) => {
        // When
        act(() => {
          Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: height,
          });
          window.dispatchEvent(new Event('resize'));
        });

        // Then
        expect(result.current).toBe(height);
      });
    });
  });
});
