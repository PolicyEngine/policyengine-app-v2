import { describe, expect, test } from 'vitest';
import { CURRENT_YEAR, FOREVER } from '@/constants';
import { provisionPeriods } from '@/libs/flagship/runReport';

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
});
