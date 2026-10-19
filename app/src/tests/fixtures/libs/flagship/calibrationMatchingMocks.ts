import type { CalibrationMatches, CalibrationTargetRow } from '@/libs/flagship/calibrationMatching';

export const POPULACE_RELEASE_ID =
  'populace-us-2024-buildp-sparse-rmloss100-cae8640-20260728T011454Z';

const soiRow = (
  name: string,
  variable: string,
  policyengineVariables: string[],
  relativeError: number,
  geography: string = 'US'
): CalibrationTargetRow => ({
  name,
  source: 'irs_soi',
  sourceLabel: 'IRS Statistics of Income',
  variable,
  policyengineVariables,
  measure: 'total',
  // The dashboard's measure id is the id's last segment: "…actc_amount@2024" → "actc_amount".
  sourceMeasureId: name.split('.').pop()!.split('@')[0],
  breakdown: 'All · All',
  level: geography === 'US' ? 'national' : 'state',
  geography,
  period: 2024,
  target: 1_000_000,
  estimate: 1_000_000 * (1 + relativeError),
  relativeError,
  targetRole: 'soi_fiscal_distribution',
  sourceUrl: null,
});

/** National SOI targets for the refundable CTC (two rows) and the CTC (one row). */
export const mockCalibrationRows: CalibrationTargetRow[] = [
  soiRow(
    'irs_soi.ty2023.table_1_4.all.actc_amount@2024',
    'refundable ctc',
    ['refundable_ctc'],
    0.02
  ),
  soiRow(
    'irs_soi.ty2023.table_1_4.all.actc_returns@2024',
    'refundable ctc',
    ['refundable_ctc'],
    -0.06
  ),
  soiRow(
    'irs_soi.ty2023.table_1_4.all.ctc_amount@2024',
    'ctc',
    ['ctc', 'ctc_limiting_tax_liability'],
    0.3
  ),
];

/** A national EITC target, which an EITC reform changes directly. */
export const mockEitcCalibrationRow: CalibrationTargetRow = {
  ...soiRow(
    'irs_soi.ty2023.table_2_5.eitc_by_agi_children.no_qualifying_children.18k_to_19k.eitc_returns@2024',
    'eitc',
    ['eitc'],
    0.08
  ),
  breakdown: '18k to 19k · no qualifying children · All',
};

/** A group named for a raw model variable, as the CTC targets reach a CDCC reform. */
export const mockCtcLimitingMatch = {
  variable: 'ctc_limiting_tax_liability',
  depth: 5,
  via: 'non_refundable_credits',
  ring: 'downstream' as const,
  targets: [mockCalibrationRows[2]],
  targetCount: 1,
  meanAbsRelativeError: 0.3,
  worst: mockCalibrationRows[2],
};

export const mockCalibrationMatches: CalibrationMatches = {
  releaseId: POPULACE_RELEASE_ID,
  geography: 'US',
  modelVersion: '1.808.0',
  reachedCount: 12,
  matches: [
    {
      variable: 'refundable_ctc',
      depth: 3,
      via: 'ctc_maximum',
      ring: 'mechanism',
      targets: [mockCalibrationRows[1], mockCalibrationRows[0]],
      targetCount: 2,
      meanAbsRelativeError: 0.04,
      worst: mockCalibrationRows[1],
    },
    {
      variable: 'ctc',
      depth: 3,
      via: 'ctc_maximum',
      ring: 'mechanism',
      targets: [mockCalibrationRows[2]],
      targetCount: 1,
      meanAbsRelativeError: 0.3,
      worst: mockCalibrationRows[2],
    },
  ],
};

/** Report 4592: DC's CTC amount, $1,000 → $4,000, in a DC report. */
export const DC_CTC_AMOUNT_PATH = 'gov.states.dc.tax.income.credits.ctc.amount';
export const DC_REGION = 'state/dc';

/**
 * DC's income tax collections target as the dashboard serves it: no
 * model variable listed, its role naming the model's state_income_tax.
 */
