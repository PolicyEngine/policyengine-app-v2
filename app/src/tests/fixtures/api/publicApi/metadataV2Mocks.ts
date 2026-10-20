import type { components } from '@/api/publicApi/schema';

type Schemas = components['schemas'];

export const V2_POLICYENGINE_VERSION = '6.7.5';
export const V2_MODEL_ID = '0b6c4f6e-7c55-5d47-9a51-4e9f5fbbf001';
export const V2_MODEL_VERSION_ID = '0b6c4f6e-7c55-5d47-9a51-4e9f5fbbf002';

export const V2_PARAMETER_IDS = {
  CTC_AMOUNT: '6a1f0c1e-1111-5aaa-8bbb-000000000001',
  CTC_PHASE_OUT: '6a1f0c1e-1111-5aaa-8bbb-000000000002',
  TAXSIM_SWITCH: '6a1f0c1e-1111-5aaa-8bbb-000000000003',
  CALIBRATION_TARGET: '6a1f0c1e-1111-5aaa-8bbb-000000000004',
  BRACKET_RATE: '6a1f0c1e-1111-5aaa-8bbb-000000000005',
} as const;

export const V2_ENTITIES: Schemas['MetadataEntity'][] = [
  {
    key: 'person',
    plural: 'people',
    label: 'Person',
    description: 'An individual.',
    is_person: true,
    roles: [],
  },
  {
    key: 'tax_unit',
    plural: 'tax_units',
    label: 'Tax unit',
    description: 'A tax unit.',
    is_person: false,
    roles: [{ key: 'member', plural: 'members', label: 'Member', description: null }],
  },
];

export function modelSelection(
  overrides: Partial<Schemas['MetadataModelVersionDetail']> = {}
): Schemas['MetadataModelSelectionResult'] {
  return {
    policyengine_version: V2_POLICYENGINE_VERSION,
    model: { id: V2_MODEL_ID, name: 'policyengine-us', description: 'US model' },
    model_version: {
      id: V2_MODEL_VERSION_ID,
      model_id: V2_MODEL_ID,
      version: V2_POLICYENGINE_VERSION,
      description: 'US model',
      current_law_id: 2,
      metadata_time_periods: [2027, 2026, 2025],
      catalog_format: 2,
      entities: V2_ENTITIES,
      basic_inputs: ['state_name', 'employment_income', 'age'],
      ...overrides,
    },
  };
}

function catalogParameter(
  overrides: Partial<Schemas['MetadataCatalogParameter']> &
    Pick<Schemas['MetadataCatalogParameter'], 'id' | 'name'>
): Schemas['MetadataCatalogParameter'] {
  return {
    label: null,
    description: null,
    data_type: 'float',
    unit: null,
    metadata_label: null,
    period: null,
    economy: true,
    household: true,
    values: {},
    ...overrides,
  };
}

