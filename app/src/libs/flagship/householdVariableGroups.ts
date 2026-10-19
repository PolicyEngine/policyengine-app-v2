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

/** Income's parts, in the order a reader looks for them. */
export const HOUSEHOLD_INCOME_SUBGROUPS = [
  'Wages and work',
  'Self-employment and business',
  'Investments',
  'Retirement',
  'Other income',
] as const;

const WORK_MODULES = new Set([
  'hourly_wage',
  'hours_worked_last_week',
  'is_paid_hourly',
  'is_union_member_or_covered',
  'tip_income',
  'fsla_overtime_premium',
  'weekly_hours_worked',
  'dependent_care_employer_benefits',
]);
const BUSINESS_MODULES = new Set(['self_employment', 'farm', 'estate']);
const INVESTMENT_MODULES = new Set([
  'capital_gains',
  'dividends',
  'interest',
  'us_govt_interest_person',
  'property_sales_net_capital_gain',
  'form_4972_lumpsum_distributions',
]);

/**
 * The part of its group a variable reads under, from its module: Income
 * splits into wages, business, investments, retirement and the rest.
 * Null for groups without parts.
 */
export function householdVariableSubgroup(variable: VariableInfo): string | null {
  if (householdVariableGroup(variable) !== 'Income') {
    return null;
  }
  // `household.income.person.dividends…` → "dividends"; a module at the top keeps its own name.
  const parts = (variable.moduleName ?? '').split('.');
  const leaf = ['person', 'tax_unit', 'spm_unit', 'household'].includes(parts[2])
    ? parts[3]
    : parts[2];
  if (WORK_MODULES.has(leaf)) {
    return 'Wages and work';
  }
  if (BUSINESS_MODULES.has(leaf)) {
    return 'Self-employment and business';
  }
  if (INVESTMENT_MODULES.has(leaf)) {
    return 'Investments';
  }
  if (leaf === 'retirement') {
    return 'Retirement';
  }
  return 'Other income';
}

/**
 * Inputs a reader does not describe a household with: amounts the survey
 * reports for a whole unit, analysts' incidence inputs, and inputs the
 * model keeps only for old API callers.
 */
export function describesAHousehold(variable: VariableInfo): boolean {
  const module = variable.moduleName ?? '';
  return !(
    /^deprecated/i.test(variable.documentation ?? '') ||
    /(^|_)reported($|_)/.test(variable.name) ||
    module.startsWith('household.income.spm_unit') ||
    module.startsWith('household.income.household.cbo')
  );
}
