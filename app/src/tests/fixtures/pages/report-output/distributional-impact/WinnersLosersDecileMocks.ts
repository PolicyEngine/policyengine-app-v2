import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';

const DECILE_VALUES = [0.1, 0.15, 0.2, 0.1, 0.05, 0.05, 0.1, 0.05, 0.1, 0.1];

const INTRA_DECILE_DATA = {
  deciles: {
    'Gain more than 5%': DECILE_VALUES,
    'Gain less than 5%': DECILE_VALUES.map((v) => v * 0.5),
    'No change': DECILE_VALUES.map((v) => 1 - v * 3),
    'Lose less than 5%': DECILE_VALUES.map((v) => v * 0.8),
    'Lose more than 5%': DECILE_VALUES.map((v) => v * 0.7),
  },
  all: {
    'Gain more than 5%': 0.1,
    'Gain less than 5%': 0.15,
    'No change': 0.5,
    'Lose less than 5%': 0.15,
    'Lose more than 5%': 0.1,
  },
};

export const MOCK_WINNERS_LOSERS_OUTPUT = {
  intra_decile: INTRA_DECILE_DATA,
} as unknown as SocietyWideReportOutput;
