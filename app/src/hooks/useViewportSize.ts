import { useEffect, useState } from 'react';

interface ViewportSize {
  width: number;
  height: number;
}

function getViewportSize(): ViewportSize {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * Custom hook that tracks the viewport dimensions.
 * Drop-in replacement for @mantine/hooks useViewportSize.
 */
export function useViewportSize(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>(getViewportSize);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let rafId: number;
    const handler = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setSize(getViewportSize());
      });
    };

    window.addEventListener('resize', handler);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handler);
    };
  }, []);

  return size;
}
