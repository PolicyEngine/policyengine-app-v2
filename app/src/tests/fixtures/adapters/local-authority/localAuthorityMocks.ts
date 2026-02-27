import type { LocalAuthorityData } from '@/api/v2/economyAnalysis';
import type { HexMapDataPoint } from '@/types/visualization/HexMapDataPoint';

const REPORT_ID = 'test-report-001';

/**
 * Mock local authority data matching the v2 API response structure
 */
export const MOCK_LOCAL_AUTHORITY_DATA: LocalAuthorityData[] = [
  {
    id: 'la-1',
    report_id: REPORT_ID,
    local_authority_code: 'E07000110',
    local_authority_name: 'Maidstone',
    x: 0,
    y: 0,
    average_household_income_change: 1234.56,
    relative_household_income_change: 0.025,
    population: 170000,
  },
  {
    id: 'la-2',
    report_id: REPORT_ID,
    local_authority_code: 'E09000033',
    local_authority_name: 'Westminster',
    x: 1,
    y: 0,
    average_household_income_change: -567.89,
    relative_household_income_change: -0.015,
    population: 255000,
  },
  {
    id: 'la-3',
    report_id: REPORT_ID,
    local_authority_code: 'S12000036',
    local_authority_name: 'Edinburgh',
    x: 0,
    y: 1,
    average_household_income_change: 0,
    relative_household_income_change: 0,
    population: 530000,
  },
  {
    id: 'la-4',
    report_id: REPORT_ID,
    local_authority_code: 'W06000015',
    local_authority_name: 'Cardiff',
    x: 1,
    y: 1,
    average_household_income_change: 890.12,
    relative_household_income_change: 0.018,
    population: 360000,
  },
];

/**
 * Expected output after transforming average change data
 */
export const EXPECTED_ABSOLUTE_CHANGE_DATA: HexMapDataPoint[] = [
  { id: 'Maidstone', label: 'Maidstone', value: 1234.56, x: 0, y: 0 },
  { id: 'Westminster', label: 'Westminster', value: -567.89, x: 1, y: 0 },
  { id: 'Edinburgh', label: 'Edinburgh', value: 0, x: 0, y: 1 },
  { id: 'Cardiff', label: 'Cardiff', value: 890.12, x: 1, y: 1 },
];

/**
 * Expected output after transforming relative change data
 */
export const EXPECTED_RELATIVE_CHANGE_DATA: HexMapDataPoint[] = [
  { id: 'Maidstone', label: 'Maidstone', value: 0.025, x: 0, y: 0 },
  { id: 'Westminster', label: 'Westminster', value: -0.015, x: 1, y: 0 },
  { id: 'Edinburgh', label: 'Edinburgh', value: 0, x: 0, y: 1 },
  { id: 'Cardiff', label: 'Cardiff', value: 0.018, x: 1, y: 1 },
];

/**
 * Single local authority for edge case testing
 */
export const SINGLE_LOCAL_AUTHORITY_DATA: LocalAuthorityData[] = [
  {
    id: 'la-single',
    report_id: REPORT_ID,
    local_authority_code: 'T01',
    local_authority_name: 'Test Authority',
    x: 5,
    y: 10,
    average_household_income_change: 500.0,
    relative_household_income_change: 0.01,
    population: 200000,
  },
];

/**
 * Empty local authority data for edge case testing
 */
export const EMPTY_LOCAL_AUTHORITY_DATA: LocalAuthorityData[] = [];

/**
 * Large dataset simulating multiple UK local authorities (abbreviated for testing)
 */
export const LARGE_LOCAL_AUTHORITY_DATA: LocalAuthorityData[] = [
  ...MOCK_LOCAL_AUTHORITY_DATA,
  {
    id: 'la-5',
    report_id: REPORT_ID,
    local_authority_code: 'E08000003',
    local_authority_name: 'Manchester',
    x: 2,
    y: 2,
    average_household_income_change: 345.67,
    relative_household_income_change: 0.008,
    population: 550000,
  },
  {
    id: 'la-6',
    report_id: REPORT_ID,
    local_authority_code: 'E08000025',
    local_authority_name: 'Birmingham',
    x: 3,
    y: 2,
    average_household_income_change: -123.45,
    relative_household_income_change: -0.003,
    population: 1100000,
  },
  {
    id: 'la-7',
    report_id: REPORT_ID,
    local_authority_code: 'E08000012',
    local_authority_name: 'Liverpool',
    x: 2,
    y: 3,
    average_household_income_change: 678.9,
    relative_household_income_change: 0.014,
    population: 500000,
  },
  {
    id: 'la-8',
    report_id: REPORT_ID,
    local_authority_code: 'E08000035',
    local_authority_name: 'Leeds',
    x: 3,
    y: 3,
    average_household_income_change: 234.56,
    relative_household_income_change: 0.005,
    population: 790000,
  },
  {
    id: 'la-9',
    report_id: REPORT_ID,
    local_authority_code: 'E08000019',
    local_authority_name: 'Sheffield',
    x: 4,
    y: 3,
    average_household_income_change: -456.78,
    relative_household_income_change: -0.009,
    population: 580000,
  },
  {
    id: 'la-10',
    report_id: REPORT_ID,
    local_authority_code: 'E06000023',
    local_authority_name: 'Bristol',
    x: 4,
    y: 4,
    average_household_income_change: 567.89,
    relative_household_income_change: 0.012,
    population: 460000,
  },
];
