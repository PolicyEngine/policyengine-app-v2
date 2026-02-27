import type { ConstituencyData } from '@/api/v2/economyAnalysis';
import type { HexMapDataPoint } from '@/types/visualization/HexMapDataPoint';

export function transformConstituencyData(
  apiData: ConstituencyData[],
  valueField: 'average_household_income_change' | 'relative_household_income_change'
): HexMapDataPoint[] {
  return apiData.map((item) => ({
    id: item.constituency_name,
    label: item.constituency_name,
    value: item[valueField] ?? 0,
    x: item.x,
    y: item.y,
  }));
}

export function transformConstituencyAbsoluteChange(
  apiData: ConstituencyData[]
): HexMapDataPoint[] {
  return transformConstituencyData(apiData, 'average_household_income_change');
}

export function transformConstituencyRelativeChange(
  apiData: ConstituencyData[]
): HexMapDataPoint[] {
  return transformConstituencyData(apiData, 'relative_household_income_change');
}
