import { describe, expect, test } from 'vitest';
import { describeChange, provisionName } from '@/libs/flagship/draftLabels';

describe('describeChange', () => {
  test('given numbers then the change reads current law to new value', () => {
    expect(describeChange(1700, 2500, (v) => `$${v}`)).toBe('$1700 → $2500');
  });

  test('given sets of variables then it says what is taken out and put in', () => {
    const label = (name: string) => ({ a_tax: 'A tax', c_tax: 'C tax' })[name] ?? name;

    expect(describeChange(['a_tax', 'b_tax'], ['b_tax', 'c_tax'], String, label)).toBe(
      'removes A tax; adds C tax'
    );
    expect(describeChange(['a_tax'], ['a_tax'], String)).toBe('no change');
  });
});

describe('provisionName', () => {
  test('given a breakdown member then it borrows its parent', () => {
    expect(
      provisionName({
        path: 'gov.irs.deductions.standard.amount.SINGLE',
        breadcrumb: 'IRS → Deductions → Standard → Amount → SINGLE',
      })
    ).toEqual({ name: 'Amount · Single', context: 'Deductions · Standard' });
  });

  test('given a bracket field then it names the schedule and the bracket', () => {
    expect(
      provisionName({
        path: 'gov.irs.credits.eitc.max[1].amount',
        breadcrumb: 'IRS → Credits → EITC maximum → Bracket 2 → Amount',
      }).name
    ).toBe('EITC maximum · Bracket 2 amount');
  });
});
