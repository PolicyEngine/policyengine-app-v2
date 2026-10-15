import type { ReformScope } from '@/libs/flagship/comparisonRelevance';
import type { ParameterDependencyMap } from '@/libs/flagship/parameterDependencies';
import type { RelatedScorecardClaim } from '@/libs/flagship/scorecardComparisons';

/**
 * Report 4332: nationwide, 2026, one change — the CDCC's limit on
 * qualifying people (gov.irs.credits.cdcc.eligibility.max) from 2 to 4.
 * Its direct readers are the traced map's, so the state CDCCs that read
 * the federal limit are among them.
 */
export const CDCC_ELIGIBILITY_MAX_PATH = 'gov.irs.credits.cdcc.eligibility.max';
export const CDCC_DIRECT_READERS = [
  'ar_federal_cdcc',
  'ca_cdcc_relevant_expenses',
  'capped_count_cdcc_eligible',
  'md_dependent_care_subtraction',
  'sc_cdcc_potential',
];
export const CTC_BASE_PATH = 'gov.irs.credits.ctc.amount.base[0].amount';
export const CTC_DIRECT_READERS = [
  'co_federal_ctc_child_individual_maximum',
  'ctc_child_individual_maximum',
  'ctc_qualifying_child',
];
/** A CTC rule whose own name mentions the EITC. */
export const CTC_PHASE_IN_EITC_PATH =
  'gov.irs.credits.ctc.refundable.phase_in.min_children_for_ss_taxes_minus_eitc';
export const MD_EITC_MATCH_PATH =
  'gov.states.md.tax.income.credits.eitc.refundable.married_or_has_child.match';
export const EITC_MAX_PATH = 'gov.irs.credits.eitc.max[0].amount';
export const DC_SNAP_MINIMUM_PATH = 'gov.states.dc.dhs.snap.min_allotment.amount';
export const NYC_EITC_PATH = 'gov.local.ny.nyc.tax.income.credits.eitc.percent';
export const WA_WFTC_PATH =
  'gov.states.wa.tax.income.credits.working_families_tax_credit.max_amount';
export const STANDARD_DEDUCTION_PATH = 'gov.irs.deductions.standard.amount.SINGLE';
export const SNAP_DEDUCTION_PATH = 'gov.usda.snap.income.deductions.standard';
export const REFUNDABLE_CTC_MAX_PATH = 'gov.irs.credits.ctc.refundable.individual_max';
export const UT_CTC_AMOUNT_PATH = 'gov.states.ut.tax.income.credits.ctc.amount';
export const MEDICAID_CATEGORIES_PATH = 'gov.hhs.medicaid.eligibility.categories.covered';
export const MORTGAGE_CAP_PATH = 'gov.irs.deductions.itemized.interest.mortgage.cap';
export const ACA_CONTRIBUTION_PATH = 'gov.aca.required_contribution_percentage.final';
export const BRACKET_RATE_PATH = 'gov.irs.income.bracket.rates.1';

export const NATIONWIDE = 'us';
export const MARYLAND = 'state/md';
export const SOUTH_CAROLINA = 'state/sc';
export const UTAH = 'state/ut';
export const MARYLAND_DISTRICT = 'congressional_district/MD-05';

/** A US reform scope for these paths; readers default to none. */
export const usReform = (
  paths: string[],
  region: string,
  readers: Record<string, string[]> = {}
): ReformScope => ({ countryId: 'us', paths, readers, region });

export const REPORT_4332_REFORM = usReform([CDCC_ELIGIBILITY_MAX_PATH], NATIONWIDE, {
  [CDCC_ELIGIBILITY_MAX_PATH]: CDCC_DIRECT_READERS,
});

/** The traced map's slice for report 4332's path, for page-level tests. */
export const cdccDependencyMap: ParameterDependencyMap = {
  generatedAt: '2026-09-10T13:20:23+00:00',
  model: {
    package: 'policyengine-us',
    version: '1.824.8',
    coreVersion: '3.32.5',
    dataset: 'us_multi_year_2024_2035',
    households: 2000,
    year: 2026,
  },
  readers: { [CDCC_ELIGIBILITY_MAX_PATH]: CDCC_DIRECT_READERS },
  consumers: {},
};

const baselineClaim = (
  overrides: Partial<RelatedScorecardClaim> & Pick<RelatedScorecardClaim, 'claim_id' | 'name'>
): RelatedScorecardClaim => ({
  country: 'US',
  source: 'irs_soi',
  geography: 'US',
  metric: 'tax_credits_applied',
  unit_concept: 'usd',
  period: 2023,
  window: 'TY2023',
  time_basis: 'annual',
  reform_framework: 'baseline',
  reform_key: '03395a10966bb849',
  external_value: 0,
  claim_baseline: 'current_law',
  matchBasis: 'program',
  latest: {
    value: 0,
    status: 'constructed',
    engine_version: '2.2.1',
    data_bundle: 'populace-us-2024-spm-20260915',
    construction: 'level:cdcc',
    policyengine_variables: [],
    annotations: [],
    baseline: 'current_law',
  },
  ...overrides,
});

