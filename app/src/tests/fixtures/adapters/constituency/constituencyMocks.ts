import type { ReportOutputSocietyWideByConstituency } from '@/types/metadata/ReportOutputSocietyWideByConstituency';
import type { HexMapDataPoint } from '@/types/visualization/HexMapDataPoint';

/**
 * Mock constituency data matching the API response structure
 */
export const MOCK_CONSTITUENCY_DATA: ReportOutputSocietyWideByConstituency = {
  'Westminster North': {
    x: 0,
    y: 0,
    average_household_income_change: 1234.56,
    relative_household_income_change: 0.025,
  },
  'Edinburgh Central': {
    x: 1,
    y: 0,
    average_household_income_change: -567.89,
    relative_household_income_change: -0.015,
  },
  'Cardiff South': {
    x: 0,
    y: 1,
    average_household_income_change: 0,
    relative_household_income_change: 0,
  },
  'Belfast East': {
    x: 1,
    y: 1,
    average_household_income_change: 890.12,
    relative_household_income_change: 0.018,
  },
};

/**
 * Expected output after transforming average change data
 */
export const EXPECTED_AVERAGE_CHANGE_DATA: HexMapDataPoint[] = [
  {
    id: 'Westminster North',
    label: 'Westminster North',
    value: 1234.56,
    x: 0,
    y: 0,
  },
  {
    id: 'Edinburgh Central',
    label: 'Edinburgh Central',
    value: -567.89,
    x: 1,
    y: 0,
  },
  {
    id: 'Cardiff South',
    label: 'Cardiff South',
    value: 0,
    x: 0,
    y: 1,
  },
  {
    id: 'Belfast East',
    label: 'Belfast East',
    value: 890.12,
    x: 1,
    y: 1,
  },
];

/**
 * Expected output after transforming relative change data
 */
export const EXPECTED_RELATIVE_CHANGE_DATA: HexMapDataPoint[] = [
  {
    id: 'Westminster North',
    label: 'Westminster North',
    value: 0.025,
    x: 0,
    y: 0,
  },
  {
    id: 'Edinburgh Central',
    label: 'Edinburgh Central',
    value: -0.015,
    x: 1,
    y: 0,
  },
  {
    id: 'Cardiff South',
    label: 'Cardiff South',
    value: 0,
    x: 0,
    y: 1,
  },
  {
    id: 'Belfast East',
    label: 'Belfast East',
    value: 0.018,
    x: 1,
    y: 1,
  },
];

/**
 * Single constituency for edge case testing
 */
export const SINGLE_CONSTITUENCY_DATA: ReportOutputSocietyWideByConstituency = {
  'Test Constituency': {
    x: 5,
    y: 10,
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
    x: 2,
    y: 2,
    average_household_income_change: 345.67,
    relative_household_income_change: 0.008,
  },
  'Birmingham Edgbaston': {
    x: 3,
    y: 2,
    average_household_income_change: -123.45,
    relative_household_income_change: -0.003,
  },
  'Liverpool Riverside': {
    x: 2,
    y: 3,
    average_household_income_change: 678.9,
    relative_household_income_change: 0.014,
  },
  'Leeds Central': {
    x: 3,
    y: 3,
    average_household_income_change: 234.56,
    relative_household_income_change: 0.005,
  },
  'Sheffield Central': {
    x: 4,
    y: 3,
    average_household_income_change: -456.78,
    relative_household_income_change: -0.009,
  },
  'Bristol West': {
    x: 4,
    y: 4,
    average_household_income_change: 567.89,
    relative_household_income_change: 0.012,
  },
};
