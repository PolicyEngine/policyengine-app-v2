"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useInfiniteScroll({
  totalCount,
  initialCount = 8,
  incrementCount = 8,
}: {
  totalCount: number;
  initialCount?: number;
  incrementCount?: number;
}) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => {
    setVisibleCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + incrementCount, totalCount));
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [totalCount, incrementCount]);

  return {
    visibleCount: Math.min(visibleCount, totalCount),
    sentinelRef,
    hasMore: visibleCount < totalCount,
    reset,
  };
}
