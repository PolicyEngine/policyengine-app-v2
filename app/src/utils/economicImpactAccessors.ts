/**
 * Accessor functions for extracting data from v2 EconomicImpactResponse.
 *
 * The v2 API returns flat arrays (budget rows, poverty rows, decile rows, etc.)
 * rather than the v1 nested object shape. These helpers provide typed, null-safe
 * access to the data that chart components need.
 */

import type {
  DecileImpactData,
  EconomicImpactResponse,
  IntraDecileData,
  PovertyData,
} from '@/api/v2/economyAnalysis';

// ============================================================================
// Budget
// ============================================================================

/** Derived budget values from per-variable BudgetSummaryData rows */
export interface DerivedBudget {
  taxRevenueImpact: number;
  benefitSpendingImpact: number;
  budgetaryImpact: number;
  stateTaxRevenueImpact: number;
  households: number;
  baselineNetIncome: number;
}

/**
 * Derive v1-style budget aggregate from per-variable budget_summary rows.
 * See budget_summary.py docstring for the mapping.
 */
export function getDerivedBudget(r: EconomicImpactResponse): DerivedBudget {
  const rows = r.budget_summary ?? [];
  const findChange = (varName: string) =>
    rows.find((b) => b.variable_name === varName)?.change ?? 0;
  const findBaseline = (varName: string) =>
    rows.find((b) => b.variable_name === varName)?.baseline_total ?? 0;

  const taxRevenueImpact = findChange('household_tax');
  const benefitSpendingImpact = findChange('household_benefits');
  const stateTaxRevenueImpact = findChange('household_state_income_tax');

  return {
    taxRevenueImpact,
    benefitSpendingImpact,
    budgetaryImpact: taxRevenueImpact - benefitSpendingImpact,
    stateTaxRevenueImpact,
    households: findBaseline('household_count_people'),
    baselineNetIncome: findBaseline('household_net_income'),
  };
}

// ============================================================================
// Inequality
// ============================================================================

/** Paired baseline/reform inequality values */
export interface DerivedInequality {
  gini: { baseline: number; reform: number };
  top10PctShare: { baseline: number; reform: number };
  top1PctShare: { baseline: number; reform: number };
}

/**
 * Pair baseline and reform inequality rows into a single object.
 * The API stores one InequalityData row per simulation.
 */
export function getDerivedInequality(r: EconomicImpactResponse): DerivedInequality | null {
  const rows = r.inequality ?? [];
  if (rows.length < 2) {
    return null;
  }

  const baselineSimId = r.baseline_simulation.id;
  const baseline = rows.find((i) => i.simulation_id === baselineSimId);
  const reform = rows.find((i) => i.simulation_id !== baselineSimId);

  if (!baseline || !reform) {
    return null;
  }

  return {
    gini: { baseline: baseline.gini ?? 0, reform: reform.gini ?? 0 },
    top10PctShare: {
      baseline: baseline.top_10_share ?? 0,
      reform: reform.top_10_share ?? 0,
    },
    top1PctShare: {
      baseline: baseline.top_1_share ?? 0,
      reform: reform.top_1_share ?? 0,
    },
  };
}

// ============================================================================
// Decile impacts
// ============================================================================

/** Get income decile impacts sorted by decile (1-10) */
export function getDecileImpacts(r: EconomicImpactResponse): DecileImpactData[] {
  return (r.decile_impacts ?? []).slice().sort((a, b) => a.decile - b.decile);
}

/** Get wealth decile impacts sorted by decile (1-10) */
export function getWealthDecileImpacts(r: EconomicImpactResponse): DecileImpactData[] {
  return (r.wealth_decile ?? []).slice().sort((a, b) => a.decile - b.decile);
}

// ============================================================================
// Intra-decile (winners/losers)
// ============================================================================

/** Display labels for intra-decile categories, in chart order */
export const INTRA_DECILE_CATEGORIES = [
  'Gain more than 5%',
  'Gain less than 5%',
  'No change',
  'Lose less than 5%',
  'Lose more than 5%',
] as const;

type IntraDecileField =
  | 'gain_more_than_5pct'
  | 'gain_less_than_5pct'
  | 'no_change'
  | 'lose_less_than_5pct'
  | 'lose_more_than_5pct';

/** Map display labels to IntraDecileData field names */
export const INTRA_DECILE_FIELD_MAP: Record<string, IntraDecileField> = {
  'Gain more than 5%': 'gain_more_than_5pct',
  'Gain less than 5%': 'gain_less_than_5pct',
  'No change': 'no_change',
  'Lose less than 5%': 'lose_less_than_5pct',
  'Lose more than 5%': 'lose_more_than_5pct',
};

/** Get value from an IntraDecileData row by category label */
export function getIntraDecileValue(item: IntraDecileData | null, category: string): number {
  if (!item) {
    return 0;
  }
  const field = INTRA_DECILE_FIELD_MAP[category];
  if (!field) {
    return 0;
  }
  return (item[field] as number) ?? 0;
}

