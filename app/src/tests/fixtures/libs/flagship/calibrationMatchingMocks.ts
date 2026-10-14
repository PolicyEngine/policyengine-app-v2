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
