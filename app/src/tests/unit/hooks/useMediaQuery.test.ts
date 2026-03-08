import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMediaQuery } from '@/hooks/useMediaQuery';

describe('useMediaQuery', () => {
  it('returns false by default (jsdom mock)', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('calls window.matchMedia with the query', () => {
    renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 768px)');
  });
});
