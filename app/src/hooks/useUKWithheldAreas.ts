import { useMemo } from 'react';
import {
  withheldUKAreasOf,
  type UKBreakdownWithheldAreas,
} from '@/adapters/ukLocalAreaBreakdownAdapter';
import { useRegions } from '@/hooks/useRegions';
import type { LocalAreaBreakdown } from '@/types/metadata/LocalAreaBreakdown';

/**
 * The areas a completed breakdown left out at each level, counted against
 * the UK region metadata where the lists allow (see countWithheldUKAreas).
 * Undefined without a breakdown: a saved result's areas are not
 * disclosure-controlled, so nothing is said about withheld areas.
 */
export function useUKWithheldAreas(
  breakdown: LocalAreaBreakdown | null,
  region: string | null | undefined
): UKBreakdownWithheldAreas | undefined {
  const { data: regions } = useRegions('uk');
  return useMemo(
    () => (breakdown ? withheldUKAreasOf(breakdown, region, regions ?? []) : undefined),
    [breakdown, region, regions]
  );
}
