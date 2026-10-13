import { describe, expect, test } from 'vitest';
import { billAlreadyCurrentLaw, billReportProvisions } from '@/libs/flagship/billProvisions';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';

const RATE = 'gov.states.ga.tax.income.main.flat_rate';
const DEDUCTION = 'gov.states.va.tax.income.deductions.standard.JOINT';

const PARAMETERS = {
  [RATE]: {
    parameter: RATE,
    label: 'Georgia flat income tax rate',
    type: 'parameter',
    unit: '/1',
    values: { '2025-01-01': 0.0519, '2026-01-01': 0.0499 },
  },
  [DEDUCTION]: {
    parameter: DEDUCTION,
    label: 'Virginia joint standard deduction',
    type: 'parameter',
    unit: 'currency-USD',
    // Indexed: the 2027 amount differs from today's.
    values: { '2026-01-01': 17500, '2027-01-01': 18400 },
  },
} as unknown as ParameterMetadataCollection;

const dated = (path: string, ...intervals: Array<[string, string, number]>) => ({
  path,
  value: intervals[0][2],
  intervals: intervals.map(([startDate, endDate, value]) => ({ startDate, endDate, value })),
});

describe('billReportProvisions', () => {
  test('given a bill from 2027 then it reads against the 2027 law, not today’s', () => {
    const [provision] = billReportProvisions(
      [dated(DEDUCTION, ['2027-01-01', '2100-12-31', 20000])],
      PARAMETERS,
      2027
    );

    expect(provision).toMatchObject({
      path: DEDUCTION,
      unit: 'currency-USD',
      baselineValue: 18400,
      value: 20000,
      intervals: [{ startDate: '2027-01-01', endDate: '2100-12-31', value: 20000 }],
    });
  });

  test('given a bill that is law already then it reads against the law the tracker compared it with', () => {
    const provision = {
      ...dated(RATE, ['2026-01-01', '2026-12-31', 0.0499]),
      baselineIntervals: [{ startDate: '2026-01-01', endDate: '2026-12-31', value: 0.0509 }],
    };

    // Today's law already has the bill's 4.99%; the tracker compared it with 5.09%.
    expect(billReportProvisions([provision], PARAMETERS, 2026)[0].baselineValue).toBe(0.0499);
    expect(
      billReportProvisions([provision], PARAMETERS, 2026, { priorLaw: true })[0].baselineValue
    ).toBe(0.0509);
  });

  test('given a parameter missing from metadata then the tracker’s baseline stands in', () => {
    const [provision] = billReportProvisions(
      [
        {
          path: 'gov.contrib.states.sc.h4216.in_effect',
          value: true,
          baselineIntervals: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: false }],
        },
      ],
      PARAMETERS,
      2026
    );

    expect(provision.baselineValue).toBe(false);
  });

  test('given a parameter missing from metadata then it keeps its path and no baseline', () => {
    const [provision] = billReportProvisions(
      [{ path: 'gov.contrib.states.sc.h4216.in_effect', value: true }],
      PARAMETERS,
      2026
    );

    expect(provision).toMatchObject({
      breadcrumb: 'gov.contrib.states.sc.h4216.in_effect',
      unit: null,
      baselineValue: undefined,
    });
  });
});

describe('billAlreadyCurrentLaw', () => {
  test('given a one-year change that matches that year’s law then the bill is already law', () => {
    expect(
      billAlreadyCurrentLaw([dated(RATE, ['2026-01-01', '2026-12-31', 0.0499])], PARAMETERS, 2026)
    ).toBe(true);
  });

  test('given a later year that differs from the law then the bill is not already law', () => {
    expect(
      billAlreadyCurrentLaw(
        [dated(RATE, ['2026-01-01', '2026-12-31', 0.0499], ['2027-01-01', '2100-12-31', 0.0399])],
        PARAMETERS,
        2026
      )
    ).toBe(false);
  });

  test('given a value that freezes an amount the law raises then the bill is not already law', () => {
    expect(
      billAlreadyCurrentLaw(
        [dated(DEDUCTION, ['2026-01-01', '2100-12-31', 17500])],
        PARAMETERS,
        2026
      )
    ).toBe(false);
  });

  test('given dates before the run year then they are not checked', () => {
    expect(
      billAlreadyCurrentLaw(
        [dated(RATE, ['2025-01-01', '2025-12-31', 0.06], ['2026-01-01', '2100-12-31', 0.0499])],
        PARAMETERS,
        2026
      )
    ).toBe(true);
  });
});
