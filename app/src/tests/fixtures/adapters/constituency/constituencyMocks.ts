import type { UKAreaChoroplethDataPoint } from '@/components/visualization/choropleth/types';
import type { ReportOutputSocietyWideByConstituency } from '@/types/metadata/ReportOutputSocietyWideByConstituency';

/**
 * Mock constituency data matching the API response structure
 */
export const MOCK_CONSTITUENCY_DATA: ReportOutputSocietyWideByConstituency = {
  'Westminster North': {
    average_household_income_change: 1234.56,
    relative_household_income_change: 0.025,
  },
  'Edinburgh Central': {
    average_household_income_change: -567.89,
    relative_household_income_change: -0.015,
  },
  'Cardiff South': {
    average_household_income_change: 0,
    relative_household_income_change: 0,
  },
  'Belfast East': {
    average_household_income_change: 890.12,
    relative_household_income_change: 0.018,
  },
};

/**
 * Expected output after transforming average change data
 */
export const EXPECTED_ABSOLUTE_CHANGE_DATA: UKAreaChoroplethDataPoint[] = [
  {
    id: 'Westminster North',
    label: 'Westminster North',
    value: 1234.56,
  },
  {
    id: 'Edinburgh Central',
    label: 'Edinburgh Central',
    value: -567.89,
  },
  {
    id: 'Cardiff South',
    label: 'Cardiff South',
    value: 0,
  },
  {
    id: 'Belfast East',
    label: 'Belfast East',
    value: 890.12,
  },
];

/**
 * Expected output after transforming relative change data
 */
export const EXPECTED_RELATIVE_CHANGE_DATA: UKAreaChoroplethDataPoint[] = [
  {
    id: 'Westminster North',
    label: 'Westminster North',
    value: 0.025,
  },
  {
    id: 'Edinburgh Central',
    label: 'Edinburgh Central',
    value: -0.015,
  },
  {
    id: 'Cardiff South',
    label: 'Cardiff South',
    value: 0,
  },
  {
    id: 'Belfast East',
    label: 'Belfast East',
    value: 0.018,
  },
];

/**
 * Single constituency for edge case testing
 */
export const SINGLE_CONSTITUENCY_DATA: ReportOutputSocietyWideByConstituency = {
  'Test Constituency': {
    average_household_income_change: 500.0,
    relative_household_income_change: 0.01,
  },
};

/**
 * Empty constituency data for edge case testing
 */
export const EMPTY_CONSTITUENCY_DATA: ReportOutputSocietyWideByConstituency = {};

/**
 * Large dataset simulating all 650 UK constituencies (abbreviated for testing)
 */
export const LARGE_CONSTITUENCY_DATA: ReportOutputSocietyWideByConstituency = {
  ...MOCK_CONSTITUENCY_DATA,
  'Manchester Central': {
    average_household_income_change: 345.67,
    relative_household_income_change: 0.008,
  },
  'Birmingham Edgbaston': {
    average_household_income_change: -123.45,
    relative_household_income_change: -0.003,
  },
  'Liverpool Riverside': {
    average_household_income_change: 678.9,
    relative_household_income_change: 0.014,
  },
  'Leeds Central': {
    average_household_income_change: 234.56,
    relative_household_income_change: 0.005,
  },
  'Sheffield Central': {
    average_household_income_change: -456.78,
    relative_household_income_change: -0.009,
  },
  'Bristol West': {
    average_household_income_change: 567.89,
    relative_household_income_change: 0.012,
  },
};

/**
 * A saved result's areas, which still carry the x and y hex positions the
 * Public API sent with each area before the app stopped reading them.
 */
export const SAVED_CONSTITUENCY_DATA_WITH_POSITIONS = Object.fromEntries(
  Object.entries(MOCK_CONSTITUENCY_DATA).map(([name, area], index) => [
    name,
    { ...area, x: index, y: -index },
  ])
) as ReportOutputSocietyWideByConstituency;
