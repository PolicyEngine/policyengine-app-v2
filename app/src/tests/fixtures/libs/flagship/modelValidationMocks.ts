import type { ModelValidationRow } from '@/libs/flagship/modelValidation';

const urbanRow = (
  program: string,
  metric: string,
  policyengineVariables: string[],
  externalValue: number,
  peValue: number,
  heldOut: boolean = true
): ModelValidationRow => ({
  source: 'urban-sotsn',
  sourceName: 'Urban Institute — State of the Safety Net 2025',
  sourceUrl: 'https://apps.urban.org/features/state-safety-net/',
  program,
  metric,
  period: '2023 average month',
  status: 'comparable',
  unitConcept: 'persons',
  externalValue,
  peValue,
  ratio: peValue / externalValue,
  heldOut,
  policyengineVariables,
});

/**
 * The scorecard rows the route serves for the variables a CTC or EITC
 * reform reaches in the mock dependency map: the refundable CTC, the
 * EITC, and SNAP (which neither reform reaches).
 */
export const mockScorecardRows: ModelValidationRow[] = [
  urbanRow('ctc_refund', 'eligible_count', ['refundable_ctc'], 40_000_000, 38_000_000),
  urbanRow('ctc_refund', 'eligibility_rate', ['refundable_ctc'], 0.12, 0.114, false),
  urbanRow('eitc', 'eligible_count', ['eitc', 'eitc_child_count'], 30_000_000, 31_500_000),
  urbanRow('snap', 'eligible_count', ['snap', 'is_snap_eligible'], 69_128_000, 66_363_627),
];

/** Rows the route would return for an EITC reform: EITC and the refundable CTC it echoes into. */
export const mockEitcScorecardRows = mockScorecardRows.filter((row) => row.program !== 'snap');
