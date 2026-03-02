import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDisclosure } from '@/hooks/useDisclosure';

describe('useDisclosure', () => {
  it('starts closed by default', () => {
    const { result } = renderHook(() => useDisclosure());
    expect(result.current[0]).toBe(false);
  });

  it('starts open when initialState is true', () => {
    const { result } = renderHook(() => useDisclosure(true));
    expect(result.current[0]).toBe(true);
  });

  it('opens', () => {
    const { result } = renderHook(() => useDisclosure());
    act(() => result.current[1].open());
    expect(result.current[0]).toBe(true);
  });

  it('closes', () => {
    const { result } = renderHook(() => useDisclosure(true));
    act(() => result.current[1].close());
    expect(result.current[0]).toBe(false);
  });

  it('toggles', () => {
    const { result } = renderHook(() => useDisclosure());
    act(() => result.current[1].toggle());
    expect(result.current[0]).toBe(true);
    act(() => result.current[1].toggle());
    expect(result.current[0]).toBe(false);
  });
});
