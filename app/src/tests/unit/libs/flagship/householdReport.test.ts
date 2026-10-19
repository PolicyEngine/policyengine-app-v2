import { describe, expect, test } from 'vitest';
import { householdAmountInputs } from '@/libs/flagship/householdReport';
import { HOUSEHOLD_WITH_TIPS } from '@/tests/fixtures/libs/flagship/householdReportMocks';

describe('householdAmountInputs', () => {
  test('given a household with tip income then its amounts are listed, but not the earnings the chart varies', () => {
    expect(householdAmountInputs(HOUSEHOLD_WITH_TIPS)).toEqual(['tip_income']);
  });
});
