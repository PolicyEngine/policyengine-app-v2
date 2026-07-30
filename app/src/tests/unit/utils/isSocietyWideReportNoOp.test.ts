import { describe, expect, test } from 'vitest';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { isSocietyWideReportNoOp } from '@/utils/isSocietyWideReportNoOp';

/**
 * The detection util only reads `budget` (budgetary/benefit-spending/tax-revenue
 * impacts) and `intra_decile.all['No change']`, which are identical in the US
 * and UK report shapes. These builders produce faithful all-zero fixtures for
 * each shape (with a country-specific marker field) plus targeted overrides.
 */

function buildBudget(overrides: Record<string, number> = {}) {
  return {
    baseline_net_income: 12_000_000_000_000,
    benefit_spending_impact: 0,
    budgetary_impact: 0,
    households: 130_000_000,
    state_tax_revenue_impact: 0,
    tax_revenue_impact: 0,
    ...overrides,
  };
}

function buildIntraDecile(noChange: number) {
  const split = (1 - noChange) / 2;
  return {
    all: {
      'Gain less than 5%': split,
      'Gain more than 5%': 0,
      'Lose less than 5%': split,
      'Lose more than 5%': 0,
      'No change': noChange,
    },
    deciles: {
      'Gain less than 5%': Array(10).fill(split),
      'Gain more than 5%': Array(10).fill(0),
      'Lose less than 5%': Array(10).fill(split),
      'Lose more than 5%': Array(10).fill(0),
      'No change': Array(10).fill(noChange),
    },
  };
}

function usOutput(overrides: Record<string, unknown> = {}): SocietyWideReportOutput {
  return {
    budget: buildBudget(),
    intra_decile: buildIntraDecile(1),
    // US-specific markers
    congressional_district_impact: null,
    poverty_by_race: { poverty: {} },
    wealth_decile: null,
    ...overrides,
  } as unknown as SocietyWideReportOutput;
}

function ukOutput(overrides: Record<string, unknown> = {}): SocietyWideReportOutput {
  return {
    budget: buildBudget(),
    intra_decile: buildIntraDecile(1),
    // UK-specific markers
    constituency_impact: { by_constituency: {}, outcomes_by_region: {} },
    intra_wealth_decile: { all: {}, deciles: {} },
    poverty_by_race: null,
    ...overrides,
  } as unknown as SocietyWideReportOutput;
}

describe('isSocietyWideReportNoOp', () => {
  describe('exact no-op is detected', () => {
    test('given an all-zero US report then returns true', () => {
      expect(isSocietyWideReportNoOp(usOutput())).toBe(true);
    });

    test('given an all-zero UK report then returns true', () => {
      expect(isSocietyWideReportNoOp(ukOutput())).toBe(true);
    });
  });

  describe('real impacts are not treated as a no-op', () => {
    test('given a tiny nonzero budgetary impact then returns false', () => {
      expect(
        isSocietyWideReportNoOp(usOutput({ budget: buildBudget({ budgetary_impact: 1 }) }))
      ).toBe(false);
    });

    test('given a nonzero benefit-spending component then returns false', () => {
      expect(
        isSocietyWideReportNoOp(
          usOutput({ budget: buildBudget({ benefit_spending_impact: 1_000_000 }) })
        )
      ).toBe(false);
    });

    test('given a nonzero tax-revenue component then returns false', () => {
      expect(
        isSocietyWideReportNoOp(
          usOutput({ budget: buildBudget({ tax_revenue_impact: -1_000_000 }) })
        )
      ).toBe(false);
    });

    test('given 99.9% no change then returns false', () => {
      expect(isSocietyWideReportNoOp(usOutput({ intra_decile: buildIntraDecile(0.999) }))).toBe(
        false
      );
    });

    test('given a revenue-neutral reform with real winners and losers then returns false', () => {
      // Budgetary impact nets to zero, but benefit-spending and tax-revenue move
      // and only 60% of the population is unchanged — a single zero panel must
      // not trigger the callout.
      expect(
        isSocietyWideReportNoOp(
          usOutput({
            budget: buildBudget({
              benefit_spending_impact: 5_000_000_000,
              tax_revenue_impact: 5_000_000_000,
            }),
            intra_decile: buildIntraDecile(0.6),
          })
        )
      ).toBe(false);
    });
  });

  describe('missing or malformed data is treated as NOT a no-op', () => {
    test('given null then returns false', () => {
      expect(isSocietyWideReportNoOp(null)).toBe(false);
    });

    test('given undefined then returns false', () => {
      expect(isSocietyWideReportNoOp(undefined)).toBe(false);
    });

    test('given a missing budget then returns false', () => {
      const { budget: _budget, ...withoutBudget } = usOutput() as unknown as Record<
        string,
        unknown
      >;
      expect(isSocietyWideReportNoOp(withoutBudget as unknown as SocietyWideReportOutput)).toBe(
        false
      );
    });

    test('given a budget missing the tax-revenue component then returns false', () => {
      const partialBudget = buildBudget() as Record<string, unknown>;
      delete partialBudget.tax_revenue_impact;
      expect(isSocietyWideReportNoOp(usOutput({ budget: partialBudget }))).toBe(false);
    });

    test('given a missing intra_decile breakdown then returns false', () => {
      const { intra_decile: _intra, ...withoutIntra } = usOutput() as unknown as Record<
        string,
        unknown
      >;
      expect(isSocietyWideReportNoOp(withoutIntra as unknown as SocietyWideReportOutput)).toBe(
        false
      );
    });

    test('given an intra_decile without a No change entry then returns false', () => {
      expect(
        isSocietyWideReportNoOp(
          usOutput({
            intra_decile: {
              all: {
                'Gain less than 5%': 0,
                'Gain more than 5%': 0,
                'Lose less than 5%': 0,
                'Lose more than 5%': 0,
              },
            },
          })
        )
      ).toBe(false);
    });

    test('given a non-numeric budgetary impact then returns false', () => {
      expect(
        isSocietyWideReportNoOp(
          usOutput({ budget: buildBudget({ budgetary_impact: null as unknown as number }) })
        )
      ).toBe(false);
    });
  });
});
