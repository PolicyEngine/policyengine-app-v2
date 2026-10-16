import { STATE_NAMES } from '@/api/billFeed';
import { createHousehold } from '@/api/household';
import { fetchHouseholdCalculation } from '@/api/householdCalculation';
import { Household } from '@/models/Household';
import type { V1HouseholdCreateEnvelope } from '@/models/household/v1Types';
import type { HouseholdCalculationData } from '@/types/calculation/household';
import { formatCurrency } from '@/utils/formatters';

/**
 * A household run for the flagship report: one family, described in a
 * few fields, run under the report's baseline and reform policies for
 * the report's year through the same v1 household endpoints the v2
 * household flow uses — create the household, then calculate it under
 * each policy.
 */

/** The household as the report's form describes it. US only for now. */
export interface FlagshipHouseholdInput {
  /** Two-letter state code, e.g. "CA". */
  state: string;
  married: boolean;
  /** One age per child, each 0–17. */
  childAges: number[];
  /** The head's annual employment income. */
  earnings: number;
  /** The partner's annual employment income; read only when married. */
  partnerEarnings: number;
}

export const MAX_CHILDREN = 6;
export const MAX_CHILD_AGE = 17;
export const DEFAULT_CHILD_AGE = 10;
const DEFAULT_STATE = 'CA';
const DEFAULT_EARNINGS = 50000;
/** A change smaller than a dollar reads as no change. */
const NEGLIGIBLE = 1;

/**
 * The form's starting household: single, no children, $50,000 a year, in
 * the report's state — a state or district report's own state, else
 * California, the model's default.
 */
export function defaultHouseholdInput(region?: string): FlagshipHouseholdInput {
  return {
    state: stateFromRegion(region) ?? DEFAULT_STATE,
    married: false,
    childAges: [],
    earnings: DEFAULT_EARNINGS,
    partnerEarnings: 0,
  };
}

/** "state/ny" → "NY", "congressional_district/TX-07" → "TX"; nothing for the country. */
export function stateFromRegion(region?: string): string | undefined {
  const match = region?.match(/^(?:state\/([a-z]{2})|congressional_district\/([a-z]{2})-)/i);
  const code = (match?.[1] ?? match?.[2])?.toUpperCase();
  return code && STATE_NAMES[code] ? code : undefined;
}

const isAmount = (value: number) => Number.isFinite(value) && value >= 0;
const isChildAge = (age: number) => Number.isInteger(age) && age >= 0 && age <= MAX_CHILD_AGE;

/** Whether the household can run: a known state, amounts of zero or more, children's ages. */
export function isValidHouseholdInput(input: FlagshipHouseholdInput): boolean {
  return (
    !!STATE_NAMES[input.state] &&
    isAmount(input.earnings) &&
    (!input.married || isAmount(input.partnerEarnings)) &&
    input.childAges.length <= MAX_CHILDREN &&
    input.childAges.every(isChildAge)
  );
}

/**
 * The v1 household for the input, built with the v2 builder's own model
 * so the API reads it as it reads a v2 household: the head is "you", and
 * the API takes the year to calculate from "you"'s age.
 */
export function buildHouseholdPayload(
  input: FlagshipHouseholdInput,
  year: string
): V1HouseholdCreateEnvelope {
  let household = Household.starter('us', year)
    .withBuilderMaritalStatus(year, input.married ? 'married' : 'single')
    .withBuilderChildCount(year, input.childAges.length);
  const { primaryPersonKey, partnerKey, childKeys } = household.deriveBuilderComposition(year);
  if (primaryPersonKey) {
    household = household.setPersonVariableAtYear(
      primaryPersonKey,
      'employment_income',
      year,
      input.earnings
    );
  }
  if (partnerKey) {
    household = household.setPersonVariableAtYear(
      partnerKey,
      'employment_income',
      year,
      input.partnerEarnings
    );
  }
  childKeys.forEach((childKey, index) => {
    household = household.setPersonVariableAtYear(
      childKey,
      'age',
      year,
      input.childAges[index] ?? DEFAULT_CHILD_AGE
    );
  });
  const householdKey = Object.keys(household.householdData.households ?? {})[0];
  if (householdKey) {
    household = household.setGroupVariableAtYear(
      'households',
      householdKey,
      'state_name',
      year,
      input.state
    );
  }
  return household.toV1CreationPayload();
}

type EntityPlural = 'people' | 'households' | 'tax_units' | 'spm_units';

/** The app's camel-case keys, for results already in the app's shape. */
const APP_KEYS: Record<EntityPlural, string> = {
  people: 'people',
  households: 'households',
  tax_units: 'taxUnits',
  spm_units: 'spmUnits',
};

/**
 * A variable's total across every entity of its kind in a calculated
 * household, in one year; null when the result does not carry it. The
 * API answers in its own snake-case keys ("tax_units").
 */
