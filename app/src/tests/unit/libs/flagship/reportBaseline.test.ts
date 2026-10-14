import { describe, expect, test } from 'vitest';
import { reportBaselineLabel, reportRunBaseline } from '@/libs/flagship/reportBaseline';

const PLAN_B_META = {
  baseline: { reformId: 'rf-plan-b', policyId: '88', label: 'Plan B' },
};
const CURRENT_LAW_POLICY = { label: null, parameters: [] };
const PLAN_B_POLICY = {
  label: 'Plan B (API)',
  parameters: [
    {
      name: 'gov.irs.credits.ctc.amount.base[0].amount',
      values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3000 }],
    },
  ],
};

describe('reportBaselineLabel', () => {
  test('given a run compared with a saved reform then its record names it', () => {
    expect(reportBaselineLabel(PLAN_B_META, PLAN_B_POLICY)).toBe('Plan B');
  });

  test('given a report run before baselines could be chosen then it reads as current law', () => {
    // Older meta has no baseline field, and its baseline policy is current law.
    expect(reportBaselineLabel({}, CURRENT_LAW_POLICY)).toBeNull();
    expect(reportBaselineLabel(null, undefined)).toBeNull();
  });

  test('given a shared link without the record then the baseline policy names it', () => {
    expect(reportBaselineLabel(null, PLAN_B_POLICY)).toBe('Plan B (API)');
    expect(reportBaselineLabel(null, { ...PLAN_B_POLICY, label: null })).toBe(
      'Custom baseline policy'
    );
  });
});

describe('reportRunBaseline', () => {
  test('given a report compared with a saved reform then a re-run reuses its baseline policy', () => {
    expect(reportRunBaseline(PLAN_B_META, '88', 'Plan B')).toEqual({
      reformId: 'rf-plan-b',
      label: 'Plan B',
      policyId: 88,
    });
  });

  test('given a shared link then the re-run keeps the policy, with no saved reform', () => {
    expect(reportRunBaseline(null, '88', 'Plan B (API)')).toEqual({
      reformId: null,
      label: 'Plan B (API)',
      policyId: 88,
    });
  });

  test('given current law then a re-run compares with current law', () => {
    expect(reportRunBaseline({}, '2', null)).toBeUndefined();
    expect(reportRunBaseline(PLAN_B_META, undefined, 'Plan B')).toBeUndefined();
  });
});
