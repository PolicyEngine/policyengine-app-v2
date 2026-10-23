import { Household } from '@/models/Household';
import type { HouseholdCalculationOutput } from '@/types/calculation/household';

export const REPORT_YEAR = '2026';

/** Points across earnings in a variation, as the Public API returns them (401 in production). */
const VARIATION_POINTS = 5;
const acrossEarnings = (step: number) =>
  Array.from({ length: VARIATION_POINTS }, (_, pointIndex) => pointIndex * step);
const constantAcrossEarnings = (value: number) => acrossEarnings(0).map(() => value);

/**
 * A US household with tip income (issue #1096), earnings the chart varies,
 * and a rent input left at zero, which says nothing about the household.
 */
export const HOUSEHOLD_WITH_TIPS = Household.starter('us', REPORT_YEAR)
  .setPersonVariableAtYear('you', 'employment_income', REPORT_YEAR, 40000)
  .setPersonVariableAtYear('you', 'tip_income', REPORT_YEAR, 6000)
  .setPersonVariableAtYear('you', 'rent', REPORT_YEAR, 0)
  .setGroupVariableAtYear('households', 'your household', 'state_name', REPORT_YEAR, 'NV');

/** The model's metadata for the variation's variables: tip income and age are inputs. */
export const VARIATION_METADATA_VARIABLES = {
  employment_income: { entity: 'person', label: 'Employment income', isInputVariable: false },
  tip_income: { entity: 'person', label: 'Tip income', isInputVariable: true },
  age: { entity: 'person', label: 'Age', isInputVariable: true },
  marginal_tax_rate: { entity: 'person', label: 'Marginal tax rate' },
  household_net_income: { entity: 'household', label: 'Net income', isInputVariable: false },
};

/** The household calculated across earnings: every variable an array of points. */
export const TIPS_VARIATION: HouseholdCalculationOutput = {
  countryId: 'us',
  householdData: {
    people: {
      you: {
        age: { [REPORT_YEAR]: constantAcrossEarnings(30) },
        employment_income: { [REPORT_YEAR]: acrossEarnings(10000) },
        tip_income: { [REPORT_YEAR]: constantAcrossEarnings(6000) },
      },
    },
    households: {
      'your household': {
        members: ['you'],
        household_net_income: { [REPORT_YEAR]: acrossEarnings(9000) },
      },
    },
  },
};

/** The same household calculated once, at its own earnings. */
export const TIPS_POINT_OUTPUT: HouseholdCalculationOutput = {
  countryId: 'us',
  householdData: {
    people: {
      you: {
        age: { [REPORT_YEAR]: 30 },
        employment_income: { [REPORT_YEAR]: 40000 },
        tip_income: { [REPORT_YEAR]: 6000 },
      },
    },
    households: {
      'your household': { members: ['you'], household_net_income: { [REPORT_YEAR]: 41000 } },
    },
  },
};
