import { areaEstimateFields } from '@/adapters/ukAreaEstimateFields';
import type { UKAreaChoroplethDataPoint } from '@/components/visualization/choropleth/types';
import type { ReportOutputSocietyWideByLocalAuthority } from '@/types/metadata/ReportOutputSocietyWideByLocalAuthority';

/**
 * Transform API local authority data to map points
 *
 * Converts the raw local authority impact data from the API response into
 * one point per area for the geographic and hexagonal maps.
 *
 * @param apiData - Raw local authority impact data from API
 * @param valueField - Which field to use as the value ('average_household_income_change' or 'relative_household_income_change')
 * @returns One point per area for the geographic and hex maps; the hex map places each by its code (placeOnUKHexLayout)
 *
 * @example
 * ```typescript
 * const apiData = {
 *   'Maidstone': {
 *     average_household_income_change: 1234.56,
 *     relative_household_income_change: 0.025
 *   }
 * };
 *
 * const points = transformLocalAuthorityData(apiData, 'average_household_income_change');
 * // points[0] = {
 * //   id: 'Maidstone',
 * //   label: 'Maidstone',
 * //   value: 1234.56
 * // }
 * ```
 */
export function transformLocalAuthorityData(
  apiData: ReportOutputSocietyWideByLocalAuthority,
  valueField: 'average_household_income_change' | 'relative_household_income_change'
): UKAreaChoroplethDataPoint[] {
  return Object.entries(apiData).map(([localAuthorityName, data]) => ({
    id: localAuthorityName,
    label: localAuthorityName,
    value: data[valueField],
    ...(data.code && { code: data.code }),
    ...areaEstimateFields(data, valueField),
  }));
}

/**
 * Extract average income change data for hexagonal map
 *
 * Convenience function that transforms local authority data using the
 * average household income change field.
 *
 * @param apiData - Raw local authority impact data from API
 * @returns One point per area, with its average income change
 *
 * @example
 * ```typescript
 * const apiData = output.local_authority_impact?.by_local_authority;
 * const hexMapData = transformLocalAuthorityAbsoluteChange(apiData);
 * // Use with UKAreaChoroplethMap, or placeOnUKHexLayout for the hex map
 * ```
 */
export function transformLocalAuthorityAbsoluteChange(
  apiData: ReportOutputSocietyWideByLocalAuthority
): UKAreaChoroplethDataPoint[] {
  return transformLocalAuthorityData(apiData, 'average_household_income_change');
}

/**
 * Extract relative income change data for hexagonal map
 *
 * Convenience function that transforms local authority data using the
 * relative household income change field (percentage).
 *
 * @param apiData - Raw local authority impact data from API
 * @returns One point per area, with its relative income change
 *
 * @example
 * ```typescript
 * const apiData = output.local_authority_impact?.by_local_authority;
 * const hexMapData = transformLocalAuthorityRelativeChange(apiData);
 * // Use with UKAreaChoroplethMap, or placeOnUKHexLayout for the hex map
 * ```
 */
export function transformLocalAuthorityRelativeChange(
  apiData: ReportOutputSocietyWideByLocalAuthority
): UKAreaChoroplethDataPoint[] {
  return transformLocalAuthorityData(apiData, 'relative_household_income_change');
}
