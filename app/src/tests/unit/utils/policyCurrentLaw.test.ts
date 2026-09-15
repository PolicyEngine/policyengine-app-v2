import { describe, expect, test } from 'vitest';
import {
  createParameter,
  CURRENT_LAW_PARAMETERS,
  READY_POLICY_METADATA,
  TEST_PARAMETER_NAMES,
} from '@/tests/fixtures/utils/policyCurrentLawMocks';
import { isPolicyDuplicateOfCurrentLaw } from '@/utils/policyCurrentLaw';

describe('isPolicyDuplicateOfCurrentLaw', () => {
  test('given an unchanged default value then reports that the policy matches current law', () => {
    const result = isPolicyDuplicateOfCurrentLaw(
      [createParameter(TEST_PARAMETER_NAMES.zeroAmount, '2026-01-01', '2100-12-31', 0)],
      READY_POLICY_METADATA,
      'us'
    );

    expect(result).toBe(true);
  });

  test('given a changed yearly value then reports that the policy differs from current law', () => {
    const parameter = createParameter(TEST_PARAMETER_NAMES.amount, '2026-01-01', '2026-12-31', 150);

    const result = isPolicyDuplicateOfCurrentLaw([parameter], READY_POLICY_METADATA, 'us');

    expect(result).toBe(false);
  });

  test('given an unchanged date range then reports that the policy matches current law', () => {
    const result = isPolicyDuplicateOfCurrentLaw(
      [createParameter(TEST_PARAMETER_NAMES.amount, '2026-04-12', '2026-08-19', 100)],
      READY_POLICY_METADATA,
      'us'
    );

    expect(result).toBe(true);
  });

  test('given current law changes within a proposed interval then reports a difference', () => {
    const result = isPolicyDuplicateOfCurrentLaw(
      [createParameter(TEST_PARAMETER_NAMES.amount, '2026-01-01', '2027-12-31', 100)],
      READY_POLICY_METADATA,
      'us'
    );

    expect(result).toBe(false);
  });

  test('given every interval follows a changing current-law schedule then reports a complete match', () => {
    const result = isPolicyDuplicateOfCurrentLaw(
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

    expect(result).toBe(true);
  });

  test('given a multi-year schedule contains one differing interval then reports a difference', () => {
    const result = isPolicyDuplicateOfCurrentLaw(
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

    expect(result).toBe(false);
  });

  test('given Boolean and zero values match current law then reports a complete match', () => {
    const result = isPolicyDuplicateOfCurrentLaw(
      [
        createParameter(TEST_PARAMETER_NAMES.booleanSetting, '2026-01-01', '2026-12-31', false),
        createParameter(TEST_PARAMETER_NAMES.zeroAmount, '2026-01-01', '2026-12-31', 0),
      ],
      READY_POLICY_METADATA,
      'us'
    );

    expect(result).toBe(true);
  });

  test('given false differs from numeric zero then returns false', () => {
    const parameter = createParameter(
      TEST_PARAMETER_NAMES.zeroAmount,
      '2026-01-01',
      '2026-12-31',
      false
    );

    const result = isPolicyDuplicateOfCurrentLaw([parameter], READY_POLICY_METADATA, 'us');

    expect(result).toBe(false);
  });

  test('given equivalent structured values with different key order then reports no changes', () => {
    const result = isPolicyDuplicateOfCurrentLaw(
      [
        createParameter(TEST_PARAMETER_NAMES.structuredSetting, '2026-01-01', '2026-12-31', {
          variables: ['employment_income', 'self_employment_income'],
          enabled: true,
        }),
      ],
      READY_POLICY_METADATA,
      'us'
    );

    expect(result).toBe(true);
  });

  test('given a one-day interval matches current law then reports a complete match', () => {
    const result = isPolicyDuplicateOfCurrentLaw(
      [createParameter(TEST_PARAMETER_NAMES.amount, '2026-03-08', '2026-03-08', 100)],
      READY_POLICY_METADATA,
      'us'
    );

    expect(result).toBe(true);
  });

  test.each([
    ['loading', { loading: true }],
    ['failed', { error: 'Metadata failed' }],
    ['for another country', { currentCountry: 'uk' }],
    ['without a model version', { version: null }],
    ['without a current-law policy', { currentLawId: 0 }],
  ])('given metadata is %s then does not classify the policy as a duplicate', (_label, patch) => {
    const result = isPolicyDuplicateOfCurrentLaw(
      [createParameter(TEST_PARAMETER_NAMES.amount, '2026-01-01', '2026-12-31', 100)],
      { ...READY_POLICY_METADATA, ...patch },
      'us'
    );

    expect(result).toBe(false);
  });

  test('given a parameter has no current-law metadata then returns false', () => {
    const result = isPolicyDuplicateOfCurrentLaw(
      [createParameter(TEST_PARAMETER_NAMES.missing, '2026-01-01', '2026-12-31', 1)],
      READY_POLICY_METADATA,
      'us'
    );

    expect(result).toBe(false);
  });

  test('given any current-law effective date is invalid then returns false', () => {
    const result = isPolicyDuplicateOfCurrentLaw(
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

    expect(result).toBe(false);
  });

  test('given current-law values begin after the proposal then returns false', () => {
    const result = isPolicyDuplicateOfCurrentLaw(
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

    expect(result).toBe(false);
  });

  test('given a proposed interval is invalid then returns false', () => {
    const result = isPolicyDuplicateOfCurrentLaw(
      [createParameter(TEST_PARAMETER_NAMES.amount, '2026-02-30', '2026-12-31', 100)],
      READY_POLICY_METADATA,
      'us'
    );

    expect(result).toBe(false);
  });
});
