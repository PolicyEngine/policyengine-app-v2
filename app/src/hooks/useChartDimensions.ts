/**
 * Hooks for tracking chart dimensions and viewport state
 */

import { useEffect, useState } from 'react';
import { useMantineTheme } from '@mantine/core';

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
 * Hook to detect mobile viewport based on Mantine theme breakpoints
 * @returns true if viewport is mobile (< sm breakpoint), false otherwise
 */
export function useIsMobile(): boolean {
  const theme = useMantineTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Convert em to pixels (1em = 16px by default)
      const smBreakpoint = String(theme.breakpoints.sm);
      const smInPixels = parseFloat(smBreakpoint) * 16;
      setIsMobile(window.innerWidth < smInPixels);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, [theme.breakpoints.sm]);

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
