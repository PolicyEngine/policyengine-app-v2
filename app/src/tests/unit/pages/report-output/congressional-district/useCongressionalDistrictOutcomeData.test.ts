import { describe, expect, test } from 'vitest';
import {
  extractDistrictOutcomeShares,
  getDistrictOutcomeValue,
} from '@/pages/report-output/congressional-district/useCongressionalDistrictOutcomeData';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

describe('useCongressionalDistrictOutcomeData helpers', () => {
  test('extractDistrictOutcomeShares sums winners and losers from intra-decile output', () => {
    const output = createMockSocietyWideOutput({
      intra_decile: {
        all: {
          'Gain more than 5%': 0.2,
          'Gain less than 5%': 0.15,
          'Lose more than 5%': 0.05,
          'Lose less than 5%': 0.1,
          'No change': 0.5,
        },
      },
    }) as any;

    const shares = extractDistrictOutcomeShares(output);

    expect(shares?.winnerPct).toBeCloseTo(0.35);
    expect(shares?.loserPct).toBeCloseTo(0.15);
    expect(shares?.noChangePct).toBeCloseTo(0.5);
  });

  test('extractDistrictOutcomeShares returns null when intra-decile data is unavailable', () => {
    const output = createMockSocietyWideOutput({
      intra_decile: undefined,
    }) as any;

    expect(extractDistrictOutcomeShares(output)).toBeNull();
  });

  test('getDistrictOutcomeValue returns the requested outcome metric', () => {
    const shares = {
      winnerPct: 0.42,
      loserPct: 0.09,
      noChangePct: 0.49,
    };

    expect(getDistrictOutcomeValue(shares, 'winner')).toBe(0.42);
    expect(getDistrictOutcomeValue(shares, 'loser')).toBe(0.09);
  });
});
