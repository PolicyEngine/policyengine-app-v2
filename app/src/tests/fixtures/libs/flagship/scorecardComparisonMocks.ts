import type { ScorecardClaim } from '@/libs/flagship/scorecardComparisons';

export const CTC_PATH = 'gov.irs.credits.ctc.amount.base[0].amount';
export const scorecardClaim = (overrides: Partial<ScorecardClaim> = {}): ScorecardClaim => ({
  claim_id: 'ctc-2026',
  country: 'US',
  source: 'jct',
  name: 'CTC extension',
  metric: 'revenue_change',
  unit_concept: 'usd',
  period: 2026,
  time_basis: 'fiscal_year',
  reform_framework: 'policy_ref',
  reform_key: 'ctc-extension',
  external_value: -48_769_000_000,
  latest: {
    value: -91_169_531_318,
    status: 'constructed',
    engine_version: '1.764.6',
    construction: `${CTC_PATH}: -> 1000`,
    annotations: ['PE CY2026 vs JCT FY2026', 'Different stacking baseline'],
    policyengine_variables: [],
  },
  ...overrides,
});

export const jctCtcClaim = scorecardClaim({
  source_column: '4. Extension and enhancement of increased child tax credit [1]',
  conditions: { bill_version: 'JCX-35-25' },
  latest: {
    value: -91_169_531_318,
    status: 'constructed',
    baseline: 'current_law',
    construction: 'scored as expiry reversal from enacted law; negated',
    annotations: ['PE CY2026 vs JCT FY2026'],
  },
});
export const stackedJctCtcClaim = {
  ...jctCtcClaim,
  period: 2027,
  latest: {
    ...jctCtcClaim.latest!,
    construction: 'reform_delta:income_tax:jcx_stacked:chain_pos04:cy2026_for_fy2027',
    baseline: 'obbba_stack_below__jcx_producer__obbba_child_tax_credit',
    annotations: [],
  },
};

export const utahBaselineClaim = scorecardClaim({
  source: 'ut_admin',
  source_column: 'state_ut_ctc',
  reform_framework: 'baseline',
  name: 'Utah Child Tax Credit',
  metric: 'benefit_cost',
});
