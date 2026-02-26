import type { Meta, StoryObj } from '@storybook/react';
import type { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';
import SocietyWideOverview from './SocietyWideOverview';

const meta: Meta<typeof SocietyWideOverview> = {
  title: 'Report output/SocietyWideOverview',
  component: SocietyWideOverview,
};

export default meta;
type Story = StoryObj<typeof SocietyWideOverview>;

// Helper to build a minimal SocietyWideReportOutput with overrides
function buildMockOutput(overrides: {
  budgetaryImpact?: number;
  povertyBaseline?: number;
  povertyReform?: number;
  winnersGainMore?: number;
  winnersGainLess?: number;
  losersLoseMore?: number;
  losersLoseLess?: number;
  noChange?: number;
}): ReportOutputSocietyWideUS {
  const {
    budgetaryImpact = 0,
    povertyBaseline = 0.112,
    povertyReform = 0.112,
    winnersGainMore = 0,
    winnersGainLess = 0,
    losersLoseMore = 0,
    losersLoseLess = 0,
    noChange = 1,
  } = overrides;

  return {
    budget: {
      baseline_net_income: 12_000_000_000_000,
      benefit_spending_impact: budgetaryImpact > 0 ? -budgetaryImpact * 0.4 : budgetaryImpact * 0.6,
      budgetary_impact: budgetaryImpact,
      households: 130_000_000,
      state_tax_revenue_impact: 0,
      tax_revenue_impact: budgetaryImpact > 0 ? budgetaryImpact * 0.6 : -budgetaryImpact * 0.4,
    },
    cliff_impact: null,
    congressional_district_impact: null,
    constituency_impact: null,
    data_version: '2026-01-01',
    decile: {
      average: {
        '1': 200,
        '2': 350,
        '3': 500,
        '4': 650,
        '5': 800,
        '6': 950,
        '7': 1100,
        '8': 1250,
        '9': 1400,
        '10': -200,
      },
      relative: {
        '1': 0.05,
        '2': 0.04,
        '3': 0.03,
        '4': 0.025,
        '5': 0.02,
        '6': 0.015,
        '7': 0.01,
        '8': 0.005,
        '9': 0.002,
        '10': -0.001,
      },
    },
    detailed_budget: {},
    inequality: {
      gini: { baseline: 0.42, reform: 0.41 },
      top_10_pct_share: { baseline: 0.47, reform: 0.46 },
      top_1_pct_share: { baseline: 0.21, reform: 0.205 },
    },
    intra_decile: {
      all: {
        'Gain more than 5%': winnersGainMore,
        'Gain less than 5%': winnersGainLess,
        'Lose more than 5%': losersLoseMore,
        'Lose less than 5%': losersLoseLess,
        'No change': noChange,
      },
      deciles: {
        'Gain more than 5%': Array(11).fill(winnersGainMore),
        'Gain less than 5%': Array(11).fill(winnersGainLess),
        'Lose more than 5%': Array(11).fill(losersLoseMore),
        'Lose less than 5%': Array(11).fill(losersLoseLess),
        'No change': Array(11).fill(noChange),
      },
    },
    intra_wealth_decile: null,
    labor_supply_response: {
      decile: {
        average: { income: {}, substitution: {} },
        relative: { income: {}, substitution: {} },
      },
      hours: { baseline: 0, change: 0, income_effect: 0, reform: 0, substitution_effect: 0 },
      income_lsr: 0,
      relative_lsr: { income: 0, substitution: 0 },
      revenue_change: 0,
      substitution_lsr: 0,
      total_change: 0,
    },
    model_version: '1.0.0',
    poverty: {
      deep_poverty: {
        adult: { baseline: 0.04, reform: 0.04 },
        all: { baseline: 0.05, reform: 0.05 },
        child: { baseline: 0.06, reform: 0.06 },
        senior: { baseline: 0.03, reform: 0.03 },
      },
      poverty: {
        adult: { baseline: povertyBaseline, reform: povertyReform },
        all: { baseline: povertyBaseline, reform: povertyReform },
        child: { baseline: povertyBaseline * 1.3, reform: povertyReform * 1.3 },
        senior: { baseline: povertyBaseline * 0.7, reform: povertyReform * 0.7 },
      },
    },
    poverty_by_gender: {
      deep_poverty: {
        female: { baseline: 0.05, reform: 0.05 },
        male: { baseline: 0.04, reform: 0.04 },
      },
      poverty: {
        female: { baseline: povertyBaseline, reform: povertyReform },
        male: { baseline: povertyBaseline * 0.9, reform: povertyReform * 0.9 },
      },
    },
    poverty_by_race: {
      poverty: {
        black: { baseline: 0.18, reform: 0.18 },
        hispanic: { baseline: 0.16, reform: 0.16 },
        other: { baseline: 0.1, reform: 0.1 },
        white: { baseline: 0.08, reform: 0.08 },
      },
    },
    wealth_decile: null,
  };
}

export const PositiveBudget: Story = {
  args: {
    output: buildMockOutput({
      budgetaryImpact: 120_000_000_000,
      povertyBaseline: 0.112,
      povertyReform: 0.098,
      winnersGainMore: 0.15,
      winnersGainLess: 0.35,
      losersLoseMore: 0.02,
      losersLoseLess: 0.08,
      noChange: 0.4,
    }),
  },
};

export const NegativeBudget: Story = {
  args: {
    output: buildMockOutput({
      budgetaryImpact: -340_000_000_000,
      povertyBaseline: 0.112,
      povertyReform: 0.125,
      winnersGainMore: 0.05,
      winnersGainLess: 0.1,
      losersLoseMore: 0.2,
      losersLoseLess: 0.3,
      noChange: 0.35,
    }),
  },
};

export const Neutral: Story = {
  args: {
    output: buildMockOutput({
      budgetaryImpact: 0,
      povertyBaseline: 0.112,
      povertyReform: 0.112,
      winnersGainMore: 0.01,
      winnersGainLess: 0.02,
      losersLoseMore: 0.01,
      losersLoseLess: 0.02,
      noChange: 0.94,
    }),
  },
};
