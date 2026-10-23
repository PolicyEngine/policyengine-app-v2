import { vi } from 'vitest';

/** Screen widths the v3 layouts change at. */
export const SCREEN_WIDTHS = {
  PHONE: 375,
  TABLET: 768,
  DESKTOP: 1280,
} as const;

/** CSS pixels in one unit of a width query; em and rem use the 16px default font size. */
const PX_PER_UNIT: Record<string, number> = { px: 1, em: 16, rem: 16 };

/**
 * Whether a screen this wide matches a query's (min-width / max-width: N
 * px | em | rem) parts. A width query in any other form throws, so a test
 * never gets the desktop layout without a warning.
 */
function matchesWidth(query: string, width: number): boolean {
  const parts = [...query.matchAll(/\((min|max)-width:\s*(\d+(?:\.\d+)?)(px|em|rem)\)/g)];
  if (parts.length === 0) {
    if (query.includes('width')) {
      throw new Error(`mockScreenWidth cannot read the width query "${query}"`);
    }
    return false;
  }
  return parts.every(([, bound, size, unit]) => {
    const px = Number(size) * PX_PER_UNIT[unit];
    return bound === 'min' ? width >= px : width <= px;
  });
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
