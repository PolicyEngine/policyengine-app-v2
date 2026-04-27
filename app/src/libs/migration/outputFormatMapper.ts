import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import type {
  BudgetSummaryData,
  DecileImpactData,
  EconomicImpactResponse,
  IntraDecileData,
} from '@/api/v2/economyAnalysis';
import type { HouseholdImpactResponse } from '@/api/v2/householdAnalysis';
import type { HouseholdReportOutput } from '@/types/calculation/household';

type MetricPair = { baseline: number; reform: number };
type IntraDecileCategory =
  | 'Gain less than 5%'
  | 'Gain more than 5%'
  | 'Lose less than 5%'
  | 'Lose more than 5%'
  | 'No change';

const INTRA_DECILE_FIELDS = {
  'Gain less than 5%': 'gain_less_than_5pct',
  'Gain more than 5%': 'gain_more_than_5pct',
  'Lose less than 5%': 'lose_less_than_5pct',
  'Lose more than 5%': 'lose_more_than_5pct',
  'No change': 'no_change',
} as const satisfies Record<IntraDecileCategory, keyof IntraDecileData>;

export interface OutputFormatMapperMetadata {
  modelVersion?: string;
  policyEngineVersion?: string | null;
  dataVersion?: string;
  dataset?: string | null;
}

export interface ComparableBudgetSummary {
  variable_name: string;
  baseline_total: number | null;
  reform_total: number | null;
  change: number | null;
}

export interface ComparableDecileImpact {
  decile: number;
  absolute_change: number | null;
  relative_change: number | null;
}

export interface ComparablePovertyImpact {
  poverty_type: string;
  entity: string;
  filter_variable: string | null;
  baseline_rate: number;
  reform_rate: number;
}

export interface ComparableInequalityImpact {
  metric: 'gini' | 'top_10_share' | 'top_1_share';
  baseline: number;
  reform: number;
}

export interface ComparableIntraDecileImpact {
  decile: number;
  gain_more_than_5pct: number | null;
  gain_less_than_5pct: number | null;
  no_change: number | null;
  lose_less_than_5pct: number | null;
  lose_more_than_5pct: number | null;
}

export interface ComparableEconomyOutput {
  budget_summary: ComparableBudgetSummary[];
  decile_impacts: ComparableDecileImpact[];
  poverty: ComparablePovertyImpact[];
  inequality: ComparableInequalityImpact[];
  intra_decile: ComparableIntraDecileImpact[];
  detailed_budget: Record<string, unknown> | null;
}

export interface ComparableHouseholdOutput {
  baseline_result: Record<string, unknown> | null;
  reform_result: Record<string, unknown> | null;
}

function numberOrZero(value: number | null | undefined): number {
  return typeof value === 'number' ? value : 0;
}

function lower(value: string | null | undefined): string {
  return (value ?? '').toLowerCase();
}

function emptyMetricPair(): MetricPair {
  return { baseline: 0, reform: 0 };
}

function emptyAgePovertyBlock(): Record<'adult' | 'all' | 'child' | 'senior', MetricPair> {
  return {
    adult: emptyMetricPair(),
    all: emptyMetricPair(),
    child: emptyMetricPair(),
    senior: emptyMetricPair(),
  };
}

function emptyGenderPovertyBlock(): Record<'female' | 'male', MetricPair> {
  return {
    female: emptyMetricPair(),
    male: emptyMetricPair(),
  };
}

function emptyRacePovertyBlock(): Record<'black' | 'hispanic' | 'other' | 'white', MetricPair> {
  return {
    black: emptyMetricPair(),
    hispanic: emptyMetricPair(),
    other: emptyMetricPair(),
    white: emptyMetricPair(),
  };
}

function emptyIntraDecile() {
  const emptyAll = {
    'Gain less than 5%': 0,
    'Gain more than 5%': 0,
    'Lose less than 5%': 0,
    'Lose more than 5%': 0,
    'No change': 0,
  };

  return {
    all: { ...emptyAll },
    deciles: {
      'Gain less than 5%': [] as number[],
      'Gain more than 5%': [] as number[],
      'Lose less than 5%': [] as number[],
      'Lose more than 5%': [] as number[],
      'No change': [] as number[],
    },
  };
}

function emptyLaborSupplyResponse() {
  return {
    decile: {
      average: { income: {}, substitution: {} },
      relative: { income: {}, substitution: {} },
    },
    hours: {
      baseline: 0,
      change: 0,
      income_effect: 0,
      reform: 0,
      substitution_effect: 0,
    },
    income_lsr: 0,
    relative_lsr: { income: 0, substitution: 0 },
    revenue_change: 0,
    substitution_lsr: 0,
    total_change: 0,
  };
}

