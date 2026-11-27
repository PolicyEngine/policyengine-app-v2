import type { ReactNode } from 'react';
import { renderHook } from '@test-utils';
import { afterEach, describe, expect, test } from 'vitest';
import { LocationProvider, useCurrentPathname } from '@/contexts/LocationContext';

const PROVIDED_PATHNAME = '/uk/reforms';
const WINDOW_PATHNAME = '/us/callback';

afterEach(() => {
  window.history.pushState(null, '', '/');
});

describe('useCurrentPathname', () => {
  test("given a location provider then the pathname is the provider's", () => {
    // Given
    window.history.pushState(null, '', WINDOW_PATHNAME);

    // When
    const { result } = renderHook(() => useCurrentPathname(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <LocationProvider value={{ pathname: PROVIDED_PATHNAME, search: '' }}>
          {children}
        </LocationProvider>
      ),
    });

    // Then
    expect(result.current).toBe(PROVIDED_PATHNAME);
  });

  test("given no location provider then the pathname is the window's", () => {
    // Given
    window.history.pushState(null, '', WINDOW_PATHNAME);

    // When
    const { result } = renderHook(() => useCurrentPathname());

    // Then
    expect(result.current).toBe(WINDOW_PATHNAME);
  });
});
