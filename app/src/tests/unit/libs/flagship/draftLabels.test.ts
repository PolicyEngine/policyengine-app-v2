import { describe, expect, test } from 'vitest';
import { FOREVER } from '@/constants';
import {
  describeChange,
  periodLabel,
  provisionName,
  summarizeIntervals,
} from '@/libs/flagship/draftLabels';

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
    ).toBe('Amount · Single');
  });

  test('given a bracket field then it names the schedule and the bracket', () => {
    expect(
      provisionName({
        path: 'gov.irs.credits.eitc.max[1].amount',
        breadcrumb: 'IRS → Credits → EITC maximum → Bracket 2 → Amount',
      })
    ).toBe('EITC maximum · Bracket 2 amount');
  });
});

describe('periodLabel', () => {
  test('given whole years then it says them as years', () => {
    expect(periodLabel({ startDate: '2027-01-01', endDate: FOREVER })).toBe('from 2027');
    expect(periodLabel({ startDate: '2026-01-01', endDate: '2026-12-31' })).toBe('2026 only');
    expect(periodLabel({ startDate: '2027-01-01', endDate: '2029-12-31' })).toBe('2027–2029');
  });

  test('given dates inside a year then it says the dates', () => {
    expect(periodLabel({ startDate: '2026-07-01', endDate: FOREVER })).toBe('from Jul 1, 2026');
    expect(periodLabel({ startDate: '2026-07-01', endDate: '2027-06-30' })).toBe(
      'Jul 1, 2026 – Jun 30, 2027'
    );
  });
});

describe('summarizeIntervals', () => {
  const dollars = (value: unknown) => `$${value}`;

  test('given one change then its value and period', () => {
    expect(
      summarizeIntervals([{ startDate: '2026-01-01', endDate: '2026-12-31', value: 2500 }], dollars)
    ).toEqual({ value: '$2500', when: '2026 only' });
  });

  test('given a schedule then its first and last values and its steps', () => {
    expect(
      summarizeIntervals(
        [
          { startDate: '2026-01-01', endDate: '2026-12-31', value: 1800 },
          { startDate: '2027-01-01', endDate: FOREVER, value: 2000 },
        ],
        dollars
      )
    ).toEqual({ value: '$1800 → $2000', when: '2 periods from 2026' });
  });
});
