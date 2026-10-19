import type { Household } from '@/models/Household';

/**
 * Helpers for v3's standalone household report: one household, run under
 * a baseline and, optionally, a reform.
 */

/**
 * Inputs every household carries that say nothing on a chart against
 * earnings: the earnings the chart varies, and age, which the household
 * builder sets for everyone.
 */
const NOT_OFFERED = new Set(['employment_income', 'age']);

/**
 * The amounts the household itself sets, by variable name, in the order
 * first met: tip income for a household with tips. The earnings variation
 * offers these beside its calculated variables (issue #1096).
 */
export function householdAmountInputs(household: Household): string[] {
  const names: string[] = [];
  const consider = (name: string, value: unknown) => {
    const amounts =
      value && typeof value === 'object' && !Array.isArray(value)
        ? Object.values(value as Record<string, unknown>)
        : [value];
    if (
      !NOT_OFFERED.has(name) &&
      !names.includes(name) &&
      amounts.some((amount) => typeof amount === 'number' && amount !== 0)
    ) {
      names.push(name);
    }
  };
  for (const person of household.getAllPeople()) {
    for (const variable of household.getPersonVariableEntries(person.name)) {
      consider(variable.name, variable.value);
    }
  }
  for (const group of household.getConfiguredGroupsWithVariables()) {
    for (const variable of group.variables) {
      consider(variable.name, variable.value);
    }
  }
  return names;
}
