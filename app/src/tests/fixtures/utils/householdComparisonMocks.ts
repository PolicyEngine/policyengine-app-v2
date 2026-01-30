import type { Household } from '@/types/ingredients/Household';
import type { HouseholdMetadataContext } from '@/utils/householdValues';

export const mockHousehold = (_netIncome: number = 50000): Household => ({
  id: 'household-1',
  tax_benefit_model_name: 'policyengine_us',
  year: 2025,
  people: [],
});

// HouseholdMetadataContext for household comparison tests
export const mockMetadataContext = (): HouseholdMetadataContext => ({
  variables: {},
  entities: {
    person: { plural: 'people', label: 'Person' },
    household: { plural: 'households', label: 'Household' },
  },
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
