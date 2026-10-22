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
const NOT_OFFERED_ON_EARNINGS_CHART = new Set(['employment_income', 'age']);

/** Whether an input's value, or any of its yearly values, is a nonzero amount. */
function setsAnAmount(value: unknown): boolean {
  const amounts =
    value && typeof value === 'object' && !Array.isArray(value)
      ? Object.values(value as Record<string, unknown>)
      : [value];
  return amounts.some((amount) => typeof amount === 'number' && amount !== 0);
}

/**
 * The amounts the household itself sets, by variable name, in the order
 * first met: tip income for a household with tips. The earnings variation
 * offers these beside its calculated variables (issue #1096).
 */
export function householdAmountInputs(household: Household): string[] {
  const variables = [
    ...household
      .getAllPeople()
      .flatMap((person) => household.getPersonVariableEntries(person.name)),
    ...household.getConfiguredGroupsWithVariables().flatMap((group) => group.variables),
  ];
  const names = variables
    .filter(
      (variable) =>
        !NOT_OFFERED_ON_EARNINGS_CHART.has(variable.name) && setsAnAmount(variable.value)
    )
    .map((variable) => variable.name);
  return [...new Set(names)];
}