export function modelCatalog(
  overrides: Partial<Schemas['MetadataCatalogResult']> = {}
): Schemas['MetadataCatalogResult'] {
  return {
    policyengine_version: V2_POLICYENGINE_VERSION,
    parameter_nodes: [
      { name: 'gov', label: 'Government', description: null },
      { name: 'gov.irs.credits.ctc', label: 'Child Tax Credit', description: null },
      { name: 'gov.irs.income.bracket', label: null, description: null },
      { name: 'gov.irs.income.bracket.rates[0]', label: null, description: null },
    ],
    parameters: [
      catalogParameter({
        id: V2_PARAMETER_IDS.CALIBRATION_TARGET,
        name: 'calibration.gov.cbo.income_tax',
        label: 'CBO income tax',
        values: { '2024-01-01': 2_000_000_000_000 },
      }),
      catalogParameter({
        id: V2_PARAMETER_IDS.CTC_AMOUNT,
        name: 'gov.irs.credits.ctc.amount.base[0].amount',
        label: 'Child Tax Credit base amount (bracket 1 amount)',
        metadata_label: 'CTC base amount',
        description: 'Maximum credit per child',
        unit: 'currency-USD',
        period: 'year',
        values: { '2024-01-01': 2000, '2026-01-01': 2200 },
      }),
      catalogParameter({
        id: V2_PARAMETER_IDS.CTC_PHASE_OUT,
        name: 'gov.irs.credits.ctc.phase_out.threshold',
        label: 'Child Tax Credit phase-out threshold',
        unit: 'currency-USD',
        economy: false,
        household: true,
        values: { '2018-01-01': 'Infinity' },
      }),
      catalogParameter({
        id: V2_PARAMETER_IDS.BRACKET_RATE,
        name: 'gov.irs.income.bracket.rates[0].rate',
        label: 'Income tax rate (bracket 1 rate)',
        unit: '/1',
        values: { '2018-01-01': 0.1 },
      }),
    ],
    variables: [
      {
        id: '7b2e0000-2222-5aaa-8bbb-000000000001',
        name: 'employment_income',
        label: 'Employment income',
        entity: 'person',
        description: 'Wages and salaries',
        data_type: 'float',
        possible_values: null,
        default_value: 0,
        adds: null,
        subtracts: null,
        value_type: 'float',
        definition_period: 'year',
        unit: 'currency-USD',
        module_name: 'household.income.person.employment_income',
        is_input_variable: true,
        hidden_input: false,
        possible_value_labels: null,
      },
      {
        id: '7b2e0000-2222-5aaa-8bbb-000000000002',
        name: 'state_name',
        label: 'State',
        entity: 'household',
        description: null,
        data_type: 'str',
        possible_values: ['AL', 'CA'],
        default_value: 'CA',
        adds: null,
        subtracts: null,
        value_type: 'Enum',
        definition_period: 'year',
        unit: null,
        module_name: 'household.demographic.geographic.state_name',
        is_input_variable: true,
        hidden_input: false,
        possible_value_labels: { AL: 'Alabama', CA: 'California' },
      },
      {
        id: '7b2e0000-2222-5aaa-8bbb-000000000003',
        name: 'household_net_income',
        label: 'Net income',
        entity: 'household',
        description: null,
        data_type: 'float',
        possible_values: null,
        default_value: 0,
        adds: ['household_market_income'],
        subtracts: ['household_tax'],
        value_type: 'float',
        definition_period: 'year',
        unit: 'currency-USD',
        module_name: 'household.income.household.household_net_income',
        is_input_variable: false,
        hidden_input: false,
        possible_value_labels: null,
      },
    ],
    ...overrides,
  };
}

function region(
  code: string,
  label: string,
  regionType: Schemas['MetadataRegionType'],
  extra: Partial<Schemas['MetadataRegion']> = {}
): Schemas['MetadataRegion'] {
  return {
    id: `8c3f0000-3333-5aaa-8bbb-${String(code.length).padStart(12, '0')}`,
    code,
    label,
    region_type: regionType,
    requires_filter: regionType !== 'national',
    filter_field: null,
    filter_value: null,
    filter_strategy: null,
    parent_code: null,
    state_code: null,
    state_name: null,
    default_dataset_id: '9d4a0000-4444-5aaa-8bbb-000000000001',
    ...extra,
  };
}

/** Regions in the API's order (by code), including a place v1 never listed. */
export const V2_US_REGIONS: Schemas['MetadataRegion'][] = [
  region(
    'congressional_district/CA-01',
    "California's 1st congressional district",
    'congressional_district',
    {
      state_code: 'CA',
      state_name: 'California',
    }
  ),
  region('place/CA-44000', 'Los Angeles', 'place', { state_code: 'CA', state_name: 'California' }),
  region('state/ca', 'California', 'state', { state_code: 'CA', state_name: 'California' }),
  region('us', 'United States', 'national'),
];