export const rawDcIncomeTaxTarget = {
  name: 'census_stc.fy2023.individual_income_tax_collections.dc.t40.collections@2024',
  target: 3_048_229_000,
  final_estimate: 3_245_012_820,
  relative_error: 0.0646,
  state: 'DC',
  geography: 'DC',
  level: 'state',
  source: 'state_income_tax',
  source_label: 'State income tax',
  variable: 'collections',
  measure: 'total',
  target_role: 'state_income_tax',
  source_measure_id: 'collections',
  // The dashboard lists it since calibration-diagnostics#229.
  policyengine_variables: ['state_income_tax'],
  breakdown: 't40',
  period: 2024,
  source_url: null,
};

/** A DC age-band population target: no model variable, and a role that is not one. */
export const rawDcPopulationTarget = {
  name: 'census_pep.v2024.cy2024.state_resident_population.11.35_to_39.population@2024',
  target: 70_000,
  final_estimate: 70_070,
  relative_error: 0.001,
  state: 'DC',
  level: 'state',
  source: 'census_population',
  source_label: 'Census population',
  variable: 'population',
  measure: 'count',
  target_role: 'population_age',
  source_measure_id: 'population',
  policyengine_variables: [],
  breakdown: '35 to 39',
  period: 2024,
};

/** DC's income tax collections target, normalized. */
export const mockDcIncomeTaxRow: CalibrationTargetRow = {
  name: rawDcIncomeTaxTarget.name,
  source: 'state_income_tax',
  sourceLabel: 'State income tax',
  variable: 'collections',
  policyengineVariables: ['state_income_tax'],
  measure: 'total',
  sourceMeasureId: 'collections',
  breakdown: 't40',
  level: 'state',
  geography: 'DC',
  period: 2024,
  target: 3_048_229_000,
  estimate: 3_245_012_820,
  relativeError: 0.0646,
  targetRole: 'state_income_tax',
  sourceUrl: null,
};

/** DC's federal CTC target, which a DC CTC change only echoes into. */
export const mockDcFederalCtcRow: CalibrationTargetRow = soiRow(
  'irs_soi.ty2022.historic_table_2.state_broad.dc.all.ctc_amount@2024',
  'ctc',
  ['ctc', 'ctc_limiting_tax_liability'],
  -0.23,
  'DC'
);

const dcRow = (
  name: string,
  variable: string,
  policyengineVariables: string[],
  relativeError: number,
  target: number,
  extra: Partial<CalibrationTargetRow> = {}
): CalibrationTargetRow => ({
  ...soiRow(name, variable, policyengineVariables, relativeError, 'DC'),
  target,
  estimate: target * (1 + relativeError),
  ...extra,
});

/**
 * Every DC target the state summary reads, worst first: two miss badly,
 * three fit within 10%. Rental income misses 97-fold on a small total.
 */
export const mockDcFitRows: CalibrationTargetRow[] = [
  dcRow(
    'irs_soi.ty2022.historic_table_2.state_broad.dc.all.rental_royalty_income_amount@2024',
    'rental royalty income',
    ['rental_income', 'farm_rent_income'],
    97.385,
    9_000_000
  ),
  dcRow(
    'hhs_acf_tanf.fy2024.dc.all_funds.basic_assistance@2024',
    'tanf',
    ['tanf'],
    -0.793,
    45_000_000,
    {
      source: 'hhs_acf_tanf',
      sourceLabel: 'HHS · TANF',
      sourceMeasureId: 'all_funds',
      breakdown: 'basic assistance',
    }
  ),
  mockDcIncomeTaxRow,
  dcRow(
    'irs_soi.ty2022.historic_table_2.state_broad.dc.all.return_count@2024',
    'return count',
    [],
    -0.02,
    350_000,
    {
      sourceMeasureId: 'return_count',
      targetRole: 'soi_fiscal_distribution',
    }
  ),
  dcRow(
    'census_pep.v2024.cy2024.state_resident_population.11.35_to_39.population@2024',
    'population',
    [],
    0.001,
    70_000,
    {
      source: 'census_population',
      sourceLabel: 'Census population',
      sourceMeasureId: 'population',
      breakdown: '35 to 39',
      targetRole: 'population_age',
    }
  ),
];
