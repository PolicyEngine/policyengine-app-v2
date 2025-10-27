import type { ReportOutputSocietyWideByConstituency } from '@/types/metadata/ReportOutputSocietyWideByConstituency';
import type { HexMapDataPoint } from '@/types/visualization/HexMapDataPoint';

/**
 * Transform API constituency data to hexagonal map data points
 *
 * Converts the raw constituency impact data from the API response into
 * a standardized format for hexagonal map visualization.
 *
 * @param apiData - Raw constituency impact data from API (uses existing type)
 * @param valueField - Which field to use as the value ('average_household_income_change' or 'relative_household_income_change')
 * @returns Array of HexMapDataPoint ready for visualization
 *
 * @example
 * ```typescript
 * const apiData = {
 *   'Westminster North': {
 *     x: 0,
 *     y: 0,
 *     average_household_income_change: 1234.56,
 *     relative_household_income_change: 0.025
 *   }
 * };
 *
 * const points = transformConstituencyData(apiData, 'average_household_income_change');
 * // points[0] = {
 * //   id: 'Westminster North',
 * //   label: 'Westminster North',
 * //   value: 1234.56,
 * //   x: 0,
 * //   y: 0
 * // }
 * ```
 */
export function transformConstituencyData(
  apiData: ReportOutputSocietyWideByConstituency,
  valueField: 'average_household_income_change' | 'relative_household_income_change'
): HexMapDataPoint[] {
  return Object.entries(apiData).map(([constituencyName, data]) => ({
    id: constituencyName,
    label: constituencyName,
    value: data[valueField],
    x: data.x,
    y: data.y,
  }));
}

/**
 * Extract average income change data for hexagonal map
 *
 * Convenience function that transforms constituency data using the
 * average household income change field.
 *
 * @param apiData - Raw constituency impact data from API
 * @returns Array of HexMapDataPoint with average income changes
 *
 * @example
 * ```typescript
 * const apiData = output.constituency_impact?.by_constituency;
 * const hexMapData = transformConstituencyAverageChange(apiData);
 * // Use with HexagonalMap component for currency visualization
 * ```
 */
export function transformConstituencyAverageChange(
  apiData: ReportOutputSocietyWideByConstituency
): HexMapDataPoint[] {
  return transformConstituencyData(apiData, 'average_household_income_change');
}

/**
 * Extract relative income change data for hexagonal map
 *
 * Convenience function that transforms constituency data using the
 * relative household income change field (percentage).
 *
 * @param apiData - Raw constituency impact data from API
 * @returns Array of HexMapDataPoint with relative income changes
 *
 * @example
 * ```typescript
 * const apiData = output.constituency_impact?.by_constituency;
 * const hexMapData = transformConstituencyRelativeChange(apiData);
 * // Use with HexagonalMap component for percentage visualization
 * ```
 */
export function transformConstituencyRelativeChange(
  apiData: ReportOutputSocietyWideByConstituency
): HexMapDataPoint[] {
  return transformConstituencyData(apiData, 'relative_household_income_change');
}
