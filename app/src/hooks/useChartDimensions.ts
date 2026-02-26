/**
 * Hooks for tracking chart dimensions and viewport state
 */

import { useEffect, useState } from 'react';

/** Media query string for mobile breakpoint — matches 'sm' (48em / 768px) */
export const MOBILE_BREAKPOINT_QUERY = '(max-width: 48em)';

/**
 * Hook to track chart container width using ResizeObserver
 * @param containerRef - Reference to the container element
 * @returns Current width of the container in pixels
 */
export function useChartWidth(containerRef: React.RefObject<HTMLDivElement | null>): number {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setWidth(entries[0].contentRect.width);
      }
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [containerRef]);

  return width;
}

/**
 * Hook to detect mobile viewport based on standard breakpoints
 * @returns true if viewport is mobile (< 768px), false otherwise
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // sm breakpoint = 48em = 768px
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

/**
 * Hook to get current window height
 * @returns Current window height in pixels
 */
export function useWindowHeight(): number {
  const [height, setHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 0);

  useEffect(() => {
    const handleResize = () => setHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return height;
}
