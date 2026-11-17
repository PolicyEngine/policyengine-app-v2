import type { BudgetWindowParams, BudgetWindowResponse } from '@/api/budgetWindow';

/** How often `useBudgetWindow` checks on a running window. */
export const BUDGET_WINDOW_POLL_INTERVAL_MS = 5000;

export const BUDGET_WINDOW_COUNTRY_ID = 'us';
export const BUDGET_WINDOW_REFORM_POLICY_ID = '98746';
export const BUDGET_WINDOW_BASELINE_POLICY_ID = '2';

export const BUDGET_WINDOW_PARAMS: BudgetWindowParams = {
  region: 'us',
  startYear: 2026,
  windowSize: 10,
};

/** A window still scoring its years. */
export const BUDGET_WINDOW_COMPUTING: BudgetWindowResponse = {
  status: 'computing',
  message: 'Scoring 2026, 2027 (0 of 10 complete)...',
  result: null,
  progress: 0,
};

/** A check that failed, as `fetchBudgetWindow` throws on a gateway's 502. */
export const BUDGET_WINDOW_CHECK_FAILURE = new Error('Budget window request failed (502)');

/** A window the server itself answered with an error. */
export const BUDGET_WINDOW_SERVER_ERROR: BudgetWindowResponse = {
  status: 'error',
  result: null,
  error: 'Simulation failed for 2027',
};
