import { describe, expect, test } from 'vitest';
import { matchScorecardClaims, type ScorecardClaim } from '@/libs/flagship/scorecardComparisons';
import { ukScorecardPrograms } from '@/libs/flagship/ukScorecardPrograms';

const claim = (overrides: Partial<ScorecardClaim>): ScorecardClaim => ({
  claim_id: 'claim',
  country: 'uk',
  name: 'UK claim',
  source: 'cpag',
  metric: 'poverty_count_change',
  unit_concept: 'people',
  period: 2026,
  reform_framework: 'baseline',
  reform_key: 'baseline',
  external_value: 1,
  ...overrides,
});

describe('ukScorecardPrograms', () => {
  test('given parameter paths then it names the programmes whose folders hold them', () => {
    expect(
      ukScorecardPrograms([
        'gov.hmrc.national_insurance.class_1.thresholds.primary_threshold',
        'gov.hmrc.income_tax.rates.uk[1].threshold',
        'gov.dwp.benefit_cap.single.in_london',
      ])
    ).toEqual(['benefit_cap', 'income_tax', 'national_insurance']);
  });

  test('given a UC child element path then it names both UC and its child element', () => {
    expect(ukScorecardPrograms(['gov.dwp.universal_credit.elements.child.amount'])).toEqual([
      'universal_credit',
      'universal_credit_child_element',
    ]);
  });

  test('given a path outside every programme then it names none', () => {
    expect(ukScorecardPrograms(['gov.contrib.ubi_center.basic_income.amount'])).toEqual([]);
    // A folder that only shares a name prefix is a different programme.
    expect(ukScorecardPrograms(['gov.hmrc.income_tax_extra.amount'])).toEqual([]);
  });

  test('given the programmes then the matcher links the UK baseline claims for them', () => {
    const rows = [
      claim({ claim_id: 'cap', program: 'benefit_cap' }),
      claim({ claim_id: 'child', program: 'universal_credit_child_element' }),
      claim({ claim_id: 'other', program: 'council_tax' }),
    ];
    const paths = ['gov.dwp.benefit_cap.single.in_london'];

    const result = matchScorecardClaims(rows, 'uk', paths, ukScorecardPrograms(paths), {
      programBaselineOnly: true,
    });

    expect(result.rows.map((row) => [row.claim_id, row.matchBasis])).toEqual([['cap', 'program']]);
  });

  test('given programBaselineOnly then a policy claim needs a parameter match, not only its programme', () => {
    const policy = (claim_id: string, construction: string) =>
      claim({
        claim_id,
        name: claim_id,
        source: 'uk_hmrc',
        program: 'income_tax',
        reform_framework: 'policy_ref',
        reform_key: claim_id,
        latest: { value: 1, status: 'constructed', construction },
      });
    const rows = [
      policy('basic rate threshold', 'gov.hmrc.income_tax.rates.uk[1].threshold: 37700 -> 38077'),
      policy('dividend allowance', 'gov.hmrc.income_tax.allowances.dividend_allowance: 500 -> 600'),
      claim({ claim_id: 'it baseline', name: 'it baseline', program: 'income_tax' }),
    ];
    const paths = ['gov.hmrc.income_tax.rates.uk[0].rate'];

    const linked = (programBaselineOnly: boolean) =>
      matchScorecardClaims(rows, 'uk', paths, ukScorecardPrograms(paths), {
        programBaselineOnly,
      }).rows.map((row) => [row.claim_id, row.matchBasis]);

    expect(linked(true)).toEqual([
      ['basic rate threshold', 'parameter'],
      ['it baseline', 'program'],
    ]);
    // Without the option (the US behaviour), the programme links every policy claim.
    expect(linked(false)).toContainEqual(['dividend allowance', 'program']);
  });
});
