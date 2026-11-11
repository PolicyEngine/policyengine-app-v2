import { v1ShapedVariable } from '@/api/publicApi/catalogVariables';
import { v1DatedValues } from '@/api/publicApi/datedValues';
import {
  REAL_SHAPE_PART_PARAMETER_VALUES,
  REAL_SHAPE_PARTS_PARAMETER,
  REAL_SHAPE_PARTS_VARIABLE,
} from '@/tests/fixtures/api/publicApi/catalogVariablesRealShape';
import type { HouseholdCalculationOutput } from '@/types/calculation/household';
import type { MetadataState } from '@/types/metadata';

/** Two of the real list's parts: one it drops from 2018, one it keeps. */
export const DROPPED_FROM_2018 = 'domestic_production_ald';
export const KEPT_THROUGHOUT = 'student_loan_interest_ald';

function taxUnitVariable(name: string, label: string) {
  return { name, label, entity: 'tax_unit', unit: 'currency-USD', valueType: 'float' } as any;
}

/** The store on the v2 routes once the real variable and its part values are in. */
export const REAL_SHAPE_V2_METADATA: MetadataState = {
  loading: false,
  error: null,
  currentCountry: 'us',
  progress: 100,
  variables: {
    [REAL_SHAPE_PARTS_VARIABLE.name]: v1ShapedVariable(REAL_SHAPE_PARTS_VARIABLE),
    [DROPPED_FROM_2018]: taxUnitVariable(DROPPED_FROM_2018, 'Domestic production deduction'),
    [KEPT_THROUGHOUT]: taxUnitVariable(KEPT_THROUGHOUT, 'Student loan interest deduction'),
  },
  parameters: {},
  entities: { tax_unit: { key: 'tax_unit', plural: 'tax_units', is_person: false } as any },
  variableModules: {},
  economyOptions: { region: [], time_period: [], datasets: [] },
  currentLawId: 2,
  basicInputs: [],
  modelledPolicies: { core: {}, filtered: {} },
  version: '6.10.0',
  parameterTree: null,
  routes: 'v2',
  v2PartParameterValues: {
    [REAL_SHAPE_PARTS_PARAMETER]: v1DatedValues(
      REAL_SHAPE_PARTS_PARAMETER,
      REAL_SHAPE_PART_PARAMETER_VALUES
    ),
  },
};

/** A tax unit with each of the two deductions, for one year. */
export function taxUnitWithDeductions(year: string): HouseholdCalculationOutput {
  return {
    id: 'household-1',
    countryId: 'us',
    householdData: {
      people: {},
      taxUnits: {
        'your tax unit': {
          members: [],
          [REAL_SHAPE_PARTS_VARIABLE.name]: { [year]: 300 },
          [DROPPED_FROM_2018]: { [year]: 100 },
          [KEPT_THROUGHOUT]: { [year]: 200 },
        },
      },
    },
  } as HouseholdCalculationOutput;
}
