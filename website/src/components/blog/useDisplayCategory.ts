"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { DisplayCategory } from "@/types/blog";
import { blogBreakpoints } from "./blogStyles";

/**
 * Returns the current display category based on viewport width.
 * Defaults to "desktop" during SSR to avoid layout shift.
 */
export function useDisplayCategory(): DisplayCategory {
  const isMobile = useMediaQuery(`(max-width: ${blogBreakpoints.mobile}px)`);
  const isTablet = useMediaQuery(`(max-width: ${blogBreakpoints.tablet}px)`);

  if (isMobile) return "mobile";
  if (isTablet) return "tablet";
  return "desktop";
}
