import { useCallback, useEffect, useRef, useState } from 'react';

interface UseInfiniteScrollOptions {
  /** Number of items to show initially */
  initialCount?: number;
  /** Number of items to load on each scroll */
  incrementCount?: number;
  /** Total number of items available */
  totalCount: number;
  /** Margin before the sentinel becomes visible to trigger loading (e.g., '200px') */
  rootMargin?: string;
}

interface UseInfiniteScrollResult {
  /** Current number of visible items */
  visibleCount: number;
  /** Ref to attach to the sentinel element */
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Reset visible count (e.g., when filters change) */
  reset: () => void;
}

/**
 * Hook for implementing infinite scroll using Intersection Observer.
 *
 * Attach the sentinelRef to an invisible div at the end of your list.
 * When the user scrolls near it, more items become visible.
 *
 * @example
 * ```tsx
 * const { visibleCount, sentinelRef, hasMore } = useInfiniteScroll({
 *   totalCount: items.length,
 *   initialCount: 8,
 *   incrementCount: 8,
 * });
 *
 * return (
 *   <>
 *     <ItemGrid items={items.slice(0, visibleCount)} />
 *     {hasMore && <div ref={sentinelRef} />}
 *   </>
 * );
 * ```
 */
export function useInfiniteScroll({
  initialCount = 8,
  incrementCount = 8,
  totalCount,
  rootMargin = '200px',
}: UseInfiniteScrollOptions): UseInfiniteScrollResult {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = visibleCount < totalCount;

  const loadMore = useCallback(() => {
    setVisibleCount((current) => Math.min(current + incrementCount, totalCount));
  }, [incrementCount, totalCount]);

  const reset = useCallback(() => {
    setVisibleCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore, rootMargin]);

  // Reset when totalCount changes significantly (e.g., filter applied)
  useEffect(() => {
    if (visibleCount > totalCount) {
      setVisibleCount(Math.min(initialCount, totalCount));
    }
  }, [totalCount, visibleCount, initialCount]);

  return {
    visibleCount,
    sentinelRef,
    hasMore,
    reset,
  };
}
