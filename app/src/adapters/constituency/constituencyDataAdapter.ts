import { areaEstimateFields } from '@/adapters/ukAreaEstimateFields';
import type { UKAreaChoroplethDataPoint } from '@/components/visualization/choropleth/types';
import type { ReportOutputSocietyWideByConstituency } from '@/types/metadata/ReportOutputSocietyWideByConstituency';

/**
 * Transform API constituency data to map points
 *
 * Converts the raw constituency impact data from the API response into
 * one point per area for the geographic and hexagonal maps.
 *
 * @param apiData - Raw constituency impact data from API (uses existing type)
 * @param valueField - Which field to use as the value ('average_household_income_change' or 'relative_household_income_change')
 * @returns One point per area for the geographic and hex maps; the hex map places each by its code (placeOnUKHexLayout)
 *
 * @example
 * ```typescript
 * const apiData = {
 *   'Westminster North': {
 *     average_household_income_change: 1234.56,
 *     relative_household_income_change: 0.025
 *   }
 * };
 *
 * const points = transformConstituencyData(apiData, 'average_household_income_change');
 * // points[0] = {
 * //   id: 'Westminster North',
 * //   label: 'Westminster North',
 * //   value: 1234.56
 * // }
 * ```
 */
export function transformConstituencyData(
  apiData: ReportOutputSocietyWideByConstituency,
  valueField: 'average_household_income_change' | 'relative_household_income_change'
): UKAreaChoroplethDataPoint[] {
  return Object.entries(apiData).map(([constituencyName, data]) => ({
    id: constituencyName,
    label: constituencyName,
    value: data[valueField],
    ...(data.code && { code: data.code }),
    ...areaEstimateFields(data, valueField),
  }));
}

/**
 * Extract average income change data for hexagonal map
 *
 * Convenience function that transforms constituency data using the
 * average household income change field.
 *
 * @param apiData - Raw constituency impact data from API
 * @returns One point per area, with its average income change
 *
 * @example
 * ```typescript
 * const apiData = output.constituency_impact?.by_constituency;
 * const hexMapData = transformConstituencyAbsoluteChange(apiData);
 * // Use with UKAreaChoroplethMap, or placeOnUKHexLayout for the hex map
 * ```
 */
export function transformConstituencyAbsoluteChange(
  apiData: ReportOutputSocietyWideByConstituency
): UKAreaChoroplethDataPoint[] {
  return transformConstituencyData(apiData, 'average_household_income_change');
}

/**
 * Extract relative income change data for hexagonal map
 *
 * Convenience function that transforms constituency data using the
 * relative household income change field (percentage).
 *
 * @param apiData - Raw constituency impact data from API
 * @returns One point per area, with its relative income change
 *
 * @example
 * ```typescript
 * const apiData = output.constituency_impact?.by_constituency;
 * const hexMapData = transformConstituencyRelativeChange(apiData);
 * // Use with UKAreaChoroplethMap, or placeOnUKHexLayout for the hex map
 * ```
 */
export function transformConstituencyRelativeChange(
  apiData: ReportOutputSocietyWideByConstituency
): UKAreaChoroplethDataPoint[] {
  return transformConstituencyData(apiData, 'relative_household_income_change');
}
