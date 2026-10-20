import { describe, expect, test } from 'vitest';
import {
  claimPeriod,
  claimValue,
  matchScorecardClaims,
} from '@/libs/flagship/scorecardComparisons';
import { CTC_PATH, scorecardClaim } from '@/tests/fixtures/libs/flagship/scorecardComparisonMocks';

describe('scorecard comparison matching', () => {
  test('given missing variable mappings then recorded paths and the same policy in another year still match', () => {
    const rows = [
      scorecardClaim(),
      scorecardClaim({ claim_id: 'ctc-2027', period: 2027, latest: null }),
    ];
    expect(
      matchScorecardClaims(rows, 'us', [CTC_PATH], []).rows.map((row) => row.matchBasis)
    ).toEqual(['parameter', 'related-policy']);
  });
  test('given a shared baseline key then unrelated baseline claims and foreign claims do not leak into the results', () => {
    const rows = [
      scorecardClaim({ reform_framework: 'baseline', reform_key: 'baseline' }),
      scorecardClaim({
        claim_id: 'other',
        reform_framework: 'baseline',
        reform_key: 'baseline',
        latest: null,
      }),
      scorecardClaim({ claim_id: 'uk', country: 'UK' }),
    ];
    expect(
      matchScorecardClaims(rows, 'us', [CTC_PATH], []).rows.map((row) => row.claim_id)
    ).toEqual(['ctc-2026']);
  });
  test('given only a similar title or parameter substring then no match is invented', () => {
    const rows = [
      scorecardClaim({ latest: null }),
      scorecardClaim({
        claim_id: 'other',
        latest: { value: 1, status: 'constructed', construction: `${CTC_PATH}_other: -> 1000` },
      }),
    ];
    // Distinct paths outside the same indexed scale must not match.
    expect(
      matchScorecardClaims(rows, 'us', ['gov.irs.credits.ctc.refundable.phase_in.threshold'], [])
        .rows
    ).toEqual([]);
  });
  test('given an explicit variable then match without depending on an Urban program row', () => {
    const row = scorecardClaim({
      latest: { value: 10, status: 'comparable', policyengine_variables: ['ca_eitc'] },
    });
    expect(matchScorecardClaims([row], 'us', [], ['ca_eitc']).rows[0].matchBasis).toBe('variable');
  });
  test('given the same omnibus bill key then an unrelated line item is excluded', () => {
    const rows = [
      scorecardClaim(),
      scorecardClaim({ claim_id: 'tips', name: 'No tax on tips', latest: null }),
    ];
    expect(
      matchScorecardClaims(rows, 'us', [CTC_PATH], []).rows.map((row) => row.claim_id)
    ).toEqual(['ctc-2026']);
  });
  test('given different unit and period types then preserve signs and periods without making counts into dollars', () => {
    expect(claimValue(-12_400_000_000, 'usd')).toBe('-$12.4B');
    expect(claimValue(17_700_000, 'tax_units')).toBe('17.7M');
    expect(claimValue(null, 'usd')).toBe('Not computed');
    expect(claimPeriod(scorecardClaim())).toBe('2026 · fiscal year');
    expect(
      claimPeriod(scorecardClaim({ period_start: 2025, period_end: 2034, time_basis: 'total' }))
    ).toBe('2025–2034 · total');
  });
  test('given a whole number of billions or millions then money shows no trailing zero on any runtime', () => {
    // Without an explicit minimum, Node 20 and 22 render "£1.0B" and later versions "£1B".
    expect(claimValue(1_000_000_000, 'gbp')).toBe('£1B');
    expect(claimValue(2_000_000_000, 'gbp')).toBe('£2B');
    expect(claimValue(500_000_000, 'usd')).toBe('$500M');
    expect(claimValue(-1_130_000_000, 'gbp')).toBe('-£1.1B');
  });
});