function mapDecileRows(rows: DecileImpactData[] | null) {
  const average: Record<string, number> = {};
  const relative: Record<string, number> = {};

  (rows ?? [])
    .slice()
    .sort((a, b) => a.decile - b.decile)
    .forEach((row) => {
      const key = String(row.decile);
      average[key] = numberOrZero(row.absolute_change);
      relative[key] = numberOrZero(row.relative_change);
    });

  return { average, relative };
}

function mapIntraDecileRows(rows: IntraDecileData[] | null) {
  const output = emptyIntraDecile();
  const sortedRows = (rows ?? []).slice().sort((a, b) => a.decile - b.decile);

  Object.entries(INTRA_DECILE_FIELDS).forEach(([label, field]) => {
    const category = label as IntraDecileCategory;
    const values = sortedRows.map((row) => numberOrZero(row[field] as number | null));
    output.deciles[category] = values;
    output.all[category] =
      values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  });

  return output;
}

function getBudgetRow(
  rows: BudgetSummaryData[] | null,
  predicate: (variableName: string) => boolean
): BudgetSummaryData | undefined {
  return (rows ?? []).find((row) => predicate(lower(row.variable_name)));
}

function sumBudgetChanges(
  rows: BudgetSummaryData[] | null,
  predicate: (variableName: string) => boolean
): number {
  return (rows ?? [])
    .filter((row) => predicate(lower(row.variable_name)))
    .reduce((sum, row) => sum + numberOrZero(row.change), 0);
}

function mapBudget(response: EconomicImpactResponse) {
  const rows = response.budget_summary;
  const netIncomeRow = getBudgetRow(rows, (name) => name.includes('net_income'));
  const budgetaryImpactRow = getBudgetRow(rows, (name) => name.includes('budgetary_impact'));

  const taxRevenueImpact = sumBudgetChanges(
    rows,
    (name) => name.includes('tax') && !name.includes('state') && !name.includes('local')
  );
  const stateTaxRevenueImpact = sumBudgetChanges(
    rows,
    (name) => name.includes('tax') && (name.includes('state') || name.includes('local'))
  );
  const benefitSpendingImpact = sumBudgetChanges(
    rows,
    (name) => name.includes('benefit') || name.includes('spending') || name.includes('transfer')
  );
  const budgetaryImpact =
    budgetaryImpactRow?.change ?? taxRevenueImpact + stateTaxRevenueImpact - benefitSpendingImpact;

  const households = Math.max(
    0,
    ...(response.poverty ?? []).map((row) => numberOrZero(row.total_population))
  );

  return {
    baseline_net_income: numberOrZero(netIncomeRow?.baseline_total),
    benefit_spending_impact: benefitSpendingImpact,
    budgetary_impact: budgetaryImpact,
    households,
    state_tax_revenue_impact: stateTaxRevenueImpact,
    tax_revenue_impact: taxRevenueImpact + stateTaxRevenueImpact,
  };
}

function resultSide(
  simulationId: string,
  baselineSimulationId: string,
  reformSimulationId: string
): 'baseline' | 'reform' | null {
  if (simulationId === baselineSimulationId) {
    return 'baseline';
  }
  if (simulationId === reformSimulationId) {
    return 'reform';
  }
  return null;
}

function mapPoverty(response: EconomicImpactResponse) {
  const poverty = {
    deep_poverty: emptyAgePovertyBlock(),
    poverty: emptyAgePovertyBlock(),
  };
  const povertyByGender = {
    deep_poverty: emptyGenderPovertyBlock(),
    poverty: emptyGenderPovertyBlock(),
  };
  const povertyByRace = {
    poverty: emptyRacePovertyBlock(),
  };

  const baselineSimulationId = response.baseline_simulation.id;
  const reformSimulationId = response.reform_simulation.id;

  (response.poverty ?? []).forEach((row) => {
    const side = resultSide(row.simulation_id, baselineSimulationId, reformSimulationId);
    if (!side) {
      return;
    }

    const povertyType = lower(row.poverty_type).includes('deep') ? 'deep_poverty' : 'poverty';
    const entity = lower(row.entity);
    const filter = lower(row.filter_variable);
    const value = numberOrZero(row.rate);

    if (entity === 'all' || entity === 'adult' || entity === 'child' || entity === 'senior') {
      poverty[povertyType][entity][side] = value;
      return;
    }

    const demographic = filter || entity;
    if (demographic === 'female' || demographic === 'male') {
      povertyByGender[povertyType][demographic][side] = value;
      return;
    }

    if (
      povertyType === 'poverty' &&
      (demographic === 'black' ||
        demographic === 'hispanic' ||
        demographic === 'other' ||
        demographic === 'white')
    ) {
      povertyByRace.poverty[demographic][side] = value;
    }
  });

  return { poverty, povertyByGender, povertyByRace };
}