export function readHouseholdTotal(
  result: HouseholdCalculationData,
  entity: EntityPlural,
  variable: string,
  year: string
): number | null {
  const groups = result as unknown as Record<string, Record<string, unknown> | undefined>;
  const collection = groups[entity] ?? groups[APP_KEYS[entity]];
  if (!collection) {
    return null;
  }
  let total = 0;
  let found = false;
  for (const instance of Object.values(collection)) {
    const values = (instance as Record<string, unknown> | undefined)?.[variable];
    if (values && typeof values === 'object' && !Array.isArray(values)) {
      const value = (values as Record<string, unknown>)[year];
      if (typeof value === 'number' && Number.isFinite(value)) {
        total += value;
        found = true;
      }
    }
  }
  return found ? total : null;
}

interface LineDefinition {
  id: string;
  label: string;
  /** +1 when more of it is more net income (a benefit), −1 when less (a tax). */
  sign: 1 | -1;
  sources: Array<{ entity: EntityPlural; variable: string }>;
}

/** The parts of net income a reform most often moves; with "Other", they sum to its change. */
const COMPONENTS: LineDefinition[] = [
  {
    id: 'federal_income_tax',
    label: 'Federal income tax',
    sign: -1,
    sources: [{ entity: 'tax_units', variable: 'income_tax' }],
  },
  {
    id: 'state_income_tax',
    label: 'State income tax',
    sign: -1,
    sources: [{ entity: 'tax_units', variable: 'state_income_tax' }],
  },
  {
    id: 'local_income_tax',
    label: 'Local income tax',
    sign: -1,
    sources: [{ entity: 'tax_units', variable: 'local_income_tax' }],
  },
  {
    id: 'payroll_tax',
    label: 'Payroll tax',
    sign: -1,
    sources: [
      { entity: 'tax_units', variable: 'employee_payroll_tax' },
      { entity: 'people', variable: 'self_employment_tax' },
    ],
  },
  {
    id: 'benefits',
    label: 'Benefits',
    sign: 1,
    sources: [{ entity: 'households', variable: 'household_benefits' }],
  },
];

/**
 * Credits and benefits within those parts, listed when a reform changes
 * them. Each is what the household receives: the Child Tax Credit is
 * `ctc_value`, the credit after the tax-liability and refundability
 * limits, not the gross `ctc` entitlement.
 */
const PROGRAMS: LineDefinition[] = [
  ['ctc_value', 'Child Tax Credit', 'tax_units'],
  ['eitc', 'Earned Income Tax Credit', 'tax_units'],
  ['cdcc', 'Child and Dependent Care Credit', 'tax_units'],
  ['state_ctc', 'State child tax credit', 'tax_units'],
  ['state_eitc', 'State earned income tax credit', 'tax_units'],
  ['state_cdcc', 'State child care credit', 'tax_units'],
  ['aca_ptc', 'Premium Tax Credit', 'tax_units'],
  ['snap', 'SNAP', 'spm_units'],
  ['tanf', 'TANF', 'spm_units'],
  ['ssi', 'SSI', 'people'],
  ['wic', 'WIC', 'people'],
  ['medicaid', 'Medicaid', 'people'],
  ['chip', 'CHIP', 'people'],
].map(([variable, label, entity]) => ({
  id: variable,
  label,
  sign: 1 as const,
  sources: [{ entity: entity as EntityPlural, variable }],
}));

export interface HouseholdLineChange {
  id: string;
  label: string;
  /** Null for "Other", which is only a difference. */
  baseline: number | null;
  reform: number | null;
  /** Reform less baseline. */
  change: number;
  /** What the change does to net income: a tax cut is a gain. */
  effect: number;
}

export interface FlagshipHouseholdImpact {
  netIncome: { baseline: number; reform: number; change: number };
  /** The changed parts of net income, with any remainder as "Other". */
  components: HouseholdLineChange[];
  /** The changed credits and benefits. */
  programs: HouseholdLineChange[];
}

function lineChange(
  definition: LineDefinition,
  baseline: HouseholdCalculationData,
  reform: HouseholdCalculationData,
  year: string
): HouseholdLineChange | null {
  let baselineTotal = 0;
  let reformTotal = 0;
  let found = false;
  for (const { entity, variable } of definition.sources) {
    const before = readHouseholdTotal(baseline, entity, variable, year);
    const after = readHouseholdTotal(reform, entity, variable, year);
    if (before !== null || after !== null) {
      found = true;
      baselineTotal += before ?? 0;
      reformTotal += after ?? 0;
    }
  }
  if (!found) {
    return null;
  }
  const change = reformTotal - baselineTotal;
  return {
    id: definition.id,
    label: definition.label,
    baseline: baselineTotal,
    reform: reformTotal,
    change,
    effect: definition.sign * change,
  };
}

const changed = (line: HouseholdLineChange | null): line is HouseholdLineChange =>
  !!line && Math.abs(line.change) >= NEGLIGIBLE;

/**
 * What the reform changes for the household: net income, and the parts
 * that move it. A result without net income is a failed calculation, not
 * a household the reform leaves alone.
 */
