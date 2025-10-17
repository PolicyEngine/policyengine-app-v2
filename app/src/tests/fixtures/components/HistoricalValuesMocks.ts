/**
 * Mock data and fixtures for testing HistoricalValues chart component
 */

import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { ValueIntervalCollection } from '@/types/subIngredients/valueInterval';

// Sample parameter metadata for different unit types
export const CURRENCY_USD_PARAMETER: ParameterMetadata = {
  parameter: 'tax.income.standard_deduction',
  label: 'Standard Deduction',
  type: 'parameter',
  unit: 'currency-USD',
  description: 'Standard tax deduction amount',
  economy: true,
  household: true,
};

export const PERCENTAGE_PARAMETER: ParameterMetadata = {
  parameter: 'tax.income.rate',
  label: 'Income Tax Rate',
  type: 'parameter',
  unit: '/1',
  description: 'Income tax rate as a decimal',
  economy: true,
  household: true,
};

export const BOOLEAN_PARAMETER: ParameterMetadata = {
  parameter: 'benefits.snap.abolished',
  label: 'SNAP Abolished',
  type: 'parameter',
  unit: 'abolition',
  description: 'Whether SNAP is abolished',
  economy: true,
  household: true,
};

// Sample base values (current law)
export const SAMPLE_BASE_VALUES_SIMPLE = new ValueIntervalCollection([
  {
    parameter: 'tax.income.standard_deduction',
    startDate: '2020-01-01',
    endDate: '2023-12-31',
    value: 12000,
  },
  {
    parameter: 'tax.income.standard_deduction',
    startDate: '2024-01-01',
    endDate: '2100-12-31',
    value: 13500,
  },
]);

export const SAMPLE_BASE_VALUES_WITH_INVALID_DATES = new ValueIntervalCollection([
  {
    parameter: 'tax.income.standard_deduction',
    startDate: '0000-01-01', // Invalid date - should be filtered
    endDate: '2019-12-31',
    value: 10000,
  },
  {
    parameter: 'tax.income.standard_deduction',
    startDate: '2020-01-01',
    endDate: '2023-12-31',
    value: 12000,
  },
  {
    parameter: 'tax.income.standard_deduction',
    startDate: '2024-01-01',
    endDate: '2100-12-31',
    value: 13500,
  },
]);

export const SAMPLE_BASE_VALUES_COMPLEX = new ValueIntervalCollection([
  {
    parameter: 'tax.income.rate',
    startDate: '2015-01-01',
    endDate: '2019-12-31',
    value: 0.15,
  },
  {
    parameter: 'tax.income.rate',
    startDate: '2020-01-01',
    endDate: '2022-12-31',
    value: 0.18,
  },
  {
    parameter: 'tax.income.rate',
    startDate: '2023-01-01',
    endDate: '2025-12-31',
    value: 0.20,
  },
  {
    parameter: 'tax.income.rate',
    startDate: '2026-01-01',
    endDate: '2100-12-31',
    value: 0.22,
  },
]);

// Sample reform values
export const SAMPLE_REFORM_VALUES_SIMPLE = new ValueIntervalCollection([
  {
    parameter: 'tax.income.standard_deduction',
    startDate: '2024-01-01',
    endDate: '2100-12-31',
    value: 15000,
  },
]);

export const SAMPLE_REFORM_VALUES_COMPLEX = new ValueIntervalCollection([
  {
    parameter: 'tax.income.rate',
    startDate: '2023-01-01',
    endDate: '2025-12-31',
    value: 0.25,
  },
  {
    parameter: 'tax.income.rate',
    startDate: '2026-01-01',
    endDate: '2100-12-31',
    value: 0.30,
  },
]);

// Empty collection for testing base-only scenarios
export const EMPTY_VALUES = new ValueIntervalCollection([]);

// Expected values after data processing
export const EXPECTED_BASE_START_DATES = ['2020-01-01', '2024-01-01'];
export const EXPECTED_BASE_VALUES = [12000, 13500];

// Expected after extending for display
export const EXPECTED_EXTENDED_BASE_DATES = [
  '2020-01-01',
  '2024-01-01',
  '2099-12-31',
];
export const EXPECTED_EXTENDED_BASE_VALUES = [12000, 13500, 13500]; // Last value repeated

// Expected filtered dates (should exclude 0000-01-01 and dates >= 2099-12-31)
export function getExpectedFilteredDates() {
  return ['2020-01-01', '2024-01-01'];
}

// Expected all unique dates combined from base and reform
export function getExpectedAllChartDates() {
  return ['2020-01-01', '2024-01-01']; // From combining and sorting
}

// Chart test IDs and selectors
export const CHART_TEST_IDS = {
  CHART_CONTAINER: 'parameter-chart-container',
  PLOT_COMPONENT: 'plotly-chart',
  HISTORICAL_VALUES_SECTION: 'historical-values',
} as const;

// Expected trace properties
export const EXPECTED_REFORM_TRACE = {
  name: 'Reform',
  mode: 'lines+markers',
  lineShape: 'hv',
  lineDash: 'dot',
};

export const EXPECTED_BASE_TRACE = {
  name: 'Current law',
  mode: 'lines+markers',
  lineShape: 'hv',
};

// Policy label test data
export const SAMPLE_POLICY_LABEL_CUSTOM = 'Universal Basic Income';
export const SAMPLE_POLICY_LABEL_SHORT = 'UBI';
export const SAMPLE_POLICY_ID_NUMERIC = 12345;
export const SAMPLE_POLICY_ID_SMALL = 7;

// Expected reform trace names based on policy data
export const EXPECTED_REFORM_NAME_DEFAULT = 'Reform';
export const EXPECTED_REFORM_NAME_WITH_LABEL = SAMPLE_POLICY_LABEL_CUSTOM;
export const EXPECTED_REFORM_NAME_WITH_SHORT_LABEL = SAMPLE_POLICY_LABEL_SHORT;
export const EXPECTED_REFORM_NAME_WITH_ID = `Policy #${SAMPLE_POLICY_ID_NUMERIC}`;
export const EXPECTED_REFORM_NAME_WITH_SMALL_ID = `Policy #${SAMPLE_POLICY_ID_SMALL}`;

// Error and edge case test data
export const EMPTY_VALUES_COLLECTION = new ValueIntervalCollection([]);

// Mock ValueIntervalCollection with mismatched data for error testing
export class MockMismatchedValueCollection extends ValueIntervalCollection {
  getAllStartDates(): string[] {
    return ['2020-01-01', '2024-01-01'];
  }

  getAllValues(): (string | number | boolean)[] {
    return [12000]; // Only one value when there are two dates
  }
}

// Mock ValueIntervalCollection that throws errors
export class MockErrorThrowingCollection extends ValueIntervalCollection {
  getAllStartDates(): string[] {
    throw new Error('Test error in getAllStartDates');
  }

  getAllValues(): (string | number | boolean)[] {
    throw new Error('Test error in getAllValues');
  }
}

// Expected error messages
export const EXPECTED_NO_DATA_MESSAGE = 'No data available to display';
