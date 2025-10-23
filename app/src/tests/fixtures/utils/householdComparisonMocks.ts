import type { Household } from '@/types/ingredients/Household';
import type { MetadataState } from '@/types/metadata';

export const mockHousehold = (netIncome: number = 50000): Household => ({
  id: 'household-1',
  countryId: 'us',
  householdData: {
    people: {},
    households: {},
    families: {},
    marital_units: {},
    tax_units: {},
    spm_units: {},
  },
});

export const mockMetadata = (): MetadataState => ({
  currentCountry: 'us',
  variables: {},
  parameters: {},
  entities: {},
  variableModules: {},
  economyOptions: {
    region: [],
    time_period: [],
    datasets: [],
  },
  currentLawId: 1,
  basicInputs: [],
  modelledPolicies: { core: {}, filtered: {} },
  version: '1.0.0',
  parameterTree: null,
  loading: false,
  error: null,
});

export const TEST_VARIABLE_NAMES = {
  NET_INCOME: 'household_net_income',
  BENEFITS: 'household_benefits',
} as const;

export const TEST_VALUES = {
  BASELINE_INCOME: 50000,
  REFORM_INCOME_INCREASE: 55000,
  REFORM_INCOME_DECREASE: 45000,
  REFORM_INCOME_SAME: 50000,
} as const;