export function compareHouseholds(
  baseline: HouseholdCalculationData,
  reform: HouseholdCalculationData,
  year: string
): FlagshipHouseholdImpact {
  const before = readHouseholdTotal(baseline, 'households', 'household_net_income', year);
  const after = readHouseholdTotal(reform, 'households', 'household_net_income', year);
  if (before === null || after === null) {
    throw new Error(`The result has no net income for ${year}.`);
  }
  const netChange = after - before;
  const components = COMPONENTS.map((definition) =>
    lineChange(definition, baseline, reform, year)
  ).filter(changed);
  const remainder = netChange - components.reduce((sum, line) => sum + line.effect, 0);
  if (Math.abs(remainder) >= NEGLIGIBLE) {
    components.push({
      id: 'other',
      label: 'Other',
      baseline: null,
      reform: null,
      change: remainder,
      effect: remainder,
    });
  }
  return {
    netIncome: { baseline: before, reform: after, change: netChange },
    components,
    programs: PROGRAMS.map((definition) => lineChange(definition, baseline, reform, year)).filter(
      changed
    ),
  };
}

export interface RunFlagshipHouseholdArgs {
  year: string;
  input: FlagshipHouseholdInput;
  baselinePolicyId: string;
  reformPolicyId: string;
}

export interface FlagshipHouseholdRun extends FlagshipHouseholdImpact {
  householdId: string;
  /**
   * The calculated household under each policy, as the API returns it:
   * what the v2 household breakdowns read.
   */
  baseline: HouseholdCalculationData;
  reform: HouseholdCalculationData;
}

/**
 * The household API's timeout and network failures in plain words; any
 * other failure keeps the API's own message. The shared helpers' timeout
 * message names a time that is not their real limit, and a browser's
 * network failure reads only "Failed to fetch" or "Load failed".
 */
export function plainHouseholdError(error: unknown): Error {
  if (error instanceof TypeError) {
    return new Error('Could not reach PolicyEngine. Check your connection.', { cause: error });
  }
  if (error instanceof Error && /timed out/i.test(error.message)) {
    return new Error('The calculation took too long.', { cause: error });
  }
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * One policy's calculation, asked once more after the client's timeout:
 * the API keeps calculating and caches the result, so the second ask
 * usually returns it at once.
 */
async function calculateOnce(householdId: string, policyId: string) {
  try {
    return await fetchHouseholdCalculation('us', householdId, policyId);
  } catch (error) {
    if (error instanceof Error && /timed out/i.test(error.message)) {
      return fetchHouseholdCalculation('us', householdId, policyId);
    }
    throw error;
  }
}

/** Creates the household and calculates it under each policy, at once. */
async function calculateHousehold(
  payload: V1HouseholdCreateEnvelope,
  baselinePolicyId: string,
  reformPolicyId: string
) {
  try {
    const created = await createHousehold(payload);
    const householdId = String(created.result.household_id);
    const [baseline, reform] = await Promise.all([
      calculateOnce(householdId, baselinePolicyId),
      baselinePolicyId === reformPolicyId ? null : calculateOnce(householdId, reformPolicyId),
    ]);
    return { householdId, baseline, reform: reform ?? baseline };
  } catch (error) {
    throw plainHouseholdError(error);
  }
}

/**
 * Creates the household (the API dedupes identical ones) and calculates
 * it under the baseline and the reform at once.
 */
export async function runFlagshipHousehold({
  year,
  input,
  baselinePolicyId,
  reformPolicyId,
}: RunFlagshipHouseholdArgs): Promise<FlagshipHouseholdRun> {
  return runFlagshipHouseholdPayload({
    year,
    payload: buildHouseholdPayload(input, year),
    baselinePolicyId,
    reformPolicyId,
  });
}

/**
 * The same run for a household built in full (the household builder's
 * own model, any of its inputs), sent as the builder sends it.
 */
export async function runFlagshipHouseholdPayload({
  year,
  payload,
  baselinePolicyId,
  reformPolicyId,
}: {
  year: string;
  payload: V1HouseholdCreateEnvelope;
  baselinePolicyId: string;
  reformPolicyId: string;
}): Promise<FlagshipHouseholdRun> {
  const { householdId, baseline, reform } = await calculateHousehold(
    payload,
    baselinePolicyId,
    reformPolicyId
  );
  return { householdId, baseline, reform, ...compareHouseholds(baseline, reform, year) };
}

/** "Single · 2 children · $50,000 · California": the household a result is for. */
export function describeHouseholdInput(input: FlagshipHouseholdInput): string {
  const money = (value: number) => formatCurrency(value, 'us', { maximumFractionDigits: 0 });
  const children = input.childAges.length;
  return [
    input.married ? 'Married' : 'Single',
    children === 0 ? 'no children' : children === 1 ? '1 child' : `${children} children`,
    input.married
      ? `${money(input.earnings)} and ${money(input.partnerEarnings)} earnings`
      : `${money(input.earnings)} earnings`,
    STATE_NAMES[input.state] ?? input.state,
  ].join(' · ');
}
