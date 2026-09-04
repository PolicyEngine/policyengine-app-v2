import type { ParameterDependencyMap } from '@/libs/flagship/parameterDependencies';

/** Reform paths used across the dependency-map tests. */
export const CTC_BASE_AMOUNT_PATH = 'gov.irs.credits.ctc.amount.base[0].amount';
export const CTC_SECOND_BRACKET_PATH = 'gov.irs.credits.ctc.amount.base[1].amount';
export const CTC_AMOUNT_FOLDER_PATH = 'gov.irs.credits.ctc.amount';
export const CTC_FULLY_REFUNDABLE_PATH = 'gov.irs.credits.ctc.refundable.fully_refundable';
export const EITC_MAX_PATH = 'gov.irs.credits.eitc.max[0].amount';
export const SALT_CAP_PATH = 'gov.irs.deductions.itemized.salt_and_real_estate.cap';
export const SNAP_STANDARD_DEDUCTION_PATH = 'gov.usda.snap.income.deductions.standard';
export const SNAP_MAX_ALLOTMENT_PATH = 'gov.usda.snap.max_allotment.main.CONTIGUOUS_US.4';
export const UNTRACED_BRACKET_PATH = 'gov.irs.income.bracket.rates[3].rate';
export const STANDARD_DEDUCTION_PATH = 'gov.irs.deductions.standard';

/**
 * A hand-sized slice of the traced map: the CTC maximum chain down to
 * income tax, the EITC maximum echoing into the refundable CTC three hops
 * later, one SNAP deduction, and the SALT cap feeding taxable income.
 */
export const mockParameterDependencyMap: ParameterDependencyMap = {
  generatedAt: '2026-09-04T00:00:00+00:00',
  model: {
    package: 'policyengine-us',
    version: '1.808.0',
    coreVersion: '3.30.2',
    dataset: 'populace_us_2024',
    households: 2000,
    year: 2026,
  },
  readers: {
    'gov.irs.credits.ctc.amount.base': ['ctc_child_individual_maximum'],
    'gov.irs.credits.ctc.amount.adult_dependent': ['ctc_adult_individual_maximum'],
    [CTC_FULLY_REFUNDABLE_PATH]: ['refundable_ctc'],
    'gov.irs.credits.eitc.max': ['eitc_maximum'],
    [SALT_CAP_PATH]: ['salt_cap'],
    [SNAP_STANDARD_DEDUCTION_PATH]: ['snap_standard_deduction'],
  },
  consumers: {
    ctc_child_individual_maximum: ['ctc_individual_maximum'],
    ctc_adult_individual_maximum: ['ctc_individual_maximum'],
    ctc_individual_maximum: ['ctc_maximum'],
    ctc_maximum: ['ctc', 'refundable_ctc'],
    ctc: ['income_tax'],
    refundable_ctc: ['income_tax'],
    income_tax: ['household_net_income'],
    eitc_maximum: ['eitc'],
    eitc: ['income_tax_refundable_credits'],
    income_tax_refundable_credits: ['ctc_limiting_tax_liability'],
    ctc_limiting_tax_liability: ['refundable_ctc'],
    salt_cap: ['salt_deduction'],
    salt_deduction: ['taxable_income'],
    snap_standard_deduction: ['snap_deductions'],
  },
};
