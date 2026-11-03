import type { HouseholdCalculationOutput } from '@/types/calculation/household';
import type { MetadataState } from '@/types/metadata';
import { getParameterAtInstant, getValueFromHousehold } from '@/utils/householdValues';

/** One programme, tax or benefit whose amount the reform changes. */
export interface HouseholdProgrammeChange {
  variable: string;
  /** The country model's name for it, e.g. "Universal Credit". */
  label: string;
  /** Reform minus baseline, per year. */
  change: number;
  /** What it does to net income: a tax that rises lowers it. */
  effect: number;
}

/**
 * The parts of totals the country models sum in a formula, so their
 * metadata names none: the household's benefits, and the UK's taxes. A
 * list is read only when the parts that change make up the total's whole
 * change; a part missing here leaves the total itself listed.
 */
const FORMULA_PARTS: Record<string, Record<string, string[]>> = {
  uk: {
    household_benefits: [
      'universal_credit',
      'child_benefit',
      'pension_credit',
      'housing_benefit',
      'child_tax_credit',
      'working_tax_credit',
      'income_support',
      'esa_income',
      'esa_contrib',
      'jsa_income',
      'jsa_contrib',
      'state_pension',
      'pip',
      'dla',
      'attendance_allowance',
      'carers_allowance',
      'scottish_child_payment',
      'tax_free_childcare',
      'council_tax_reduction',
      'winter_fuel_allowance',
      'energy_bills_rebate',
      'maternity_allowance',
      'incapacity_benefit',
      'sda',
      'iidb',
      'afcs',
      'bsp',
    ],
    household_tax: ['income_tax', 'national_insurance', 'council_tax', 'vat', 'fuel_duty'],
  },
  us: {
    household_benefits: [
      'snap',
      'tanf',
      'ssi',
      'wic',
      'social_security',
      'unemployment_compensation',
      'free_school_meals',
      'reduced_price_school_meals',
      'lifeline',
      'acp',
      'head_start',
      'early_head_start',
    ],
  },
};

/** Changes under half a unit of currency round to nothing on screen. */
const EPSILON = 0.5;

/** "household benefits" → "Household benefits"; "Universal Credit" stays. */
function sentenceStart(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function total(name: string, household: HouseholdCalculationOutput, metadata: MetadataState) {
  const value = getValueFromHousehold(name, null, null, household, metadata);
  return typeof value === 'number' ? value : 0;
}

/** A variable's parts as the net income breakdown reads them: a list, or a parameter naming one. */
function parts(list: unknown, metadata: MetadataState, year: string): string[] {
  if (Array.isArray(list)) {
    return list;
  }
  if (typeof list === 'string') {
    const value = getParameterAtInstant(metadata.parameters[list], `${year}-01-01`);
    return Array.isArray(value) ? value : [];
  }
  return [];
}

/**
 * The programmes the reform changes for a household: net income's tree, as
 * the Net income breakdown shows it, followed down to the deepest lines
 * whose amount changes. A line is broken into its parts only when the parts
 * that change make up its whole change; otherwise the line itself is
 * listed, so the amounts always add up. Largest effect first.
 */
export function householdProgrammeChanges(
  baseline: HouseholdCalculationOutput,
  reform: HouseholdCalculationOutput,
  metadata: MetadataState,
  year: string
): HouseholdProgrammeChange[] {
  const formulaParts = FORMULA_PARTS[baseline.countryId] ?? {};
  const changes: HouseholdProgrammeChange[] = [];
  const seen = new Set<string>();

  const walk = (name: string, sign: 1 | -1) => {
    const variable = metadata.variables[name];
    if (!variable || seen.has(name)) {
      return;
    }
    seen.add(name);
    const change = total(name, reform, metadata) - total(name, baseline, metadata);
    const adds = parts(variable.adds, metadata, year);
    const subtracts = parts(variable.subtracts, metadata, year);
    const children = [
      ...(adds.length + subtracts.length > 0 ? adds : (formulaParts[name] ?? [])).map((child) => ({
        child,
        sign,
      })),
      ...subtracts.map((child) => ({
        child,
        sign: (sign === 1 ? -1 : 1) as 1 | -1,
      })),
    ]
      .filter(({ child }) => metadata.variables[child])
      .map(({ child, sign: childSign }) => ({
        child,
        childSign,
        effect: childSign * (total(child, reform, metadata) - total(child, baseline, metadata)),
      }))
      .filter(({ effect }) => Math.abs(effect) >= EPSILON);
    const explained = children.reduce((sum, { effect }) => sum + effect, 0);
    if (children.length > 0 && Math.abs(explained - sign * change) < 1) {
      children.forEach(({ child, childSign }) => walk(child, childSign));
    } else if (Math.abs(change) >= EPSILON) {
      changes.push({
        variable: name,
        label: sentenceStart(variable.label ?? name),
        change,
        effect: sign * change,
      });
    }
  };

  walk('household_net_income', 1);
  return changes.sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect));
}
