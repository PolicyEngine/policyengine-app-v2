import type { UKAreaChoroplethDataPoint } from '@/components/visualization/choropleth/types';
import type { ReportOutputSocietyWideByLocalAuthority } from '@/types/metadata/ReportOutputSocietyWideByLocalAuthority';

/**
 * Mock local authority data matching the API response structure
 */
export const MOCK_LOCAL_AUTHORITY_DATA: ReportOutputSocietyWideByLocalAuthority = {
  Maidstone: {
    average_household_income_change: 1234.56,
    relative_household_income_change: 0.025,
  },
  Westminster: {
    average_household_income_change: -567.89,
    relative_household_income_change: -0.015,
  },
  Edinburgh: {
    average_household_income_change: 0,
    relative_household_income_change: 0,
  },
  Cardiff: {
    average_household_income_change: 890.12,
    relative_household_income_change: 0.018,
  },
};

/**
 * Expected output after transforming average change data
 */
export const EXPECTED_ABSOLUTE_CHANGE_DATA: UKAreaChoroplethDataPoint[] = [
  {
    id: 'Maidstone',
    label: 'Maidstone',
    value: 1234.56,
  },
  {
    id: 'Westminster',
    label: 'Westminster',
    value: -567.89,
  },
  {
    id: 'Edinburgh',
    label: 'Edinburgh',
    value: 0,
  },
  {
    id: 'Cardiff',
    label: 'Cardiff',
    value: 890.12,
  },
];

/**
 * Expected output after transforming relative change data
 */
export const EXPECTED_RELATIVE_CHANGE_DATA: UKAreaChoroplethDataPoint[] = [
  {
    id: 'Maidstone',
    label: 'Maidstone',
    value: 0.025,
  },
  {
    id: 'Westminster',
    label: 'Westminster',
    value: -0.015,
  },
  {
    id: 'Edinburgh',
    label: 'Edinburgh',
    value: 0,
  },
  {
    id: 'Cardiff',
    label: 'Cardiff',
    value: 0.018,
  },
];

/**
 * Single local authority for edge case testing
 */
export const SINGLE_LOCAL_AUTHORITY_DATA: ReportOutputSocietyWideByLocalAuthority = {
  'Test Authority': {
    average_household_income_change: 500.0,
    relative_household_income_change: 0.01,
  },
};

/**
 * Empty local authority data for edge case testing
 */
export const EMPTY_LOCAL_AUTHORITY_DATA: ReportOutputSocietyWideByLocalAuthority = {};

/**
 * Large dataset simulating multiple UK local authorities (abbreviated for testing)
 */
export const LARGE_LOCAL_AUTHORITY_DATA: ReportOutputSocietyWideByLocalAuthority = {
  ...MOCK_LOCAL_AUTHORITY_DATA,
  Manchester: {
    average_household_income_change: 345.67,
    relative_household_income_change: 0.008,
  },
  Birmingham: {
    average_household_income_change: -123.45,
    relative_household_income_change: -0.003,
  },
  Liverpool: {
    average_household_income_change: 678.9,
    relative_household_income_change: 0.014,
  },
  Leeds: {
    average_household_income_change: 234.56,
    relative_household_income_change: 0.005,
  },
  Sheffield: {
    average_household_income_change: -456.78,
    relative_household_income_change: -0.009,
  },
  Bristol: {
    average_household_income_change: 567.89,
    relative_household_income_change: 0.012,
  },
};

/**
 * A saved result's areas, which still carry the x and y hex positions the
 * Public API sent with each area before the app stopped reading them.
 */
export const SAVED_LOCAL_AUTHORITY_DATA_WITH_POSITIONS = Object.fromEntries(
  Object.entries(MOCK_LOCAL_AUTHORITY_DATA).map(([name, area], index) => [
    name,
    { ...area, x: index, y: -index },
  ])
) as ReportOutputSocietyWideByLocalAuthority;