function mapInequality(response: EconomicImpactResponse) {
  const baselineSimulationId = response.baseline_simulation.id;
  const reformSimulationId = response.reform_simulation.id;

  const baseline = response.inequality?.find((row) => row.simulation_id === baselineSimulationId);
  const reform = response.inequality?.find((row) => row.simulation_id === reformSimulationId);

  return {
    gini: {
      baseline: numberOrZero(baseline?.gini),
      reform: numberOrZero(reform?.gini),
    },
    top_10_pct_share: {
      baseline: numberOrZero(baseline?.top_10_share),
      reform: numberOrZero(reform?.top_10_share),
    },
    top_1_pct_share: {
      baseline: numberOrZero(baseline?.top_1_share),
      reform: numberOrZero(reform?.top_1_share),
    },
  };
}

function normalizeDetailedBudget(
  detailedBudget: Record<string, Record<string, number | null>> | null
): Record<string, unknown> {
  if (!detailedBudget) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(detailedBudget).map(([variableName, value]) => {
      const baseline = numberOrZero(value.baseline ?? value.baseline_total);
      const reform = numberOrZero(value.reform ?? value.reform_total);
      const difference = numberOrZero(value.difference ?? value.change ?? reform - baseline);

      return [variableName, { baseline, difference, reform }];
    })
  );
}

function mapCongressionalDistrictImpact(response: EconomicImpactResponse) {
  if (!response.congressional_district_impact) {
    return null;
  }

  return {
    districts: response.congressional_district_impact.map((row) => ({
      district: `${String(row.state_fips).padStart(2, '0')}-${String(row.district_number).padStart(
        2,
        '0'
      )}`,
      average_household_income_change: numberOrZero(row.average_household_income_change),
      relative_household_income_change: numberOrZero(row.relative_household_income_change),
    })),
  };
}

function mapConstituencyImpact(response: EconomicImpactResponse) {
  if (!response.constituency_impact) {
    return null;
  }

  return {
    by_constituency: Object.fromEntries(
      response.constituency_impact.map((row) => [
        row.constituency_name,
        {
          average_household_income_change: numberOrZero(row.average_household_income_change),
          relative_household_income_change: numberOrZero(row.relative_household_income_change),
          x: row.x,
          y: row.y,
        },
      ])
    ),
    outcomes_by_region: {},
  };
}

function mapLocalAuthorityImpact(response: EconomicImpactResponse) {
  if (!response.local_authority_impact) {
    return undefined;
  }

  return {
    by_local_authority: Object.fromEntries(
      response.local_authority_impact.map((row) => [
        row.local_authority_name,
        {
          average_household_income_change: numberOrZero(row.average_household_income_change),
          relative_household_income_change: numberOrZero(row.relative_household_income_change),
          x: row.x,
          y: row.y,
        },
      ])
    ),
  };
}

export function mapV2EconomicImpactToLegacyOutput(
  response: EconomicImpactResponse,
  metadata: OutputFormatMapperMetadata = {}
): SocietyWideReportOutput {
  const { poverty, povertyByGender, povertyByRace } = mapPoverty(response);
  const wealthDecile = response.wealth_decile ? mapDecileRows(response.wealth_decile) : null;

  return {
    budget: mapBudget(response),
    cliff_impact: null,
    congressional_district_impact: mapCongressionalDistrictImpact(response),
    constituency_impact: mapConstituencyImpact(response),
    data_version: metadata.dataVersion ?? '',
    dataset: metadata.dataset ?? null,
    decile: mapDecileRows(response.decile_impacts),
    detailed_budget: normalizeDetailedBudget(response.detailed_budget),
    inequality: mapInequality(response),
    intra_decile: mapIntraDecileRows(response.intra_decile),
    intra_wealth_decile: response.intra_wealth_decile
      ? mapIntraDecileRows(response.intra_wealth_decile)
      : null,
    labor_supply_response: emptyLaborSupplyResponse(),
    local_authority_impact: mapLocalAuthorityImpact(response),
    model_version: metadata.modelVersion ?? '',
    policyengine_version: metadata.policyEngineVersion ?? null,
    poverty,
    poverty_by_gender: povertyByGender,
    poverty_by_race: povertyByRace,
    wealth_decile: wealthDecile,
  } as SocietyWideReportOutput;
}

export function mapV2HouseholdImpactToLegacyOutput(
  response: HouseholdImpactResponse
): HouseholdReportOutput | null {
  const output: HouseholdReportOutput = {};

  if (response.baseline_simulation && response.baseline_result) {
    output[response.baseline_simulation.id] = response.baseline_result as any;
  }

  if (response.reform_simulation && response.reform_result) {
    output[response.reform_simulation.id] = response.reform_result as any;
  }

  return Object.keys(output).length > 0 ? output : null;
}

