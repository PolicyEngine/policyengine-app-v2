import { describe, expect, test } from 'vitest';
import {
  billAlreadyCurrentLaw,
  billReportProvisions,
  billScoresOtherThanWriteUp,
  changeNamesPath,
} from '@/libs/flagship/billProvisions';
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

describe('changeNamesPath', () => {
  test('given a placeholder then it stands for one path segment', () => {
    const parameter = 'gov.states.ga.tax.income.main.{filing_status}.brackets[5].rate';

    expect(changeNamesPath(parameter, 'gov.states.ga.tax.income.main.joint.brackets[5].rate')).toBe(
      true
    );
    expect(changeNamesPath(parameter, 'gov.states.ga.tax.income.main.joint.brackets[4].rate')).toBe(
      false
    );
    expect(changeNamesPath(RATE, RATE)).toBe(true);
  });
});

describe('billScoresOtherThanWriteUp', () => {
  const UT_RATE = 'gov.states.ut.tax.income.rate';
  const change = (before: string, after: string, parameter?: string) => ({
    label: 'Income tax rate',
    before,
    after,
    ...(parameter ? { parameter } : {}),
  });

  test('given the scored value is the write-up’s law before the bill then they disagree', () => {
    // UT SB60 as stored: reform_params 0.045, a write-up of 4.5% → 4.45%.
    const provisions = [dated(UT_RATE, ['2026-01-01', '2100-12-31', 0.045])];

    expect(billScoresOtherThanWriteUp(provisions, [change('4.5%', '4.45%')])).toBe(true);
  });

  test('given the scored value is the write-up’s new value then they agree', () => {
    const provisions = [dated(UT_RATE, ['2026-01-01', '2100-12-31', 0.0445])];

    expect(billScoresOtherThanWriteUp(provisions, [change('4.5%', '4.45%')])).toBe(false);
  });

  test('given a write-up rounded to its last digit then it still reads the scored value', () => {
    // Within the rounding of "4.5%": the law before the bill.
    expect(
      billScoresOtherThanWriteUp([{ path: UT_RATE, value: 0.04501 }], [change('4.5%', '4.45%')])
    ).toBe(true);
    // Within the rounding of "4.4%": the bill.
    expect(
      billScoresOtherThanWriteUp([{ path: RATE, value: 0.04449 }], [change('5.19%', '4.4%')])
    ).toBe(false);
  });

  test('given amounts in dollars or bare numbers then they read as written', () => {
    const provisions = [{ path: DEDUCTION, value: 2000 }];

    expect(billScoresOtherThanWriteUp(provisions, [change('$1,500', '$2,000')])).toBe(false);
    expect(billScoresOtherThanWriteUp(provisions, [change('$2,000', '$2,500')])).toBe(true);
    expect(
      billScoresOtherThanWriteUp([{ path: UT_RATE, value: 0.0445 }], [change('4.5', '4.45')])
    ).toBe(false);
  });

  test('given a percent stored as a whole number then a write-up as a fraction reads it', () => {
    expect(
      billScoresOtherThanWriteUp([{ path: UT_RATE, value: 4.45 }], [change('0.045', '0.0445')])
    ).toBe(false);
    expect(
      billScoresOtherThanWriteUp([{ path: UT_RATE, value: 4.5 }], [change('0.045', '0.0445')])
    ).toBe(true);
  });

  test('given a phased bill then any value it sets can be the one written up', () => {
    const provisions = [
      dated(RATE, ['2026-01-01', '2026-12-31', 0.0519], ['2027-01-01', '2100-12-31', 0.0479]),
    ];

    // The first year keeps the law before the bill; the bill's value comes later.
    expect(billScoresOtherThanWriteUp(provisions, [change('5.19%', '4.79%')])).toBe(false);
  });

  test('given a change that names its parameter then only that parameter is checked', () => {
    const parameter = 'gov.states.ga.tax.income.main.{filing_status}.brackets[5].rate';
    const swapped = [
      { path: 'gov.states.ga.tax.income.main.single.brackets[5].rate', value: 0.0549 },
      { path: 'gov.states.ga.tax.income.main.joint.brackets[5].rate', value: 0.0549 },
      // Another provision that holds the written value does not count.
      { path: DEDUCTION, value: 5.19 },
    ];

    expect(billScoresOtherThanWriteUp(swapped, [change('5.49%', '5.19%', parameter)])).toBe(true);
  });

  test('given one filing status holds the written value then the bill agrees', () => {
    const parameter = 'gov.states.ga.tax.income.main.{filing_status}.brackets[5].rate';
    const provisions = [
      { path: 'gov.states.ga.tax.income.main.single.brackets[5].rate', value: 0.0519 },
      // The joint rate stays at the written law before the bill.
      { path: 'gov.states.ga.tax.income.main.joint.brackets[5].rate', value: 0.0575 },
    ];

    expect(billScoresOtherThanWriteUp(provisions, [change('5.75%', '5.19%', parameter)])).toBe(
      false
    );
  });

  test('given a threshold written as the joint amount then the bill agrees', () => {
    // A filing-status threshold written up with one value: the joint one.
    const parameter =
      'gov.states.ut.tax.income.credits.taxpayer.phase_out.threshold.{filing_status}';
    const provisions = [
      {
        path: 'gov.states.ut.tax.income.credits.taxpayer.phase_out.threshold.SINGLE',
        value: 250_000,
      },
      {
        path: 'gov.states.ut.tax.income.credits.taxpayer.phase_out.threshold.JOINT',
        value: 500_000,
      },
    ];

    expect(
      billScoresOtherThanWriteUp(provisions, [change('$400,000', '$500,000', parameter)])
    ).toBe(false);
    // The single amount equals the written law before the bill; the joint one is the bill.
    expect(
      billScoresOtherThanWriteUp(provisions, [change('$250,000', '$500,000', parameter)])
    ).toBe(false);
  });

  test('given a yearly write-up of a monthly parameter then nothing is flagged', () => {
    // $1,000 a year is 83.33 a month; neither written value is the stored one.
    const provisions = [{ path: 'gov.states.ut.benefit.monthly_amount', value: 83.33 }];

    expect(billScoresOtherThanWriteUp(provisions, [change('$500', '$1,000')])).toBe(false);
  });

  test('given an after written as a step or a year then nothing is flagged', () => {
    const phased = [
      dated(UT_RATE, ['2026-01-01', '2026-12-31', 0.045], ['2027-01-01', '2100-12-31', 0.0425]),
    ];

    // "−0.25%" is the step from 4.5%, not the new rate.
    expect(billScoresOtherThanWriteUp(phased, [change('4.5%', '−0.25%')])).toBe(false);
    expect(
      billScoresOtherThanWriteUp(
        [dated(UT_RATE, ['2026-01-01', '2026-12-31', 0.04], ['2027-01-01', '2100-12-31', 0.05])],
        [change('4%', '+1%')]
      )
    ).toBe(false);
    expect(
      billScoresOtherThanWriteUp([{ path: UT_RATE, value: 0.0445 }], [change('2026', '2027')])
    ).toBe(false);
  });

  test('given a write-up that cannot be paired or read as a number then nothing is flagged', () => {
    const two = [
      { path: UT_RATE, value: 0.045 },
      { path: DEDUCTION, value: 2000 },
    ];

    // Two provisions, no parameter named: which one the change describes is unknown.
    expect(billScoresOtherThanWriteUp(two, [change('4.5%', '4.45%')])).toBe(false);
    // Words, not one number.
    expect(
      billScoresOtherThanWriteUp(
        [{ path: UT_RATE, value: 0.045 }],
        [change('Under 7', 'Under 7 (2026) to Under 16 (2035)')]
      )
    ).toBe(false);
    expect(billScoresOtherThanWriteUp([{ path: UT_RATE, value: 0.045 }], undefined)).toBe(false);
    expect(billScoresOtherThanWriteUp([{ path: UT_RATE, value: true }], [change('No', '5%')])).toBe(
      false
    );
  });
});