/** Get the "all" row (decile=0) from intra_decile data */
export function getIntraDecileAll(r: EconomicImpactResponse): IntraDecileData | null {
  return r.intra_decile?.find((d) => d.decile === 0) ?? null;
}

/** Get per-decile rows (decile 1-10) sorted */
export function getIntraDecileByDecile(r: EconomicImpactResponse): IntraDecileData[] {
  return (r.intra_decile ?? []).filter((d) => d.decile > 0).sort((a, b) => a.decile - b.decile);
}

/** Get the "all" row from intra_wealth_decile data */
export function getIntraWealthDecileAll(r: EconomicImpactResponse): IntraDecileData | null {
  return r.intra_wealth_decile?.find((d) => d.decile === 0) ?? null;
}

/** Get per-decile rows from intra_wealth_decile sorted */
export function getIntraWealthDecileByDecile(r: EconomicImpactResponse): IntraDecileData[] {
  return (r.intra_wealth_decile ?? [])
    .filter((d) => d.decile > 0)
    .sort((a, b) => a.decile - b.decile);
}

// ============================================================================
// Poverty
// ============================================================================

/** A paired baseline/reform poverty measurement */
export interface PovertyPair {
  baseline: PovertyData | null;
  reform: PovertyData | null;
}

/**
 * Find a matched baseline/reform poverty pair by poverty_type and filter_variable.
 * The API stores one row per simulation; we match using simulation IDs from the response.
 *
 * @param povertyType - e.g. "spm" (US), "absolute_bhc" (UK), "spm_deep" (US deep)
 * @param filterVariable - null for overall, "child"/"adult"/"senior" for age,
 *   "male"/"female" for gender, "white"/"black"/"hispanic"/"other" for race
 */
export function findPovertyPair(
  r: EconomicImpactResponse,
  povertyType: string,
  filterVariable: string | null
): PovertyPair {
  const rows = r.poverty ?? [];
  const baselineSimId = r.baseline_simulation.id;

  const matching = rows.filter(
    (p) => p.poverty_type === povertyType && p.filter_variable === filterVariable
  );

  return {
    baseline: matching.find((p) => p.simulation_id === baselineSimId) ?? null,
    reform: matching.find((p) => p.simulation_id !== baselineSimId) ?? null,
  };
}

/** Get rate from a PovertyPair as { baseline, reform } numbers */
export function getPovertyRates(pair: PovertyPair): { baseline: number; reform: number } {
  return {
    baseline: pair.baseline?.rate ?? 0,
    reform: pair.reform?.rate ?? 0,
  };
}

/**
 * Poverty pairs by age group for the given poverty type.
 * @param povertyType - e.g. "spm" (US) or "absolute_bhc" (UK)
 */
export function getPovertyByAge(r: EconomicImpactResponse, povertyType: string) {
  return {
    all: findPovertyPair(r, povertyType, null),
    child: findPovertyPair(r, povertyType, 'child'),
    adult: findPovertyPair(r, povertyType, 'adult'),
    senior: findPovertyPair(r, povertyType, 'senior'),
  };
}

/**
 * Poverty pairs by gender for the given poverty type.
 * @param povertyType - e.g. "spm" (US) or "absolute_bhc" (UK)
 */
export function getPovertyByGender(r: EconomicImpactResponse, povertyType: string) {
  return {
    male: findPovertyPair(r, povertyType, 'male'),
    female: findPovertyPair(r, povertyType, 'female'),
  };
}

/** Get the default poverty type for regular poverty by country */
export function getDefaultPovertyType(countryId: string): string {
  return countryId === 'uk' ? 'absolute_bhc' : 'spm';
}

/** Get the default poverty type for deep poverty by country */
export function getDefaultDeepPovertyType(countryId: string): string {
  return countryId === 'uk' ? 'absolute_bhc_deep' : 'spm_deep';
}

/** Known age and gender filter_variable values (used to identify race filters) */
const KNOWN_NON_RACE_FILTERS = new Set(['child', 'adult', 'senior', 'male', 'female']);

/**
 * Get race-specific poverty pairs for the given poverty type.
 * Discovers race filter_variable values dynamically from the data.
 * @param povertyType - e.g. "spm" (US)
 */
export function getPovertyByRace(r: EconomicImpactResponse, povertyType: string) {
  const rows = r.poverty ?? [];

  const raceFilters = new Set<string>();
  for (const row of rows) {
    if (
      row.poverty_type === povertyType &&
      row.filter_variable !== null &&
      !KNOWN_NON_RACE_FILTERS.has(row.filter_variable)
    ) {
      raceFilters.add(row.filter_variable);
    }
  }

  return Array.from(raceFilters).map((race) => ({
    race,
    pair: findPovertyPair(r, povertyType, race),
  }));
}
