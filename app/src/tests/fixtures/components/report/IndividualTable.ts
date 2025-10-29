import { EntityMember } from '@/utils/householdIndividuals';

// Test labels
export const BASELINE_LABEL = 'Baseline';
export const REFORM_LABEL = 'Reform';
export const HOUSEHOLD_LABEL = 'My Household';

// Mock entity members
export const MOCK_BASELINE_MEMBER: EntityMember = {
  id: 'person_1',
  name: 'You',
  variables: [
    {
      paramName: 'age',
      label: 'Age',
      value: 30,
      unit: 'year',
    },
    {
      paramName: 'employment_income',
      label: 'Employment Income',
      value: 50000,
      unit: 'currency-USD',
    },
  ],
};

export const MOCK_REFORM_MEMBER: EntityMember = {
  id: 'person_1',
  name: 'You',
  variables: [
    {
      paramName: 'age',
      label: 'Age',
      value: 30,
      unit: 'year',
    },
    {
      paramName: 'employment_income',
      label: 'Employment Income',
      value: 55000,
      unit: 'currency-USD',
    },
  ],
};

export const MOCK_BASELINE_MEMBER_WITH_EXTRA_VARS: EntityMember = {
  id: 'person_1',
  name: 'You',
  variables: [
    {
      paramName: 'age',
      label: 'Age',
      value: 30,
      unit: 'year',
    },
    {
      paramName: 'employment_income',
      label: 'Employment Income',
      value: 50000,
      unit: 'currency-USD',
    },
    {
      paramName: 'state_tax',
      label: 'State Tax',
      value: 2500,
      unit: 'currency-USD',
    },
  ],
};

export const MOCK_EMPTY_MEMBER: EntityMember = {
  id: 'person_empty',
  name: 'Empty Person',
  variables: [],
};

// Expected formatted values
export const EXPECTED_AGE_VALUE = '30';
export const EXPECTED_BASELINE_INCOME_VALUE = '$50,000';
export const EXPECTED_REFORM_INCOME_VALUE = '$55,000';
export const EXPECTED_STATE_TAX_VALUE = '$2,500';
export const EXPECTED_MISSING_VALUE = '—';

// Table headers
export const TABLE_HEADER_VARIABLE = 'Variable';
export const TABLE_HEADER_BASELINE = 'BASELINE (BASELINE)';
export const TABLE_HEADER_REFORM = 'REFORM (REFORM)';
export const TABLE_HEADER_MERGED = 'MY HOUSEHOLD (BASELINE / REFORM)';
export const TABLE_HEADER_SINGLE = 'BASELINE';

// No data message
export const NO_DATA_AVAILABLE_MESSAGE = 'No data available';
