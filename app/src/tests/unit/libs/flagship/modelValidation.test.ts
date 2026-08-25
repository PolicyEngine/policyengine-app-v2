import { describe, expect, test } from 'vitest';
import {
  claimsFromBillValidation,
  scorecardProgramsFromPaths,
} from '@/libs/flagship/modelValidation';

describe('scorecardProgramsFromPaths', () => {
  test('given program-bearing paths then scorecard program ids return', () => {
    expect(
      scorecardProgramsFromPaths([
        'gov.usda.snap.max_allotment.main.CONTIGUOUS_US.4',
        'gov.irs.credits.ctc.amount.base[0].amount',
        'gov.irs.credits.eitc.max[0].amount',
      ])
    ).toEqual(['snap', 'ctc_refund', 'eitc']);
  });

  test('given state earned income credit paths then eitc matches', () => {
    expect(scorecardProgramsFromPaths(['gov.states.ca.cdss.earned_income.amount'])).toEqual([
      'eitc',
    ]);
  });

  test('given unrelated paths then no programs return', () => {
    expect(
      scorecardProgramsFromPaths(['gov.irs.income.bracket.rates.7', 'gov.irs.deductions.standard'])
    ).toEqual([]);
  });

  test('given duplicate program paths then each program appears once', () => {
    expect(scorecardProgramsFromPaths(['gov.usda.snap.a', 'gov.usda.snap.b'])).toEqual(['snap']);
  });
});

describe('claimsFromBillValidation', () => {
  test('given tracker validation then scorecard-shaped claims return', () => {
    const claims = claimsFromBillValidation('ga-hb1001', {
      fiscalNoteEstimate: -800_000_000,
      fiscalNoteUrl: 'https://opb.georgia.gov/note',
      peEstimate: -800_583_615,
      discrepancyExplanation: 'Baseline rate mismatch.',
      externalAnalyses: [{ source: 'GBPI', url: 'https://gbpi.org/x', estimate: -750_000_000 }],
    });

    expect(claims).toHaveLength(2);
    expect(claims[0]).toMatchObject({
      source: 'Official fiscal note',
      policy: 'ga-hb1001',
      metric: 'budgetary_impact',
      externalValue: -800_000_000,
      peValue: -800_583_615,
      notes: 'Baseline rate mismatch.',
    });
    expect(claims[0].ratio).toBeCloseTo(1.0007, 3);
    expect(claims[1].source).toBe('GBPI');
  });

  test('given no comparable estimates then no claims return', () => {
    expect(claimsFromBillValidation('x', { peEstimate: -5 })).toEqual([]);
  });
});
