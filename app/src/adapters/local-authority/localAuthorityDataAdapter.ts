import type { ReportOutputSocietyWideByLocalAuthority } from '@/types/metadata/ReportOutputSocietyWideByLocalAuthority';
import type { HexMapDataPoint } from '@/types/visualization/HexMapDataPoint';

/**
 * Transform API local authority data to hexagonal map data points
 *
 * Converts the raw local authority impact data from the API response into
 * a standardized format for hexagonal map visualization.
 *
 * @param apiData - Raw local authority impact data from API
 * @param valueField - Which field to use as the value ('average_household_income_change' or 'relative_household_income_change')
 * @returns Array of HexMapDataPoint ready for visualization
 *
 * @example
 * ```typescript
 * const apiData = {
 *   'Maidstone': {
 *     x: 0,
 *     y: 0,
 *     average_household_income_change: 1234.56,
 *     relative_household_income_change: 0.025
 *   }
 * };
 *
 * const points = transformLocalAuthorityData(apiData, 'average_household_income_change');
 * // points[0] = {
 * //   id: 'Maidstone',
 * //   label: 'Maidstone',
 * //   value: 1234.56,
 * //   x: 0,
 * //   y: 0
 * // }
 * ```
 */
export function transformLocalAuthorityData(
  apiData: ReportOutputSocietyWideByLocalAuthority,
  valueField: 'average_household_income_change' | 'relative_household_income_change'
): HexMapDataPoint[] {
  return Object.entries(apiData).map(([localAuthorityName, data]) => ({
    id: localAuthorityName,
    label: localAuthorityName,
    value: data[valueField],
    x: data.x,
    y: data.y,
  }));
}

/**
 * Extract average income change data for hexagonal map
 *
 * Convenience function that transforms local authority data using the
 * average household income change field.
 *
 * @param apiData - Raw local authority impact data from API
 * @returns Array of HexMapDataPoint with average income changes
 *
 * @example
 * ```typescript
 * const apiData = output.local_authority_impact?.by_local_authority;
 * const hexMapData = transformLocalAuthorityAbsoluteChange(apiData);
 * // Use with HexagonalMap component for currency visualization
 * ```
 */
export function transformLocalAuthorityAbsoluteChange(
  apiData: ReportOutputSocietyWideByLocalAuthority
): HexMapDataPoint[] {
  return transformLocalAuthorityData(apiData, 'average_household_income_change');
}

/**
 * Extract relative income change data for hexagonal map
 *
 * Convenience function that transforms local authority data using the
 * relative household income change field (percentage).
 *
 * @param apiData - Raw local authority impact data from API
 * @returns Array of HexMapDataPoint with relative income changes
 *
 * @example
 * ```typescript
 * const apiData = output.local_authority_impact?.by_local_authority;
 * const hexMapData = transformLocalAuthorityRelativeChange(apiData);
 * // Use with HexagonalMap component for percentage visualization
 * ```
 */
export function transformLocalAuthorityRelativeChange(
  apiData: ReportOutputSocietyWideByLocalAuthority
): HexMapDataPoint[] {
  return transformLocalAuthorityData(apiData, 'relative_household_income_change');
}
