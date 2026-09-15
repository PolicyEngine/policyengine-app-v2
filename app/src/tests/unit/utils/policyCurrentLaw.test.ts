import { describe, expect, test } from 'vitest';
import {
  createParameter,
  CURRENT_LAW_PARAMETERS,
  READY_POLICY_METADATA,
  TEST_PARAMETER_NAMES,
} from '@/tests/fixtures/utils/policyCurrentLawMocks';
import { comparePolicyToCurrentLaw } from '@/utils/policyCurrentLaw';

describe('comparePolicyToCurrentLaw', () => {
  test('given an unchanged default value then reports that the policy matches current law', () => {
    const result = comparePolicyToCurrentLaw(
      [createParameter(TEST_PARAMETER_NAMES.zeroAmount, '2026-01-01', '2100-12-31', 0)],
      READY_POLICY_METADATA,
      'us'
    );

    expect(result).toEqual({ status: 'matches-current-law' });
  });

  test('given a changed yearly value then reports that the policy differs from current law', () => {
    const parameter = createParameter(TEST_PARAMETER_NAMES.amount, '2026-01-01', '2026-12-31', 150);

    const result = comparePolicyToCurrentLaw([parameter], READY_POLICY_METADATA, 'us');

    expect(result).toEqual({ status: 'differs-from-current-law' });
  });

  test('given an unchanged date range then reports that the policy matches current law', () => {
    const result = comparePolicyToCurrentLaw(
      [createParameter(TEST_PARAMETER_NAMES.amount, '2026-04-12', '2026-08-19', 100)],
      READY_POLICY_METADATA,
      'us'
    );

    expect(result.status).toBe('matches-current-law');
  });

  test('given current law changes within a proposed interval then reports a difference', () => {
    const result = comparePolicyToCurrentLaw(
      [createParameter(TEST_PARAMETER_NAMES.amount, '2026-01-01', '2027-12-31', 100)],
      READY_POLICY_METADATA,
      'us'
    );

    expect(result).toEqual({ status: 'differs-from-current-law' });
  });

  test('given every interval follows a changing current-law schedule then reports a complete match', () => {
    const result = comparePolicyToCurrentLaw(
      [
        {
          name: TEST_PARAMETER_NAMES.amount,
          values: [
            { startDate: '2026-01-01', endDate: '2026-12-31', value: 100 },
            { startDate: '2027-01-01', endDate: '2027-12-31', value: 200 },
          ],
        },
      ],
      READY_POLICY_METADATA,
      'us'
    );

    expect(result).toEqual({ status: 'matches-current-law' });
  });

  test('given a multi-year schedule contains one differing interval then reports a difference', () => {
    const result = comparePolicyToCurrentLaw(
      [
        {
          name: TEST_PARAMETER_NAMES.amount,
          values: [
            { startDate: '2025-01-01', endDate: '2025-12-31', value: 100 },
            { startDate: '2026-01-01', endDate: '2026-12-31', value: 150 },
            { startDate: '2027-01-01', endDate: '2027-12-31', value: 200 },
          ],
        },
      ],
      READY_POLICY_METADATA,
      'us'
    );

    expect(result).toEqual({ status: 'differs-from-current-law' });
  });

  test('given Boolean and zero values match current law then reports a complete match', () => {
    const result = comparePolicyToCurrentLaw(
      [
        createParameter(TEST_PARAMETER_NAMES.booleanSetting, '2026-01-01', '2026-12-31', false),
        createParameter(TEST_PARAMETER_NAMES.zeroAmount, '2026-01-01', '2026-12-31', 0),
      ],
      READY_POLICY_METADATA,
      'us'
    );

    expect(result.status).toBe('matches-current-law');
  });

  test('given false differs from numeric zero then retains the Boolean interval', () => {
    const parameter = createParameter(
      TEST_PARAMETER_NAMES.zeroAmount,
      '2026-01-01',
      '2026-12-31',
      false
    );

    const result = comparePolicyToCurrentLaw([parameter], READY_POLICY_METADATA, 'us');

    expect(result).toEqual({ status: 'differs-from-current-law' });
  });

  test('given equivalent structured values with different key order then reports no changes', () => {
    const result = comparePolicyToCurrentLaw(
      [
        createParameter(TEST_PARAMETER_NAMES.structuredSetting, '2026-01-01', '2026-12-31', {
          variables: ['employment_income', 'self_employment_income'],
          enabled: true,
        }),
      ],
      READY_POLICY_METADATA,
      'us'
    );

    expect(result.status).toBe('matches-current-law');
  });

  test('given a one-day interval matches current law then reports a complete match', () => {
    const result = comparePolicyToCurrentLaw(
      [createParameter(TEST_PARAMETER_NAMES.amount, '2026-03-08', '2026-03-08', 100)],
      READY_POLICY_METADATA,
      'us'
    );

    expect(result.status).toBe('matches-current-law');
  });

  test.each([
    ['loading', { loading: true }],
    ['failed', { error: 'Metadata failed' }],
    ['for another country', { currentCountry: 'uk' }],
    ['without a model version', { version: null }],
    ['without a current-law policy', { currentLawId: 0 }],
  ])('given metadata is %s then reports that comparison is unavailable', (_label, patch) => {
    const result = comparePolicyToCurrentLaw(
      [createParameter(TEST_PARAMETER_NAMES.amount, '2026-01-01', '2026-12-31', 100)],
      { ...READY_POLICY_METADATA, ...patch },
      'us'
    );

    expect(result.status).toBe('unavailable');
  });

  test('given a parameter has no current-law metadata then reports comparison unavailable', () => {
    const result = comparePolicyToCurrentLaw(
      [createParameter(TEST_PARAMETER_NAMES.missing, '2026-01-01', '2026-12-31', 1)],
      READY_POLICY_METADATA,
      'us'
    );

    expect(result.status).toBe('unavailable');
  });

  test('given any current-law effective date is invalid then reports comparison unavailable', () => {
    const result = comparePolicyToCurrentLaw(
      [createParameter(TEST_PARAMETER_NAMES.amount, '2026-01-01', '2026-12-31', 100)],
      {
        ...READY_POLICY_METADATA,
        parameters: {
          ...CURRENT_LAW_PARAMETERS,
          [TEST_PARAMETER_NAMES.amount]: {
            ...CURRENT_LAW_PARAMETERS[TEST_PARAMETER_NAMES.amount],
            values: { '0000-01-01': 100, '2026-02-30': 200 },
          },
        },
      },
      'us'
    );

    expect(result.status).toBe('unavailable');
  });

  test('given current-law values begin after the proposal then reports comparison unavailable', () => {
    const result = comparePolicyToCurrentLaw(
      [createParameter(TEST_PARAMETER_NAMES.amount, '2026-01-01', '2026-12-31', 100)],
      {
        ...READY_POLICY_METADATA,
        parameters: {
          ...CURRENT_LAW_PARAMETERS,
          [TEST_PARAMETER_NAMES.amount]: {
            ...CURRENT_LAW_PARAMETERS[TEST_PARAMETER_NAMES.amount],
            values: { '2027-01-01': 200 },
          },
        },
      },
      'us'
    );

    expect(result.status).toBe('unavailable');
  });

  test('given a proposed interval is invalid then reports comparison unavailable', () => {
    const result = comparePolicyToCurrentLaw(
      [createParameter(TEST_PARAMETER_NAMES.amount, '2026-02-30', '2026-12-31', 100)],
      READY_POLICY_METADATA,
      'us'
    );

    expect(result.status).toBe('unavailable');
  });
});
