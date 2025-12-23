import { CURRENT_YEAR } from '@/constants';
import { MetadataApiPayload } from '@/types/metadata';
import { UK_REGION_TYPES } from '@/types/regionTypes';

export const mockMetadataResponse: MetadataApiPayload = {
  status: 'ok',
  message: null,
  result: {
    parameters: {
      income_tax: {
        parameter: 'income_tax',
        description: 'Income tax',
        label: 'Income tax',
        unit: 'currency-GBP',
        values: {
          '2023-01-01': 1000,
          [`${CURRENT_YEAR}-01-01`]: 1200,
        },
      },
      national_insurance: {
        parameter: 'national_insurance',
        description: 'National Insurance contributions',
        label: 'National Insurance',
        unit: 'currency-GBP',
        values: {
          '2023-01-01': 500,
          [`${CURRENT_YEAR}-01-01`]: 550,
        },
      },
    },
    variables: {
      household_income: {
        name: 'household_income',
        entity: 'household',
        description: 'Total household income',
        label: 'Household income',
        unit: 'currency-GBP',
        valueType: 'float',
      },
      age: {
        name: 'age',
        entity: 'person',
        description: 'Age of person',
        label: 'Age',
        unit: 'year',
        valueType: 'int',
      },
    },
    entities: {
      person: {
        label: 'Person',
        plural: 'People',
      },
      household: {
        label: 'Household',
        plural: 'Households',
      },
    },
    variableModules: {
      household: {
        label: 'Household',
      },
      person: {
        label: 'Person',
      },
    },
    economy_options: {
      region: [
        { name: 'uk', label: 'UK', type: UK_REGION_TYPES.NATIONAL },
        { name: 'country/england', label: 'England', type: UK_REGION_TYPES.COUNTRY },
        { name: 'country/scotland', label: 'Scotland', type: UK_REGION_TYPES.COUNTRY },
        { name: 'country/wales', label: 'Wales', type: UK_REGION_TYPES.COUNTRY },
        {
          name: 'country/northern_ireland',
          label: 'Northern Ireland',
          type: UK_REGION_TYPES.COUNTRY,
        },
      ],
      time_period: [
        { name: 2023, label: '2023' },
        { name: parseInt(CURRENT_YEAR, 10), label: CURRENT_YEAR },
        { name: parseInt(CURRENT_YEAR, 10), label: CURRENT_YEAR },
      ],
      datasets: [
        {
          name: 'frs_2022',
          label: 'FRS 2022',
          title: 'Family Resources Survey 2022',
          default: true,
        },
      ],
    },
    current_law_id: 1,
    basicInputs: ['age', 'household_income'],
    modelled_policies: {
      core: {
        baseline: {
          id: 1,
          label: 'Current law',
        },
      },
      filtered: {
        reform: {
          id: 2,
          label: 'Reform proposal',
        },
      },
    },
    version: '1.0.0',
  },
};

export const mockCountryId = 'uk';
export const mockInvalidCountryId = 'invalid-country';
export const mockUSCountryId = 'us';
export const mockEmptyCountryId = '';

// Test constants for assertions
export const TEST_PARAMETER_KEY = 'test';

export const mockCustomResponse: MetadataApiPayload = {
  status: 'ok',
  message: null,
  result: {
    parameters: {
      [TEST_PARAMETER_KEY]: {
        parameter: TEST_PARAMETER_KEY,
        label: 'Test Parameter',
        values: { '2024-01-01': 100 },
      },
    },
    variables: {},
    entities: {},
    variableModules: {},
    economy_options: {
      region: [],
      time_period: [],
      datasets: [],
    },
    current_law_id: 1,
    basicInputs: [],
    modelled_policies: {
      core: {},
      filtered: {},
    },
    version: '1.0.0',
  },
};

// Error responses
export const mockNetworkError = new Error('Network error');
export const mockJSONParseError = new Error('Invalid JSON');

// Response mocks
export const mockSuccessResponse = {
  ok: true,
  json: async () => mockMetadataResponse,
} as Response;

export const mock404Response = {
  ok: false,
  status: 404,
  statusText: 'Not Found',
} as Response;

export const mock500Response = {
  ok: false,
  status: 500,
  statusText: 'Internal Server Error',
} as Response;

export const mockInvalidJSONResponse = {
  ok: true,
  json: async () => {
    throw mockJSONParseError;
  },
} as unknown as Response;

export const mockCustomSuccessResponse = {
  ok: true,
  json: async () => mockCustomResponse,
} as Response;

// Expected error messages
export const getExpectedFetchError = (countryId: string) =>
  `Failed to fetch metadata for ${countryId}`;
