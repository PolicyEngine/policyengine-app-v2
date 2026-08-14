import { describe, expect, test } from 'vitest';
import { scorecardProgramsFromPaths } from '@/libs/flagship/modelValidation';

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
