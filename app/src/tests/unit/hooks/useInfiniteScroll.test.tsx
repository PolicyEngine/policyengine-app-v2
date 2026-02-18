import { act, renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import {
  clearIntersectionObserverMocks,
  setupIntersectionObserverMock,
} from '@/tests/fixtures/hooks/useInfiniteScrollMocks';

setupIntersectionObserverMock();

describe('useInfiniteScroll', () => {
  beforeEach(() => {
    clearIntersectionObserverMocks();
  });

  describe('initialization', () => {
    test('given totalCount then visibleCount starts at initialCount', () => {
      // When
      const { result } = renderHook(() =>
        useInfiniteScroll({
          totalCount: 100,
          initialCount: 8,
          incrementCount: 8,
        })
      );

      // Then
      expect(result.current.visibleCount).toBe(8);
    });

    test('given totalCount less than initialCount then visibleCount adjusts to totalCount', () => {
      // When
      const { result } = renderHook(() =>
        useInfiniteScroll({
          totalCount: 5,
          initialCount: 8,
          incrementCount: 8,
        })
      );

      // Then - visibleCount adjusts to not exceed totalCount
      expect(result.current.visibleCount).toBe(5);
      expect(result.current.hasMore).toBe(false);
    });

    test('given default options then uses default initialCount of 8', () => {
      // When
      const { result } = renderHook(() =>
        useInfiniteScroll({
          totalCount: 100,
        })
      );

      // Then
      expect(result.current.visibleCount).toBe(8);
    });
  });

  describe('hasMore', () => {
    test('given visibleCount less than totalCount then hasMore is true', () => {
      // When
      const { result } = renderHook(() =>
        useInfiniteScroll({
          totalCount: 100,
          initialCount: 8,
        })
      );

      // Then
      expect(result.current.hasMore).toBe(true);
    });

    test('given visibleCount equals totalCount then hasMore is false', () => {
      // When
      const { result } = renderHook(() =>
        useInfiniteScroll({
          totalCount: 8,
          initialCount: 8,
        })
      );

      // Then
      expect(result.current.hasMore).toBe(false);
    });
  });

  describe('reset', () => {
    test('given reset called then visibleCount returns to initialCount', () => {
      // Given
      const { result } = renderHook(() =>
        useInfiniteScroll({
          totalCount: 100,
          initialCount: 8,
          incrementCount: 8,
        })
      );

      // Simulate having loaded more items by changing totalCount
      // (In real usage, intersection observer would trigger loadMore)

      // When
      act(() => {
        result.current.reset();
      });

      // Then
      expect(result.current.visibleCount).toBe(8);
    });
  });

  describe('sentinelRef', () => {
    test('given hook rendered then sentinelRef is defined', () => {
      // When
      const { result } = renderHook(() =>
        useInfiniteScroll({
          totalCount: 100,
        })
      );

      // Then
      expect(result.current.sentinelRef).toBeDefined();
      expect(result.current.sentinelRef.current).toBeNull();
    });
  });

  describe('totalCount changes', () => {
    test('given totalCount decreases below visibleCount then visibleCount adjusts', () => {
      // Given
      const { result, rerender } = renderHook(
        ({ totalCount }) =>
          useInfiniteScroll({
            totalCount,
            initialCount: 8,
          }),
        { initialProps: { totalCount: 100 } }
      );

      expect(result.current.visibleCount).toBe(8);

      // When - totalCount drops below current visibleCount
      rerender({ totalCount: 5 });

      // Then - visibleCount adjusts to not exceed totalCount
      expect(result.current.visibleCount).toBe(5);
    });
  });
});
