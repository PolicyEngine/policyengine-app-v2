import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useViewportSize } from '@/hooks/useViewportSize';

describe('useViewportSize', () => {
  it('returns initial viewport dimensions', () => {
    const { result } = renderHook(() => useViewportSize());
    expect(result.current).toEqual({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  });

  it('returns numeric width and height', () => {
    const { result } = renderHook(() => useViewportSize());
    expect(typeof result.current.width).toBe('number');
    expect(typeof result.current.height).toBe('number');
  });
});
