import { describe, expect, test } from 'vitest';
import {
  baselineProvisions,
  customBaseline,
  reportBaselineLabel,
  reportBaselineUnknown,
  reportRunBaseline,
} from '@/libs/flagship/reportBaseline';

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

describe('reportBaselineUnknown', () => {
  const CURRENT_LAW_ID = 2;

  test('given a shared link whose baseline policy failed then the baseline is unknown', () => {
    expect(
      reportBaselineUnknown(null, '88', { currentLawId: CURRENT_LAW_ID, failedPolicyIds: ['88'] })
    ).toBe(true);
  });

  test('given the baseline policy loaded then the baseline is known', () => {
    expect(
      reportBaselineUnknown(null, '88', { currentLawId: CURRENT_LAW_ID, failedPolicyIds: ['99'] })
    ).toBe(false);
  });

  test('given current law failed to load then it is still current law', () => {
    expect(
      reportBaselineUnknown(null, '2', { currentLawId: CURRENT_LAW_ID, failedPolicyIds: ['2'] })
    ).toBe(false);
  });

  test('given the run recorded its baseline then a failed policy leaves it known', () => {
    expect(
      reportBaselineUnknown(PLAN_B_META, '88', {
        currentLawId: CURRENT_LAW_ID,
        failedPolicyIds: ['88'],
      })
    ).toBe(false);
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

describe('customBaseline', () => {
  const PLAN_B = { reformId: 'rf-plan-b', label: 'Plan B', parameters: PLAN_B_POLICY.parameters };

  test('given no baseline then the run compares with current law', () => {
    expect(customBaseline(undefined, 2)).toBeUndefined();
  });

  test('given a saved reform with parameters then the run compares with it', () => {
    expect(customBaseline(PLAN_B, 2)).toBe(PLAN_B);
  });

  test('given a saved reform that sets nothing then the run compares with current law', () => {
    expect(customBaseline({ ...PLAN_B, parameters: [] }, 2)).toBeUndefined();
  });

  test('given a baseline policy then current law itself is no custom baseline', () => {
    expect(customBaseline({ label: 'Plan B', policyId: 88 }, 2)).toEqual({
      label: 'Plan B',
      policyId: 88,
    });
    expect(customBaseline({ label: 'Current law', policyId: 2 }, 2)).toBeUndefined();
  });
});

describe('baselineProvisions', () => {
  test('given a saved reform then each parameter is a provision with its dated values', () => {
    expect(baselineProvisions({ parameters: PLAN_B_POLICY.parameters })).toEqual([
      {
        path: 'gov.irs.credits.ctc.amount.base[0].amount',
        value: 3000,
        intervals: PLAN_B_POLICY.parameters[0].values,
      },
    ]);
    expect(baselineProvisions({})).toEqual([]);
  });
});
