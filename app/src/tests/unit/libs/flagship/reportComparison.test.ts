import { describe, expect, test } from 'vitest';
import { ranAgainstReform } from '@/libs/flagship/reportComparison';

/** The US current-law policy. */
const CURRENT_LAW_POLICY_ID = 2;

describe('ranAgainstReform', () => {
  test('given a baseline that ran current law then it was not compared with a reform', () => {
    expect(ranAgainstReform('2', CURRENT_LAW_POLICY_ID)).toBe(false);
  });

  test('given a baseline that ran another policy then it was compared with a reform', () => {
    expect(ranAgainstReform('88', CURRENT_LAW_POLICY_ID)).toBe(true);
  });

  test('given metadata still loading (current law reads 0) then it is unknown', () => {
    expect(ranAgainstReform('2', 0)).toBeUndefined();
    expect(ranAgainstReform('88', 0)).toBeUndefined();
  });

  test('given no baseline policy then it is unknown', () => {
    expect(ranAgainstReform(undefined, CURRENT_LAW_POLICY_ID)).toBeUndefined();
    expect(ranAgainstReform('', CURRENT_LAW_POLICY_ID)).toBeUndefined();
    expect(ranAgainstReform(null, CURRENT_LAW_POLICY_ID)).toBeUndefined();
  });
});
