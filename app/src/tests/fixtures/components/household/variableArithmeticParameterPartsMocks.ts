import type { HouseholdCalculationOutput } from '@/types/calculation/household';
import type { MetadataState } from '@/types/metadata';

/** A parameter whose value lists the variables benefits add: SNAP, then SNAP and SSI from 2026. */
export const BENEFITS_PARTS = 'gov.household.household_benefits';
/** A parameter the catalog version does not have values for. */
export const ABSENT_PARTS = 'gov.example.absent_deductions';

export const BENEFITS_PARTS_VALUES = { '0000-01-01': ['snap'], '2026-01-01': ['snap', 'ssi'] };

function householdVariable(label: string, fields: Record<string, unknown> = {}) {
  return { entity: 'household', label, unit: 'currency-USD', valueType: 'float', ...fields } as any;
}

const VARIABLES: MetadataState['variables'] = {
  household_benefits: householdVariable('benefits', { adds: BENEFITS_PARTS }),
  countable_income: householdVariable('countable income', {
    adds: ['earnings'],
    subtracts: ABSENT_PARTS,
  }),
  earnings: householdVariable('earnings'),
  snap: householdVariable('SNAP'),
  ssi: householdVariable('SSI'),
};

function metadataState(fields: Partial<MetadataState>): MetadataState {
  return {
    loading: false,
    error: null,
    currentCountry: 'us',
    progress: 100,
    variables: VARIABLES,
    parameters: {},
    entities: { household: { plural: 'households', label: 'Household' } as any },
    variableModules: {},
    economyOptions: { region: [], time_period: [], datasets: [] },
    currentLawId: 2,
    basicInputs: [],
    modelledPolicies: { core: {}, filtered: {} },
    version: '6.11.1',
    parameterTree: null,
    ...fields,
  };
}

/** On the v2 routes: no parameter list, and the parts' dated values from the variables route. */
export const V2_METADATA = metadataState({
  routes: 'v2',
  v2PartParameterValues: { [BENEFITS_PARTS]: BENEFITS_PARTS_VALUES, [ABSENT_PARTS]: {} },
});

/** On the v1 routes: the parts' parameter is in the whole parameter list. */
export const V1_METADATA = metadataState({
  parameters: {
    [BENEFITS_PARTS]: {
      type: 'parameter',
      parameter: BENEFITS_PARTS,
      label: 'Benefits',
      values: BENEFITS_PARTS_VALUES,
    } as any,
  },
});

export function household(year: string): HouseholdCalculationOutput {
  return {
    id: 'household-1',
    countryId: 'us',
    householdData: {
      people: {},
      households: {
        'your household': {
          members: [],
          household_benefits: { [year]: 300 },
          countable_income: { [year]: 1000 },
          earnings: { [year]: 1000 },
          snap: { [year]: 100 },
          ssi: { [year]: 200 },
        },
      },
    },
  } as HouseholdCalculationOutput;
}