function comparableBudgetFromLegacyOutput(
  output: SocietyWideReportOutput
): ComparableBudgetSummary[] {
  const budget = output.budget;

  return [
    {
      variable_name: 'household_net_income',
      baseline_total: budget.baseline_net_income,
      reform_total: null,
      change: null,
    },
    {
      variable_name: 'tax_revenue',
      baseline_total: null,
      reform_total: null,
      change: budget.tax_revenue_impact,
    },
    {
      variable_name: 'state_tax_revenue',
      baseline_total: null,
      reform_total: null,
      change: budget.state_tax_revenue_impact,
    },
    {
      variable_name: 'benefit_spending',
      baseline_total: null,
      reform_total: null,
      change: budget.benefit_spending_impact,
    },
    {
      variable_name: 'budgetary_impact',
      baseline_total: null,
      reform_total: null,
      change: budget.budgetary_impact,
    },
  ];
}

function comparableDecilesFromLegacyOutput(
  output: SocietyWideReportOutput
): ComparableDecileImpact[] {
  return Object.keys(output.decile.average)
    .sort((a, b) => Number(a) - Number(b))
    .map((decile) => ({
      decile: Number(decile),
      absolute_change: output.decile.average[decile] ?? null,
      relative_change: output.decile.relative[decile] ?? null,
    }));
}

function comparablePovertyFromLegacyOutput(
  output: SocietyWideReportOutput
): ComparablePovertyImpact[] {
  const rows: ComparablePovertyImpact[] = [];

  Object.entries(output.poverty).forEach(([povertyType, entities]) => {
    Object.entries(entities).forEach(([entity, pair]) => {
      rows.push({
        poverty_type: povertyType,
        entity,
        filter_variable: null,
        baseline_rate: pair.baseline,
        reform_rate: pair.reform,
      });
    });
  });

  return rows;
}

function comparableInequalityFromLegacyOutput(
  output: SocietyWideReportOutput
): ComparableInequalityImpact[] {
  return [
    {
      metric: 'gini',
      baseline: output.inequality.gini.baseline,
      reform: output.inequality.gini.reform,
    },
    {
      metric: 'top_10_share',
      baseline: output.inequality.top_10_pct_share.baseline,
      reform: output.inequality.top_10_pct_share.reform,
    },
    {
      metric: 'top_1_share',
      baseline: output.inequality.top_1_pct_share.baseline,
      reform: output.inequality.top_1_pct_share.reform,
    },
  ];
}

function comparableIntraDecileFromLegacyOutput(
  output: SocietyWideReportOutput
): ComparableIntraDecileImpact[] {
  const decileCount = Math.max(
    ...Object.values(output.intra_decile.deciles).map((values) => values.length),
    0
  );

  return Array.from({ length: decileCount }, (_, index) => ({
    decile: index + 1,
    gain_more_than_5pct: output.intra_decile.deciles['Gain more than 5%'][index] ?? null,
    gain_less_than_5pct: output.intra_decile.deciles['Gain less than 5%'][index] ?? null,
    no_change: output.intra_decile.deciles['No change'][index] ?? null,
    lose_less_than_5pct: output.intra_decile.deciles['Lose less than 5%'][index] ?? null,
    lose_more_than_5pct: output.intra_decile.deciles['Lose more than 5%'][index] ?? null,
  }));
}

export function mapLegacyEconomyOutputToV2ComparableOutput(
  output: SocietyWideReportOutput
): ComparableEconomyOutput {
  return {
    budget_summary: comparableBudgetFromLegacyOutput(output),
    decile_impacts: comparableDecilesFromLegacyOutput(output),
    poverty: comparablePovertyFromLegacyOutput(output),
    inequality: comparableInequalityFromLegacyOutput(output),
    intra_decile: comparableIntraDecileFromLegacyOutput(output),
    detailed_budget: output.detailed_budget ?? null,
  };
}

export function mapLegacyHouseholdOutputToV2ComparableOutput(
  output: HouseholdReportOutput,
  baselineSimulationId: string,
  reformSimulationId?: string | null
): ComparableHouseholdOutput {
  return {
    baseline_result:
      (output[baselineSimulationId] as unknown as Record<string, unknown> | undefined) ?? null,
    reform_result: reformSimulationId
      ? ((output[reformSimulationId] as unknown as Record<string, unknown> | undefined) ?? null)
      : null,
  };
}

export function mapV2EconomicImpactToComparableOutput(
  response: EconomicImpactResponse
): ComparableEconomyOutput {
  return mapLegacyEconomyOutputToV2ComparableOutput(mapV2EconomicImpactToLegacyOutput(response));
}

export function mapV2HouseholdImpactToComparableOutput(
  response: HouseholdImpactResponse
): ComparableHouseholdOutput {
  return {
    baseline_result: response.baseline_result,
    reform_result: response.reform_result,
  };
}
