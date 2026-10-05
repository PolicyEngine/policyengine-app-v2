import { beforeEach, describe, expect, test } from 'vitest';
import { CURRENT_YEAR, FOREVER } from '@/constants';
import {
  clearDraftReform,
  draftToReform,
  draftYear,
  getDraftReform,
  isEditableValue,
  loadReformIntoDraft,
  provisionAdjusts,
  provisionChanged,
  provisionIntervals,
  provisionsForYear,
  provisionValueInYear,
  provisionVariesOverTime,
  setDraftProvisionIntervals,
  setDraftYear,
  startDraftReform,
  updateDraftProvisionValue,
} from '@/libs/draftReform';
import { Reform } from '@/types/ingredients/Reform';

const SINGLE = {
  path: 'gov.irs.deductions.standard.amount.SINGLE',
  breadcrumb: 'IRS → Deductions → Standard → SINGLE',
  unit: 'currency-USD',
  baselineValue: 16100,
  value: 16100,
};

describe('draft provisions over time', () => {
  beforeEach(() => {
    clearDraftReform();
  });

  test('given a single value then it applies from the current year on', () => {
    expect(provisionIntervals({ value: 18000 })).toEqual([
      { startDate: `${CURRENT_YEAR}-01-01`, endDate: FOREVER, value: 18000 },
    ]);
    expect(provisionVariesOverTime({})).toBe(false);
  });

  test('given dated changes then the value in a year is the one in effect, or null', () => {
    const provision = {
      value: 16100,
      intervals: [{ startDate: '2027-01-01', endDate: '2027-12-31', value: 17000 }],
    };

    expect(provisionValueInYear(provision, 2027)).toBe(17000);
    expect(provisionValueInYear(provision, 2026)).toBeNull();
    expect(provisionVariesOverTime(provision)).toBe(true);
  });

  test('given intervals for a parameter not in the draft then it is added with them', () => {
    startDraftReform('us', 'manual');
    const intervals = [{ startDate: '2026-01-01', endDate: FOREVER, value: 18000 }];

    setDraftProvisionIntervals('us', SINGLE, intervals);

    const [provision] = getDraftReform()!.provisions;
    expect(provision.intervals).toEqual(intervals);
    // The single-value mirror follows the draft's year.
    expect(provision.value).toBe(18000);
  });

  test('given empty intervals then the provision resets to current law', () => {
    startDraftReform('us', 'manual');
    setDraftProvisionIntervals('us', SINGLE, [
      { startDate: '2026-01-01', endDate: FOREVER, value: 18000 },
    ]);

    setDraftProvisionIntervals('us', SINGLE, []);

    const [provision] = getDraftReform()!.provisions;
    expect(provision.intervals).toBeUndefined();
    expect(provision.value).toBe(16100);
  });

  test('given a single value is set then any dated changes give way to it', () => {
    startDraftReform('us', 'manual');
    setDraftProvisionIntervals('us', SINGLE, [
      { startDate: '2027-01-01', endDate: '2027-12-31', value: 17000 },
    ]);

    updateDraftProvisionValue(SINGLE.path, 19000);

    const [provision] = getDraftReform()!.provisions;
    expect(provision.value).toBe(19000);
    expect(provision.intervals).toBeUndefined();
  });

  test('given a year is chosen then the draft carries it', () => {
    startDraftReform('us', 'manual');
    expect(draftYear(getDraftReform())).toBe(Number(CURRENT_YEAR));

    setDraftYear(2028);

    expect(draftYear(getDraftReform())).toBe(2028);
  });

  test('given dated changes then saving keeps every interval', () => {
    startDraftReform('us', 'manual');
    const intervals = [
      { startDate: '2026-01-01', endDate: '2026-12-31', value: 17000 },
      { startDate: '2027-01-01', endDate: FOREVER, value: 18000 },
    ];
    setDraftProvisionIntervals('us', SINGLE, intervals);

    const reform = draftToReform(getDraftReform()!, 'user-1');

    expect(reform.parameters).toEqual([{ name: SINGLE.path, values: intervals }]);
  });

  test('given a saved reform with dated values then loading it keeps the dates', () => {
    const values = [
      { startDate: '2026-01-01', endDate: '2026-12-31', value: 17000 },
      { startDate: '2027-01-01', endDate: FOREVER, value: 18000 },
    ];
    loadReformIntoDraft(
      {
        id: 'rf-1',
        countryId: 'us',
        label: 'Schedule',
        parameters: [{ name: SINGLE.path, values }],
        provenance: { source: 'manual' },
      } as unknown as Reform,
      () => ({ breadcrumb: SINGLE.breadcrumb, unit: SINGLE.unit, baselineValue: 16100 })
    );

    expect(getDraftReform()!.provisions[0].intervals).toEqual(values);
  });

  test('given a list value reloaded as a new array then it still matches current law', () => {
    const list = ['employee_social_security_tax', 'employee_medicare_tax'];

    expect(provisionChanged({ value: [...list], baselineValue: list })).toBe(false);
    expect(provisionChanged({ value: ['employee_medicare_tax'], baselineValue: list })).toBe(true);
  });

  test('given a value then only numbers and switches are editable', () => {
    expect(isEditableValue(2000)).toBe(true);
    expect(isEditableValue(false)).toBe(true);
    expect(isEditableValue(['employee_medicare_tax'])).toBe(false);
  });

  test('given a report year then each provision reads as it stands that year', () => {
    const provisions = [
      {
        ...SINGLE,
        intervals: [{ startDate: '2027-01-01', endDate: '2027-12-31', value: 17000 }],
      },
      { ...SINGLE, path: 'gov.untouched', value: 16100 },
    ];
    const currentLaw = (_path: string, year: number) => (year === 2027 ? 16500 : 16100);

    const [dated, untouched] = provisionsForYear(provisions, 2027, currentLaw);

    expect([dated.baselineValue, dated.value]).toEqual([16500, 17000]);
    // Unchanged stays current law — in that year, not the year it was added.
    expect([untouched.baselineValue, untouched.value]).toEqual([16500, 16500]);
  });

  test('given the draft year changes then dated provisions mirror that year', () => {
    startDraftReform('us', 'manual');
    setDraftProvisionIntervals('us', SINGLE, [
      { startDate: '2027-01-01', endDate: '2027-12-31', value: 17000 },
    ]);
    expect(getDraftReform()!.provisions[0].value).toBe(16100);

    setDraftYear(2027);

    expect(getDraftReform()!.provisions[0].value).toBe(17000);
  });
});

