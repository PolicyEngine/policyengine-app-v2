import type { ConstituencyData } from '@/api/v2/economyAnalysis';
import type { HexMapDataPoint } from '@/types/visualization/HexMapDataPoint';

const REPORT_ID = 'test-report-001';

/**
 * Mock constituency data matching the v2 API response structure
 */
export const MOCK_CONSTITUENCY_DATA: ConstituencyData[] = [
  {
    id: 'c-1',
    report_id: REPORT_ID,
    constituency_code: 'W01',
    constituency_name: 'Westminster North',
    x: 0,
    y: 0,
    average_household_income_change: 1234.56,
    relative_household_income_change: 0.025,
    population: 100000,
  },
  {
    id: 'c-2',
    report_id: REPORT_ID,
    constituency_code: 'E01',
    constituency_name: 'Edinburgh Central',
    x: 1,
    y: 0,
    average_household_income_change: -567.89,
    relative_household_income_change: -0.015,
    population: 80000,
  },
  {
    id: 'c-3',
    report_id: REPORT_ID,
    constituency_code: 'C01',
    constituency_name: 'Cardiff South',
    x: 0,
    y: 1,
    average_household_income_change: 0,
    relative_household_income_change: 0,
    population: 90000,
  },
  {
    id: 'c-4',
    report_id: REPORT_ID,
    constituency_code: 'B01',
    constituency_name: 'Belfast East',
    x: 1,
    y: 1,
    average_household_income_change: 890.12,
    relative_household_income_change: 0.018,
    population: 75000,
  },
];

/**
 * Expected output after transforming average change data
 */
export const EXPECTED_ABSOLUTE_CHANGE_DATA: HexMapDataPoint[] = [
  { id: 'Westminster North', label: 'Westminster North', value: 1234.56, x: 0, y: 0 },
  { id: 'Edinburgh Central', label: 'Edinburgh Central', value: -567.89, x: 1, y: 0 },
  { id: 'Cardiff South', label: 'Cardiff South', value: 0, x: 0, y: 1 },
  { id: 'Belfast East', label: 'Belfast East', value: 890.12, x: 1, y: 1 },
];

/**
 * Expected output after transforming relative change data
 */
export const EXPECTED_RELATIVE_CHANGE_DATA: HexMapDataPoint[] = [
  { id: 'Westminster North', label: 'Westminster North', value: 0.025, x: 0, y: 0 },
  { id: 'Edinburgh Central', label: 'Edinburgh Central', value: -0.015, x: 1, y: 0 },
  { id: 'Cardiff South', label: 'Cardiff South', value: 0, x: 0, y: 1 },
  { id: 'Belfast East', label: 'Belfast East', value: 0.018, x: 1, y: 1 },
];

/**
 * Single constituency for edge case testing
 */
export const SINGLE_CONSTITUENCY_DATA: ConstituencyData[] = [
  {
    id: 'c-single',
    report_id: REPORT_ID,
    constituency_code: 'T01',
    constituency_name: 'Test Constituency',
    x: 5,
    y: 10,
    average_household_income_change: 500.0,
    relative_household_income_change: 0.01,
    population: 60000,
  },
];

/**
 * Empty constituency data for edge case testing
 */
export const EMPTY_CONSTITUENCY_DATA: ConstituencyData[] = [];

/**
 * Large dataset simulating multiple UK constituencies (abbreviated for testing)
 */
export const LARGE_CONSTITUENCY_DATA: ConstituencyData[] = [
  ...MOCK_CONSTITUENCY_DATA,
  {
    id: 'c-5',
    report_id: REPORT_ID,
    constituency_code: 'M01',
    constituency_name: 'Manchester Central',
    x: 2,
    y: 2,
    average_household_income_change: 345.67,
    relative_household_income_change: 0.008,
    population: 110000,
  },
  {
    id: 'c-6',
    report_id: REPORT_ID,
    constituency_code: 'B02',
    constituency_name: 'Birmingham Edgbaston',
    x: 3,
    y: 2,
    average_household_income_change: -123.45,
    relative_household_income_change: -0.003,
    population: 95000,
  },
  {
    id: 'c-7',
    report_id: REPORT_ID,
    constituency_code: 'L01',
    constituency_name: 'Liverpool Riverside',
    x: 2,
    y: 3,
    average_household_income_change: 678.9,
    relative_household_income_change: 0.014,
    population: 85000,
  },
  {
    id: 'c-8',
    report_id: REPORT_ID,
    constituency_code: 'LE01',
    constituency_name: 'Leeds Central',
    x: 3,
    y: 3,
    average_household_income_change: 234.56,
    relative_household_income_change: 0.005,
    population: 92000,
  },
  {
    id: 'c-9',
    report_id: REPORT_ID,
    constituency_code: 'S01',
    constituency_name: 'Sheffield Central',
    x: 4,
    y: 3,
    average_household_income_change: -456.78,
    relative_household_income_change: -0.009,
    population: 87000,
  },
  {
    id: 'c-10',
    report_id: REPORT_ID,
    constituency_code: 'BR01',
    constituency_name: 'Bristol West',
    x: 4,
    y: 4,
    average_household_income_change: 567.89,
    relative_household_income_change: 0.012,
    population: 91000,
  },
];
