/**
 * useDisplayCategory Hook
 *
 * Determines the current display category (mobile, tablet, desktop)
 * for responsive rendering, replacing the old app's useDisplayCategory hook
 */

import { useMediaQuery } from '@mantine/hooks';
import type { DisplayCategory } from '@/types/blog';
import { blogBreakpoints } from './blogStyles';

/**
 * Returns the current display category based on viewport width
 *
 * @returns 'mobile' | 'tablet' | 'desktop'
 */
export function useDisplayCategory(): DisplayCategory {
  const isMobile = useMediaQuery(`(max-width: ${blogBreakpoints.mobile}px)`);
  const isTablet = useMediaQuery(`(max-width: ${blogBreakpoints.tablet}px)`);

  if (isMobile) {
    return 'mobile';
  }
  if (isTablet) {
    return 'tablet';
  }
  return 'desktop';
}
