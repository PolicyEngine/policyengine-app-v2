import { describe, expect, test } from 'vitest';
import { CURRENT_YEAR, FOREVER } from '@/constants';
import { provisionsForYear } from '@/libs/draftReform';
import { provisionPeriods } from '@/libs/flagship/runReport';

const CTC_BASE = {
  path: 'gov.irs.credits.ctc.amount.base[0].amount',
  breadcrumb: 'IRS → Credits → Child tax credit → Amount → Bracket 1 → Amount',
  unit: 'currency-USD',
  baselineValue: 2200,
  value: 3000,
};

/** Current law for the CTC base amount: $2,000 before 2026, $2,200 from then. */
const ctcCurrentLaw = (_path: string, year: number) => (year < 2026 ? 2000 : 2200);

describe('provisionPeriods', () => {
  test('given a single value then the API gets it from the current year on', () => {
    expect(provisionPeriods({ value: 3000 })).toEqual({
      [`${CURRENT_YEAR}-01-01.${FOREVER}`]: 3000,
    });
  });

  test('given dated changes then each becomes its own period', () => {
    expect(
      provisionPeriods({
        value: 3000,
        intervals: [
          { startDate: '2026-01-01', endDate: '2026-12-31', value: 3000 },
          { startDate: '2027-01-01', endDate: FOREVER, value: 3600 },
        ],
      })
    ).toEqual({ '2026-01-01.2026-12-31': 3000, [`2027-01-01.${FOREVER}`]: 3600 });
  });

  test('given a single value and a report year before it starts then the policy still sets that value', () => {
    // A 2024 report (or a budget window from 2024) only changes the year described.
    const [described] = provisionsForYear([CTC_BASE], 2024, ctcCurrentLaw);

    expect(provisionPeriods(described)).toEqual({
      [`${CURRENT_YEAR}-01-01.${FOREVER}`]: 3000,
    });
  });

  test('given a single value described in a year before it starts then that year reads current law', () => {
    const [described] = provisionsForYear([CTC_BASE], 2024, ctcCurrentLaw);

    expect([described.baselineValue, described.value]).toEqual([2000, 2000]);
  });
});
