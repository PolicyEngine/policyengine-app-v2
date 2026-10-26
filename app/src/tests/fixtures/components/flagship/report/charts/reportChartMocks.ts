import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';

/**
 * Economy results of report 4332 (US, 2026: CDCC maximum dependents from 2 to 4),
 * as the v1 API returned them: a $331.0m cost, $296.5m federal and $34.5m state
 * and local, with small poverty and inequality changes.
 */
export const REPORT_4332_OUTPUT = {
  budget: {
    households: 124557998.60092863,
    budgetary_impact: -330980940.9239813,
    tax_revenue_impact: -330980940.9239813,
    baseline_net_income: 17420807390172.06,
    benefit_spending_impact: 0,
    state_tax_revenue_impact: -34515491.73181633,
  },
  decile: {
    average: {
      '1': 0,
      '2': 0,
      '3': 0.04738903845282039,
      '4': 0.5998815664206631,
      '5': 5.620930099466932,
      '6': 2.467962196606095,
      '7': 11.5899849004345,
      '8': 1.784501137532061,
      '9': 3.5798453725583386,
      '10': 3.1161489728838205,
    },
    relative: {
      '1': 0,
      '2': 0,
      '3': 7.733857678339371e-5,
      '4': 0.0007866386044568331,
      '5': 0.005987070420609693,
      '6': 0.0021263244388047306,
      '7': 0.008073958821834992,
      '8': 0.0009999914917788438,
      '9': 0.0015052375094691732,
      '10': 0.0005833702324809575,
    },
  },
  poverty: {
    poverty: {
      all: {
        reform: 0.138310431129822,
        baseline: 0.13861915158291285,
      },
      adult: {
        reform: 0.13158770083653196,
        baseline: 0.13179536679329923,
      },
      child: {
        reform: 0.17934305523770158,
        baseline: 0.1801645318438677,
      },
      senior: {
        reform: 0.10909592581317136,
        baseline: 0.10909592581317136,
      },
    },
    deep_poverty: {
      all: {
        reform: 0.03109462482918859,
        baseline: 0.03109462482918859,
      },
      adult: {
        reform: 0.029965602476467776,
        baseline: 0.029965602476467776,
      },
      child: {
        reform: 0.023640702677333737,
        baseline: 0.023640702677333737,
      },
      senior: {
        reform: 0.044171850845934994,
        baseline: 0.044171850845934994,
      },
    },
  },
  poverty_by_gender: {
    poverty: {
      male: {
        reform: 0.13606222806424512,
        baseline: 0.13643791190513133,
      },
      female: {
        reform: 0.1404970225217668,
        baseline: 0.14074061470883456,
      },
    },
    deep_poverty: {
      male: {
        reform: 0.03191050208659364,
        baseline: 0.03191050208659364,
      },
      female: {
        reform: 0.030301106567764215,
        baseline: 0.030301106567764215,
      },
    },
  },
  poverty_by_race: {
    poverty: {
      black: {
        reform: 0.22104849592686496,
        baseline: 0.22104849592686496,
      },
      other: {
        reform: 0.12645692974263542,
        baseline: 0.12645692974263542,
      },
      white: {
        reform: 0.10456054391701826,
        baseline: 0.10456054391701826,
      },
      hispanic: {
        reform: 0.20342160844780424,
        baseline: 0.20506786702208796,
      },
    },
  },
  inequality: {
    gini: {
      reform: 0.4746169673192355,
      baseline: 0.4746187907950498,
    },
    top_1_pct_share: {
      reform: 0.09533548088268526,
      baseline: 0.09533653480714316,
    },
    top_10_pct_share: {
      reform: 0.363820464797288,
      baseline: 0.3638253730109658,
    },
  },
  intra_decile: {
    all: {
      'No change': 0.994458713695942,
      'Gain less than 5%': 0.00554128630405818,
      'Gain more than 5%': 0,
      'Lose less than 5%': 0,
      'Lose more than 5%': 0,
    },
    deciles: {
      'No change': [
        1, 1, 0.9994252127679146, 0.998065584209819, 0.9876714160610904, 0.9950919834746716,
        0.9835900286916766, 0.9958168919250228, 0.9905364210959816, 0.9943895987332418,
      ],
      'Gain less than 5%': [
        0, 0, 0.0005747872320855093, 0.0019344157901811149, 0.012328583938909591,
        0.004908016525328612, 0.016409971308323185, 0.004183108074977317, 0.009463578904018308,
        0.005610401266758165,
      ],
      'Gain more than 5%': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      'Lose less than 5%': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      'Lose more than 5%': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  },
} as unknown as SocietyWideReportOutput;

/** A report chart's size in a card on a 375px phone, px. */
export const PHONE_CHART_SIZE = { width: 300, height: 260 };

/** Report 4332's budget bars, as the chart labels them. */
export const REPORT_4332_BUDGET_LABELS = ['−$296.5m', '−$34.5m', '−$331.0m'];

/** A report's output with its budget swapped for the given amounts, in dollars. */
export function withBudget(
  output: SocietyWideReportOutput,
  { federal, state, benefits = 0 }: { federal: number; state: number; benefits?: number }
): SocietyWideReportOutput {
  return {
    ...output,
    budget: {
      ...output.budget,
      tax_revenue_impact: federal + state,
      state_tax_revenue_impact: state,
      benefit_spending_impact: benefits,
      budgetary_impact: federal + state - benefits,
    },
  } as SocietyWideReportOutput;
}

/** A report's output with its inequality changes swapped for the given relative changes. */
export function withInequalityChanges(
  output: SocietyWideReportOutput,
  { gini, top10, top1 }: { gini: number; top10: number; top1: number }
): SocietyWideReportOutput {
  return {
    ...output,
    inequality: {
      gini: { baseline: 0.47, reform: 0.47 * (1 + gini) },
      top_10_pct_share: { baseline: 0.36, reform: 0.36 * (1 + top10) },
      top_1_pct_share: { baseline: 0.095, reform: 0.095 * (1 + top1) },
    },
  } as SocietyWideReportOutput;
}

/** A report's output with each age group's poverty rate moved by the given relative change. */
export function withPovertyByAgeChanges(
  output: SocietyWideReportOutput,
  { child, adult, senior, all }: { child: number; adult: number; senior: number; all: number }
): SocietyWideReportOutput {
  const rate = (baseline: number, change: number) => ({
    baseline,
    reform: baseline * (1 + change),
  });
  return {
    ...output,
    poverty: {
      ...output.poverty,
      poverty: {
        child: rate(0.18, child),
        adult: rate(0.13, adult),
        senior: rate(0.11, senior),
        all: rate(0.14, all),
      },
    },
  } as SocietyWideReportOutput;
}

type Rate = { baseline: number; reform: number };

/** A report's output with its deep poverty rates by age swapped for the given ones. */
export function withDeepPovertyByAge(
  output: SocietyWideReportOutput,
  rates: { child: Rate; adult: Rate; senior: Rate; all: Rate }
): SocietyWideReportOutput {
  return {
    ...output,
    poverty: { ...output.poverty, deep_poverty: rates },
  } as SocietyWideReportOutput;
}

/**
 * Deep poverty by age in a small region, as report 4302 (NY-04, 2026)
 * returned it for seniors: none in deep poverty, before or after.
 */
export const NO_SENIORS_IN_DEEP_POVERTY = {
  child: { baseline: 0.04, reform: 0.038 },
  adult: { baseline: 0.03, reform: 0.029 },
  senior: { baseline: 0, reform: 0 },
  all: { baseline: 0.025, reform: 0.024 },
};

/** A report's output with one race's poverty rate swapped for the given one. */
export function withRacePoverty(
  output: SocietyWideReportOutput,
  race: string,
  rate: Rate
): SocietyWideReportOutput {
  const byRace = (output as any).poverty_by_race;
  return {
    ...output,
    poverty_by_race: { ...byRace, poverty: { ...byRace.poverty, [race]: rate } },
  } as SocietyWideReportOutput;
}

/** A UK result's wealth deciles: households gain more the wealthier they are. */
export const UK_WEALTH_DECILE = {
  average: {
    '1': 0,
    '2': 213.34,
    '3': 480.72,
    '4': 703.5,
    '5': 764.0,
    '6': 859.95,
    '7': 876.18,
    '8': 1054.03,
    '9': 965.36,
    '10': 978.58,
  },
  relative: {
    '1': 0,
    '2': 0.0058,
    '3': 0.0101,
    '4': 0.0144,
    '5': 0.0145,
    '6': 0.0142,
    '7': 0.0146,
    '8': 0.0157,
    '9': 0.0145,
    '10': 0.0131,
  },
};

/** A UK result's winners and losers by wealth decile: 30% gain, 70% see no change. */
export const UK_INTRA_WEALTH_DECILE = {
  all: {
    'Gain more than 5%': 0.1,
    'Gain less than 5%': 0.2,
    'No change': 0.7,
    'Lose less than 5%': 0,
    'Lose more than 5%': 0,
  },
  deciles: {
    'Gain more than 5%': Array(10).fill(0.1),
    'Gain less than 5%': Array(10).fill(0.2),
    'No change': Array(10).fill(0.7),
    'Lose less than 5%': Array(10).fill(0),
    'Lose more than 5%': Array(10).fill(0),
  },
};

/** A UK result's budget by program: £2.0bn more income tax, £0.5bn more universal credit. */
export const UK_DETAILED_BUDGET = {
  income_tax: { baseline: 300e9, reform: 302e9, difference: 2e9 },
  universal_credit: { baseline: 70e9, reform: 70.5e9, difference: -0.5e9 },
  child_benefit: { baseline: 16.9e9, reform: 16.9e9, difference: 0 },
};

/** Report 4332's results with the UK's own breakdowns added: wealth deciles and programs. */
export function withUKBreakdowns(output: SocietyWideReportOutput): SocietyWideReportOutput {
  return {
    ...withBudget(output, { federal: 1.5e9, state: 0 }),
    wealth_decile: UK_WEALTH_DECILE,
    intra_wealth_decile: UK_INTRA_WEALTH_DECILE,
    detailed_budget: UK_DETAILED_BUDGET,
  } as unknown as SocietyWideReportOutput;
}
