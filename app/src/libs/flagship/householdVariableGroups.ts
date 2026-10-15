/**
 * Groups for the household builder's variable search, from where the
 * model files each input (its module): income, people, housing, and so
 * on, in the order a reader looks for them. State and local programs'
 * inputs belong to one state, so only the household's state's show.
 */
import type { VariableInfo } from '@/utils/VariableResolver';

export const HOUSEHOLD_VARIABLE_GROUPS = [
  'Income',
  'People',
  'Housing and utilities',
  'Health',
  'Other expenses',
  'Assets',
  'Benefits and taxes',
  'State and local',
  'Other',
] as const;

export type HouseholdVariableGroup = (typeof HOUSEHOLD_VARIABLE_GROUPS)[number];

export function householdVariableGroup(variable: VariableInfo): HouseholdVariableGroup {
  const module = variable.moduleName ?? '';
  if (module.startsWith('household.income')) {
    return 'Income';
  }
  if (module.startsWith('household.demographic') || module.startsWith('input.geography')) {
    return 'People';
  }
  if (
    module.startsWith('household.expense.housing') ||
    module.startsWith('household.expense.utilities')
  ) {
    return 'Housing and utilities';
  }
  if (module.startsWith('household.expense.health')) {
    return 'Health';
  }
  if (module.startsWith('household.expense')) {
    return 'Other expenses';
  }
  if (module.startsWith('household.assets')) {
    return 'Assets';
  }
  if (module.startsWith('gov.states') || module.startsWith('gov.local')) {
    return 'State and local';
  }
  if (module.startsWith('gov.') && !module.startsWith('gov.puf')) {
    return 'Benefits and taxes';
  }
  return 'Other';
}

/** The two-letter state a state or local program's input belongs to, e.g. "ca"; null otherwise. */
function programState(variable: VariableInfo): string | null {
  const match = /^gov\.(?:states|local)\.([a-z]{2})(?:\.|$)/.exec(variable.moduleName ?? '');
  return match ? match[1] : null;
}

/**
 * Whether the search lists a variable for a household in `stateCode`
 * ("CA"): every input but other states' programs. With no state chosen,
 * no state's programs show — choosing one brings them.
 */
export function listsForState(variable: VariableInfo, stateCode: string | null): boolean {
  const state = programState(variable);
  return state === null || (!!stateCode && state === stateCode.toLowerCase());
}
