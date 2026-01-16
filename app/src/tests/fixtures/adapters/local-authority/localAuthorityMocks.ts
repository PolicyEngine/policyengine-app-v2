import type { ReportOutputSocietyWideByLocalAuthority } from '@/types/metadata/ReportOutputSocietyWideByLocalAuthority';
import type { HexMapDataPoint } from '@/types/visualization/HexMapDataPoint';

/**
 * Mock local authority data matching the API response structure
 */
export const MOCK_LOCAL_AUTHORITY_DATA: ReportOutputSocietyWideByLocalAuthority = {
  Maidstone: {
    x: 0,
    y: 0,
    average_household_income_change: 1234.56,
    relative_household_income_change: 0.025,
  },
  Westminster: {
    x: 1,
    y: 0,
    average_household_income_change: -567.89,
    relative_household_income_change: -0.015,
  },
  Edinburgh: {
    x: 0,
    y: 1,
    average_household_income_change: 0,
    relative_household_income_change: 0,
  },
  Cardiff: {
    x: 1,
    y: 1,
    average_household_income_change: 890.12,
    relative_household_income_change: 0.018,
  },
};

/**
 * Expected output after transforming average change data
 */
export const EXPECTED_ABSOLUTE_CHANGE_DATA: HexMapDataPoint[] = [
  {
    id: 'Maidstone',
    label: 'Maidstone',
    value: 1234.56,
    x: 0,
    y: 0,
  },
  {
    id: 'Westminster',
    label: 'Westminster',
    value: -567.89,
    x: 1,
    y: 0,
  },
  {
    id: 'Edinburgh',
    label: 'Edinburgh',
    value: 0,
    x: 0,
    y: 1,
  },
  {
    id: 'Cardiff',
    label: 'Cardiff',
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
    id: 'Maidstone',
    label: 'Maidstone',
    value: 0.025,
    x: 0,
    y: 0,
  },
  {
    id: 'Westminster',
    label: 'Westminster',
    value: -0.015,
    x: 1,
    y: 0,
  },
  {
    id: 'Edinburgh',
    label: 'Edinburgh',
    value: 0,
    x: 0,
    y: 1,
  },
  {
    id: 'Cardiff',
    label: 'Cardiff',
    value: 0.018,
    x: 1,
    y: 1,
  },
];

/**
 * Single local authority for edge case testing
 */
export const SINGLE_LOCAL_AUTHORITY_DATA: ReportOutputSocietyWideByLocalAuthority = {
  'Test Authority': {
    x: 5,
    y: 10,
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
    x: 2,
    y: 2,
    average_household_income_change: 345.67,
    relative_household_income_change: 0.008,
  },
  Birmingham: {
    x: 3,
    y: 2,
    average_household_income_change: -123.45,
    relative_household_income_change: -0.003,
  },
  Liverpool: {
    x: 2,
    y: 3,
    average_household_income_change: 678.9,
    relative_household_income_change: 0.014,
  },
  Leeds: {
    x: 3,
    y: 3,
    average_household_income_change: 234.56,
    relative_household_income_change: 0.005,
  },
  Sheffield: {
    x: 4,
    y: 3,
    average_household_income_change: -456.78,
    relative_household_income_change: -0.009,
  },
  Bristol: {
    x: 4,
    y: 4,
    average_household_income_change: 567.89,
    relative_household_income_change: 0.012,
  },
};
