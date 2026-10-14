import { vi } from 'vitest';

/** Screen widths the v3 layouts change at. */
export const SCREEN_WIDTHS = {
  PHONE: 375,
  TABLET: 768,
  DESKTOP: 1280,
} as const;

/** Whether a screen this wide matches a query's (min-width / max-width: Npx) parts. */
function matchesWidth(query: string, width: number): boolean {
  const parts = [...query.matchAll(/\((min|max)-width:\s*(\d+)px\)/g)];
  return (
    parts.length > 0 &&
    parts.every(([, bound, px]) => (bound === 'min' ? width >= Number(px) : width <= Number(px)))
  );
}

/**
 * Answers `window.matchMedia` as a screen `width` pixels wide would: width
 * queries match by the width, every other query (reduced motion) does
 * not. Restore with `vi.restoreAllMocks()` or the returned spy.
 */
export function mockScreenWidth(width: number) {
  return vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: matchesWidth(query, width),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as MediaQueryList
  );
}
