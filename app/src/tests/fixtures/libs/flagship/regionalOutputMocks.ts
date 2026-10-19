import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';

export const REGIONAL_TEST = {
  COUNTRY: 'us',
  REFORM_ID: '77',
  BASELINE_ID: '2',
  YEAR: '2026',
  STATE: 'state/ca',
  OTHER_STATE: 'state/ny',
} as const;

/** A state's block, as the API would send it under `regions`. */
export const mockStateBlock = (budgetaryImpact = -1_000_000) => ({
  budget: {
    baseline_net_income: 100_000_000,
    benefit_spending_impact: 0,
    budgetary_impact: budgetaryImpact,
    households: 13_000_000,
    state_tax_revenue_impact: 0,
    tax_revenue_impact: budgetaryImpact,
  },
  decile: {
    average: { '1': 10, '2': 20 },
    relative: { '1': 0.01, '2': 0.02 },
  },
  poverty: { poverty: {} },
});

/** A nationwide result, with the given state blocks (none when omitted). */
export const mockNationalOutput = (regions?: Record<string, unknown>): SocietyWideReportOutput =>
  ({
    budget: {
      baseline_net_income: 1_000_000_000,
      benefit_spending_impact: 0,
      budgetary_impact: -10_000_000,
      households: 130_000_000,
      state_tax_revenue_impact: 0,
      tax_revenue_impact: -10_000_000,
    },
    decile: { average: { '1': 5 }, relative: { '1': 0.005 } },
    model_version: '1.500.0',
    data_version: '1.90.0',
    dataset: 'enhanced_cps_2024',
    ...(regions && { regions }),
  }) as unknown as SocietyWideReportOutput;

/** A nationwide result that carries California's block. */
export const mockNationalOutputWithCalifornia = () =>
  mockNationalOutput({ [REGIONAL_TEST.STATE]: mockStateBlock() });
