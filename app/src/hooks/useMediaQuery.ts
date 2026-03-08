import { useEffect, useState } from 'react';

/**
 * Custom hook that tracks whether a CSS media query matches.
 * Drop-in replacement for @mantine/hooks useMediaQuery.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
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
