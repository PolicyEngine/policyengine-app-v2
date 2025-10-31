import { CURRENT_YEAR } from '@/constants';
import { ValueInterval } from '@/types/subIngredients/valueInterval';

export const MOCK_START_DATE = `${CURRENT_YEAR}-01-01`;
export const MOCK_END_DATE = `${CURRENT_YEAR}-12-31`;
export const MOCK_VALUE = 0.25;

export const MOCK_VALUE_INTERVAL: ValueInterval = {
  startDate: MOCK_START_DATE,
  endDate: MOCK_END_DATE,
  value: MOCK_VALUE,
};

export const MOCK_VALUE_INTERVAL_2: ValueInterval = {
  startDate: `${CURRENT_YEAR + 1}-01-01`,
  endDate: `${CURRENT_YEAR + 1}-12-31`,
  value: 0.3,
};

export const MOCK_VALUE_INTERVAL_3: ValueInterval = {
  startDate: `${CURRENT_YEAR + 2}-01-01`,
  endDate: `${CURRENT_YEAR + 2}-12-31`,
  value: 0.35,
};

export const MOCK_VALUE_INTERVALS = [
  MOCK_VALUE_INTERVAL,
  MOCK_VALUE_INTERVAL_2,
  MOCK_VALUE_INTERVAL_3,
];

// Mock string format for API responses
export const MOCK_VALUE_INTERVAL_STRING = '2024-01-01.2024-12-31:0.25';
export const MOCK_VALUE_INTERVAL_2_STRING = '2025-01-01.2025-12-31:0.30';
export const MOCK_VALUE_INTERVAL_3_STRING = '2026-01-01.2026-12-31:0.35';

export const MOCK_VALUE_INTERVALS_STRING = [
  MOCK_VALUE_INTERVAL_STRING,
  MOCK_VALUE_INTERVAL_2_STRING,
  MOCK_VALUE_INTERVAL_3_STRING,
];
