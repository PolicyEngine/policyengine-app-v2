import type { components } from '@/api/publicApi/schema';
import { TEST_POLICYENGINE_VERSION } from '@/tests/fixtures/api/publicApi/modelCatalogMocks';

type Schemas = components['schemas'];

/** A parameter whose value lists the variables `household_benefits` adds. */
export const BENEFITS_PARAMETER_PATH = 'gov.household.household_benefits';
/** A parameter `countable_income` subtracts, which the catalog version does not have. */
export const ABSENT_PARTS_PARAMETER_PATH = 'gov.example.absent_deductions';

function variable(
  name: string,
  fields: Partial<Schemas['MetadataVariable']> = {}
): Schemas['MetadataVariable'] {
  return {
    id: `variable-${name}`,
    name,
    label: null,
    entity: 'person',
    description: null,
    data_type: 'float',
    possible_values: null,
    default_value: 0,
    adds: null,
    subtracts: null,
    is_input_variable: false,
    hidden_input: false,
    module_name: null,
    adds_parameter_path: null,
    subtracts_parameter_path: null,
    enum_values: null,
    unit: null,
    definition_period: 'year',
    ...fields,
  };
}

export const AGE_VARIABLE = variable('age', {
  label: 'Age',
  data_type: 'int',
  default_value: 40,
  is_input_variable: true,
  module_name: 'household.demographic.age',
});

export const EMPLOYMENT_INCOME_VARIABLE = variable('employment_income', {
  label: 'Employment income',
  description: 'Wages and salaries',
  is_input_variable: true,
  module_name: 'household.income.person.employment_income',
  unit: 'currency-USD',
});

/** Rent is paid by the month. */
export const RENT_VARIABLE = variable('rent', {
  label: 'Rent',
  entity: 'household',
  is_input_variable: true,
  unit: 'currency-USD',
  definition_period: 'month',
});

/** A rate, as a share of one. */
export const TAX_RATE_VARIABLE = variable('marginal_tax_rate', {
  label: 'Marginal tax rate',
  unit: '/1',
});

/** A version published before catalog format 2 has neither a unit nor a period. */
export const UNDESCRIBED_VARIABLE = variable('undescribed_income', {
  label: 'Undescribed income',
  is_input_variable: true,
  unit: null,
  definition_period: null,
});

export const RATING_AREA_VARIABLE = variable('medicaid_rating_area', {
  label: 'Medicaid rating area',
  data_type: 'int',
  is_input_variable: true,
  hidden_input: true,
});

/** As the catalog publishes an enum: data type "str", with its values. */
export const FILING_STATUS_VARIABLE = variable('filing_status', {
  label: 'Filing status',
  data_type: 'str',
  default_value: 'SINGLE',
  possible_values: ['SINGLE', 'JOINT'],
  is_input_variable: true,
  enum_values: [
    { value: 'SINGLE', label: 'Single' },
    { value: 'JOINT', label: 2 },
  ],
});

export const SNAP_VARIABLE = variable('snap', {
  label: 'SNAP',
  entity: 'household',
  unit: 'currency-USD',
});
export const SSI_VARIABLE = variable('ssi', { label: 'SSI', unit: 'currency-USD' });

export const HOUSEHOLD_BENEFITS_VARIABLE = variable('household_benefits', {
  label: 'Benefits',
  entity: 'household',
  adds_parameter_path: BENEFITS_PARAMETER_PATH,
});

export const COUNTABLE_INCOME_VARIABLE = variable('countable_income', {
  label: 'Countable income',
  adds: ['employment_income'],
  subtracts_parameter_path: ABSENT_PARTS_PARAMETER_PATH,
});

/** What `GET /v2/model-catalog/variables` answers for the small US catalog version. */
export const US_CATALOG_VARIABLES_RESULT: Schemas['MetadataCatalogVariablesResult'] = {
  policyengine_version: TEST_POLICYENGINE_VERSION,
  catalog_format: 2,
  variables: [
    AGE_VARIABLE,
    COUNTABLE_INCOME_VARIABLE,
    EMPLOYMENT_INCOME_VARIABLE,
    FILING_STATUS_VARIABLE,
    HOUSEHOLD_BENEFITS_VARIABLE,
    RATING_AREA_VARIABLE,
    RENT_VARIABLE,
    SNAP_VARIABLE,
    SSI_VARIABLE,
    TAX_RATE_VARIABLE,
    UNDESCRIBED_VARIABLE,
  ],
  part_parameter_values: {
    // Benefits add SNAP until 2025, then SNAP and SSI from 2026.
    [BENEFITS_PARAMETER_PATH]: [
      { start_date: '0001-01-01T00:00:00', end_date: '2025-12-31T00:00:00', value: ['snap'] },
      { start_date: '2026-01-01T00:00:00', end_date: null, value: ['snap', 'ssi'] },
    ],
    [ABSENT_PARTS_PARAMETER_PATH]: [],
  },
};

export function catalogVariablesEnvelope(
  result: Schemas['MetadataCatalogVariablesResult'] = US_CATALOG_VARIABLES_RESULT
) {
  return { status: 'ok', message: null, result };
}

/** The route every variables test stubs. */
export const VARIABLES_PATH = '/v2/model-catalog/variables';

/** A reform that adds SSI to the benefits a household's total counts: a change that lists variables. */
export const LIST_PROVISION = {
  path: 'gov.household.household_benefits',
  breadcrumb: 'Household → Benefits',
  unit: null,
  baselineValue: ['snap'],
  value: ['snap', 'ssi'],
};

/** A variables route that fails once, then answers: for "try again" tests. */
export function failOnceThenAnswerVariables(): () => Response {
  let attempts = 0;
  return () => {
    attempts += 1;
    return attempts === 1
      ? new Response(JSON.stringify({ status: 'error', message: 'Unavailable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      : new Response(JSON.stringify(catalogVariablesEnvelope()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
  };
}

/** A variable without a label and without catalog format 2's details. */
export const UNLABELLED_VARIABLE = variable('unlabelled_variable', {
  is_input_variable: null,
  hidden_input: null,
  unit: null,
  definition_period: null,
});

/** The variables route's answer holding only the unlabelled variable. */
export const UNLABELLED_VARIABLES_RESULT: Schemas['MetadataCatalogVariablesResult'] = {
  policyengine_version: TEST_POLICYENGINE_VERSION,
  catalog_format: 2,
  variables: [UNLABELLED_VARIABLE],
  part_parameter_values: {},
};

/** A parameter's list of parts by date, as the store holds part values. */
export const BENEFITS_PART_VALUES = {
  [BENEFITS_PARAMETER_PATH]: { '0000-01-01': ['snap'], '2026-01-01': ['snap', 'ssi'] },
};