/** The six claims the scorecard matched for report 4332, as its feed records them. */
export const ACTC_CLAIM = baselineClaim({
  claim_id: 'dfc756e1df8119360e71',
  name: 'Additional child tax credit (refundable)',
  program: 'refundable_ctc',
  url: 'https://www.irs.gov/pub/irs-soi/23in33ar.xls',
  external_value: 34_533_251_000,
  latest: { value: 37_566_830_646, status: 'constructed', construction: 'level:refundable_ctc' },
});
export const TREASURY_CDCC_CLAIM = baselineClaim({
  claim_id: 'd5d06d635b1bba810311',
  source: 'treasury',
  name: 'Child & Dependent Care Credit',
  program: 'cdcc',
  metric: 'tax_expenditure',
  url: 'https://home.treasury.gov/policy-issues/tax-policy/tax-expenditures',
  period: 2024,
  window: 'FY2024',
  time_basis: 'fiscal_year',
  external_value: 3_690_000_000,
  latest: { value: 3_999_831_868, status: 'constructed', construction: 'repeal_delta:income_tax' },
});
export const SOI_CDCC_CLAIM = baselineClaim({
  claim_id: 'a30038fadf850d62d6f5',
  name: 'Child and dependent care credit',
  program: 'cdcc',
  url: 'https://www.irs.gov/pub/irs-soi/23in33ar.xls',
  external_value: 3_468_910_000,
  latest: { value: 4_348_964_473, status: 'constructed', construction: 'level:cdcc' },
});
export const MD_EITC_CLAIM = baselineClaim({
  claim_id: 'a0fc12d9e7bbddfdc301',
  source: 'md_admin',
  name: 'Maryland EITC (refundable + nonrefundable)',
  program: 'md_eitc',
  geography: 'MD',
  metric: 'benefit_cost',
  period: 2024,
  window: undefined,
  external_value: 550_881_492,
  latest: { value: 489_503_006, status: 'comparable', construction: 'level:md_eitc' },
});
export const SAVERS_CREDIT_CLAIM = baselineClaim({
  claim_id: '1dba5bf211130e2ed566',
  name: 'Retirement savings contribution (saver’s) credit',
  program: 'savers_credit',
  external_value: 2_000_000_000,
  latest: { value: 2_036_000_000, status: 'constructed', construction: 'level:savers_credit' },
});
export const SC_EITC_CLAIM = baselineClaim({
  claim_id: '4ed16ed1e0fce7e35aac',
  source: 'sc_admin',
  name: 'South Carolina EITC (125% nonrefundable)',
  program: 'sc_eitc',
  geography: 'SC',
  metric: 'benefit_cost',
  period: 2025,
  window: 'FY2024-25',
  time_basis: 'fiscal_year',
  external_value: 23_200_000,
  latest: { value: 14_700_000, status: 'constructed', construction: 'level:sc_eitc' },
});
export const REPORT_4332_CLAIMS = [
  ACTC_CLAIM,
  TREASURY_CDCC_CLAIM,
  SOI_CDCC_CLAIM,
  MD_EITC_CLAIM,
  SAVERS_CREDIT_CLAIM,
  SC_EITC_CLAIM,
];

/** Other claims the rules have to place. */
export const NONREFUNDABLE_CTC_CLAIM = baselineClaim({
  claim_id: 'soi-ctc-nonrefundable',
  name: 'Child tax credit + ODC (nonrefundable)',
  program: 'non_refundable_ctc',
});
export const JCT_CTC_CLAIM = baselineClaim({
  claim_id: 'jct-te-ctc',
  source: 'jct',
  name: 'Child Tax Credit (incl. ODC)',
  program: 'ctc',
  metric: 'tax_expenditure',
});
export const COLORADO_CTC_CLAIM = baselineClaim({
  claim_id: 'co-ctc',
  source: 'co_admin',
  name: 'Colorado Child Tax Credit',
  program: 'co_ctc',
  geography: 'CO',
});
export const SC_CDCC_CLAIM = baselineClaim({
  claim_id: 'sc-cdcc',
  source: 'sc_admin',
  name: 'South Carolina child and dependent care credit',
  program: 'sc_cdcc',
  geography: 'SC',
});
export const US_EITC_CLAIM = baselineClaim({
  claim_id: 'eitc-participation-us',
  source: 'irs_eitc_participation',
  name: 'EITC participation rate, United States',
  program: 'eitc',
  matchBasis: 'variable',
});
export const MARYLAND_FEDERAL_EITC_CLAIM = baselineClaim({
  claim_id: 'eitc-participation-md',
  source: 'irs_eitc_participation',
  name: 'EITC participation rate, Maryland',
  program: 'eitc',
  geography: 'MD',
  matchBasis: 'variable',
});
export const US_SNAP_CLAIM = baselineClaim({
  claim_id: 'snap-eligible-us',
  source: 'fns_snap_rates',
  name: 'People eligible for SNAP, United States',
  program: 'snap',
  matchBasis: 'variable',
});
export const DC_SNAP_CLAIM = baselineClaim({
  claim_id: 'snap-eligible-dc',
  source: 'fns_snap_rates',
  name: 'People eligible for SNAP, District of Columbia',
  program: 'snap',
  geography: 'DC',
  matchBasis: 'variable',
});
export const WA_WFTC_CLAIM = baselineClaim({
  claim_id: 'wa-wftc',
  source: 'wa_admin',
  name: 'Washington Working Families Tax Credit',
  program: 'wa_wftc',
  geography: 'WA',
});
/** A claim that records no program, linked only through a reached variable. */
export const UNNAMED_PROGRAM_CLAIM = baselineClaim({
  claim_id: 'census-spm-child-poverty',
  source: 'census',
  name: 'United States SPM child poverty rate',
  program: null,
  matchBasis: 'variable',
});
/** A UK claim whose receipt names the changed parameter. */
export const UK_PARAMETER_CLAIM = baselineClaim({
  claim_id: 'uk-uc-child-element',
  country: 'UK',
  source: 'dwp',
  name: 'Universal Credit child element',
  program: null,
  geography: 'UK',
  matchBasis: 'parameter',
});
