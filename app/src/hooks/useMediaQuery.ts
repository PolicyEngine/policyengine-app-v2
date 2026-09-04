import { useEffect, useState } from 'react';

/**
 * Custom hook that tracks whether a CSS media query matches.
 * Drop-in replacement for @mantine/hooks useMediaQuery.
 */
export function useMediaQuery(query: string): boolean {
  // matchMedia is missing under SSR and in jsdom; treat both as "no match".
  const [matches, setMatches] = useState<boolean>(
    () => typeof window !== 'undefined' && Boolean(window.matchMedia?.(query).matches)
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQueryList.addEventListener('change', handler);
    return () => {
      mediaQueryList.removeEventListener('change', handler);
    };
  }, [query]);

  return matches;
}
