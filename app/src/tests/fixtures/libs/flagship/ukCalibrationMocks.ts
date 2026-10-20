import type { CalibrationMatches, CalibrationTargetRow } from '@/libs/flagship/calibrationMatching';

/** The UK release the dashboard served when these fixtures were taken. */
export const UK_RELEASE_ID = 'microcosm-uk-2024-25-national-20261019T083323Z-6cba5d71';

/** Report 4684's change: the basic rate of Income Tax, in a Wales report. */
export const UK_BASIC_RATE_PATH = 'gov.hmrc.income_tax.rates.uk[0].rate';
export const WALES_REGION = 'country/wales';

/** Report 4686's changes: the Carer's Allowance earnings limit and the relief age. */
export const UK_CARERS_EARNINGS_LIMIT_PATH = 'gov.dwp.carers_allowance.earnings_limit';
export const UK_RELIEF_AGE_PATH = 'gov.hmrc.pensions.pension_contributions_relief_age_limit';

/** A UK parameter no calibration programme covers. */
export const UK_ELASTICITY_PATH = 'gov.simulation.capital_gains_responses.elasticity';

/** A UK target as the dashboard serves it (the fields the app reads). */
type RawUkTarget = { name: string } & Record<string, unknown>;

const rawUkTarget = (fields: RawUkTarget): RawUkTarget => ({
  target: 1_000_000,
  final_estimate: 1_010_000,
  relative_error: 0.01,
  level: 'country',
  measure: null,
  policyengine_variables: [],
  source_measure_id: null,
  target_role: null,
  source_url: null,
  period: 2025,
  ...fields,
});

/** Income Tax liabilities in Wales, one SPI regional band. */
export const rawWalesIncomeTaxTarget = rawUkTarget({
  name: 'hmrc.spi_region.income_tax_by_region_50000_70000@W92000004@2025',
  source: 'hmrc',
  source_label: 'HM Revenue and Customs',
  variable: 'hmrc.survey_of_personal_incomes',
  variable_label: 'Survey of Personal Incomes',
  target_label: 'Income Tax liabilities by region, total income 50,000 to 70,000',
  breakdown:
    'Wales, all taxpayers, total income from GBP 50 000 to GBP 70 000 · All · 50000 · 70000',
  geography: 'Wales',
  target: 1_200_000_000,
  final_estimate: 1_140_000_000,
  relative_error: -0.05,
});

/** The income in Wales the tax falls on: context, not the tax. */
export const rawWalesTotalIncomeTarget = rawUkTarget({
  name: 'hmrc.spi_region.total_income_by_region_50000_70000@W92000004@2025',
  source: 'hmrc',
  source_label: 'HM Revenue and Customs',
  variable: 'hmrc.survey_of_personal_incomes',
  variable_label: 'Survey of Personal Incomes',
  target_label: 'Total income by region, total income 50,000 to 70,000',
  breakdown: 'Wales, all taxpayers · All · 50000 · 70000',
  geography: 'Wales',
});

/** UK Income Tax liabilities, one ITL band, whose label names the table and not the band. */
export const rawUkItlTarget = rawUkTarget({
  name: 'hmrc.itl.income_tax_by_total_income_band.band_200000_500000@2025',
  source: 'hmrc',
  source_label: 'HM Revenue and Customs',
  variable: 'hmrc.income_tax_liabilities_statistics',
  variable_label: 'Income Tax liabilities statistics',
  target_label: 'Income Tax liabilities by total income band',
  breakdown: 'Total income from GBP 200 000 to GBP 500 000 · 200000 · 500000',
  geography: 'United Kingdom',
  target: 40_000_000_000,
  final_estimate: 40_800_000_000,
  relative_error: 0.02,
});

/** Higher-rate taxpayers in Scotland: another nation's Income Tax target. */
export const rawScotlandHigherRateTarget = rawUkTarget({
  name: 'hmrc.itl.higher_rate_taxpayers@S92000003@2025',
  source: 'hmrc',
  source_label: 'HM Revenue and Customs',
  variable: 'hmrc.income_tax_liabilities_statistics',
  variable_label: 'Income Tax liabilities statistics',
  target_label: 'Higher rate Income Tax payers by region and nation',
  breakdown: 'Higher rate',
  measure: 'count',
  geography: 'Scotland',
  relative_error: 0.2,
});

/** Carer's Allowance spending, OBR, Great Britain. */
export const rawGbCarersAllowanceTarget = rawUkTarget({
  name: 'obr.carers_allowance@2025',
  source: 'obr',
  source_label: 'Office for Budget Responsibility',
  variable: 'obr.efo_expenditure',
  variable_label: 'Economic and fiscal outlook expenditure',
  target_label: 'Carers allowance',
  breakdown: 'Carers allowance',
  geography: 'Great Britain',
  target: 4_300_000_000,
  final_estimate: 4_257_000_000,
  relative_error: -0.01,
});

/** People in an English region: measures no programme. */
export const rawLondonPopulationTarget = rawUkTarget({
  name: 'ons.population.london_age_30_34@2025',
  source: 'ons',
  source_label: 'Office for National Statistics',
  variable: 'ons.population',
  variable_label: 'Population',
  target_label: 'Population, London',
  measure: 'count',
  level: 'region',
  geography: 'London',
});

const ukRow = (
  raw: Record<string, unknown>,
  fields: Partial<CalibrationTargetRow>
): CalibrationTargetRow => ({
  name: raw.name as string,
  source: raw.source as string,
  sourceLabel: raw.source_label as string,
  variable: raw.variable as string,
  policyengineVariables: [],
  measure: 'total',
  sourceMeasureId: null,
  breakdown: raw.breakdown as string,
  level: 'country',
  geography: raw.geography as string,
  period: 2025,
  target: raw.target as number,
  estimate: raw.final_estimate as number,
  relativeError: raw.relative_error as number,
  targetRole: null,
  sourceUrl: null,
  targetLabel: raw.target_label as string,
  variableLabel: (raw.variable_label as string | undefined) ?? null,
  currency: 'GBP',
  ...fields,
});

export const mockWalesIncomeTaxRow = ukRow(rawWalesIncomeTaxTarget, {
  policyengineVariables: ['income_tax'],
});
export const mockUkItlRow = ukRow(rawUkItlTarget, { policyengineVariables: ['income_tax'] });
/** Context in a nation's overall fit: it measures no programme. */
export const mockWalesTotalIncomeRow = ukRow(rawWalesTotalIncomeTarget, { relativeError: 0.03 });
export const mockScotlandHigherRateRow = ukRow(rawScotlandHigherRateTarget, {
  policyengineVariables: ['income_tax'],
  measure: 'count',
  currency: undefined,
});
export const mockGbCarersAllowanceRow = ukRow(rawGbCarersAllowanceTarget, {
  policyengineVariables: ['carers_allowance'],
});

/** The Wales report's Income Tax match, Wales first. */
export const mockWalesCalibrationMatches: CalibrationMatches = {
  releaseId: UK_RELEASE_ID,
  geography: 'Wales',
  modelVersion: '',
  reachedCount: 1,
  countryId: 'uk',
  geographies: ['Wales', 'England and Wales', 'Great Britain', 'United Kingdom'],
  matches: [
    {
      variable: 'income_tax',
      depth: 0,
      via: UK_BASIC_RATE_PATH,
      ring: 'primary',
      targets: [mockWalesIncomeTaxRow, mockUkItlRow],
      targetCount: 2,
      meanAbsRelativeError: 0.02,
      worst: mockWalesIncomeTaxRow,
    },
  ],
  related: [],
};