describe('provisionAdjusts', () => {
  const CURRENT_LAW = { '2025-01-01': 15750, '2026-01-01': 16100, '2027-01-01': 16500 };
  const withIntervals = (intervals: any[]) => ({ ...SINGLE, intervals });

  test('given a parameter left at current law then it changes nothing', () => {
    expect(provisionAdjusts(SINGLE, CURRENT_LAW)).toBe(false);
  });

  test('given a value typed back to current law then it changes nothing', () => {
    const typedBack = withIntervals([
      { startDate: '2026-01-01', endDate: '2026-12-31', value: 16100 },
    ]);

    expect(provisionAdjusts(typedBack, CURRENT_LAW)).toBe(false);
  });

  test('given a value held while current law moves on then it changes something', () => {
    // 16,100 from 2026 on matches 2026, but freezes the 2027 rise.
    const frozen = withIntervals([{ startDate: '2026-01-01', endDate: FOREVER, value: 16100 }]);

    expect(provisionAdjusts(frozen, CURRENT_LAW)).toBe(true);
  });

  test('given a rate typed as a percentage then float noise is no change', () => {
    const rate = {
      path: 'gov.irs.credits.eitc.phase_in_rate[0].amount',
      breadcrumb: '',
      unit: '/1',
      baselineValue: 0.0765,
      value: 0.0765,
      intervals: [{ startDate: '2026-01-01', endDate: '2026-12-31', value: 7.65 / 100 }],
    };

    expect(provisionAdjusts(rate, { '2026-01-01': 0.0765 })).toBe(false);
  });

  test('given no current law to compare then any set value counts', () => {
    expect(provisionAdjusts({ ...SINGLE, value: 18000 }, undefined)).toBe(true);
  });
});
