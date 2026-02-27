import type { LocalAuthorityData } from '@/api/v2/economyAnalysis';
import type { HexMapDataPoint } from '@/types/visualization/HexMapDataPoint';

export function transformLocalAuthorityData(
  apiData: LocalAuthorityData[],
  valueField: 'average_household_income_change' | 'relative_household_income_change'
): HexMapDataPoint[] {
  return apiData.map((item) => ({
    id: item.local_authority_name,
    label: item.local_authority_name,
    value: item[valueField] ?? 0,
    x: item.x,
    y: item.y,
  }));
}

export function transformLocalAuthorityAbsoluteChange(
  apiData: LocalAuthorityData[]
): HexMapDataPoint[] {
  return transformLocalAuthorityData(apiData, 'average_household_income_change');
}

export function transformLocalAuthorityRelativeChange(
  apiData: LocalAuthorityData[]
): HexMapDataPoint[] {
  return transformLocalAuthorityData(apiData, 'relative_household_income_change');
}
