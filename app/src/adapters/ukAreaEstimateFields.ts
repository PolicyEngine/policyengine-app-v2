import type { UKAreaImpact } from '@/types/metadata/UKAreaImpact';
import type { HexMapDataPoint } from '@/types/visualization/HexMapDataPoint';

/**
 * A UK area's estimate details for one change, as a hex map point carries
 * them: whether disclosure control published it as approximate, and the
 * change's 90% interval. Empty for results without them.
 */
export function areaEstimateFields(
  area: UKAreaImpact,
  valueField: 'average_household_income_change' | 'relative_household_income_change'
): Pick<HexMapDataPoint, 'approximate' | 'lower' | 'upper'> {
  const lower = area[`${valueField}_lower`];
  const upper = area[`${valueField}_upper`];
  return {
    ...(area.disclosure_tier === 'approximate' && { approximate: true }),
    ...(typeof lower === 'number' && typeof upper === 'number' && { lower, upper }),
  };
}
