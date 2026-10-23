import { describe, expect, test } from 'vitest';
import { FOREVER } from '@/constants';
import {
  changeDateLabel,
  dayLabel,
  describeChange,
  periodLabel,
  provisionName,
  reportYearLabel,
  reportYearSpanLabel,
  summarizeIntervals,
  taxYearLabel,
} from '@/libs/flagship/draftLabels';

describe('changeDateLabel', () => {
  test('given a UK change from 1 January then it reads as the tax year it applies to', () => {
    expect(changeDateLabel('2027-01-01', 'uk')).toBe('2027-28');
    expect(changeDateLabel('2028-12-31', 'uk')).toBe('2028-29');
  });

  test('given a UK change on another day then it reads as that day', () => {
    expect(changeDateLabel('2027-04-06', 'uk')).toBe('6 Apr 2027');
  });

  test('given a US change then it reads as the day, as before', () => {
    expect(changeDateLabel('2027-01-01', 'us')).toBe('Jan 1, 2027');
  });

  test('given the tax year that starts in 1999 then the century rolls over', () => {
    expect(taxYearLabel(1999)).toBe('1999-00');
  });
});

describe('reportYearLabel', () => {
  test('given a UK report then its year reads as the fiscal year it starts', () => {
    expect(reportYearLabel('2027', 'uk')).toBe('2027-28');
    expect(reportYearSpanLabel('2026', '2030', 'uk')).toBe('2026-27 to 2030-31');
  });

  test('given a US report then its year reads as the calendar year, as before', () => {
    expect(reportYearLabel('2027', 'us')).toBe('2027');
    expect(reportYearSpanLabel('2026', '2030', 'us')).toBe('2026–2030');
  });
});

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

  test('given UK dates inside a year then it says them day first', () => {
    expect(periodLabel({ startDate: '2026-04-06', endDate: FOREVER }, 'uk')).toBe(
      'from 6 Apr 2026'
    );
    expect(periodLabel({ startDate: '2026-04-06', endDate: '2027-04-05' }, 'uk')).toBe(
      '6 Apr 2026 – 5 Apr 2027'
    );
    expect(periodLabel({ startDate: '2027-01-01', endDate: FOREVER }, 'uk')).toBe('from 2027');
  });
});

describe('dayLabel', () => {
  test('given a US date then month first; a UK date then day first', () => {
    expect(dayLabel('2026-01-01')).toBe('Jan 1, 2026');
    expect(dayLabel('2026-01-01', 'us')).toBe('Jan 1, 2026');
    expect(dayLabel('2026-01-01', 'uk')).toBe('1 Jan 2026');
    expect(dayLabel('2026-01-01', 'uk', { long: true })).toBe('1 January 2026');
    expect(dayLabel('2026-01-01', 'us', { long: true })).toBe('January 1, 2026');
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
