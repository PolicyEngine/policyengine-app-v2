import { describe, expect, test, vi } from 'vitest';
import {
  baselineWithout,
  parametersWithout,
  provisionsWithout,
} from '@/libs/flagship/missingParameterTransfer';
import {
  REMOVED_US_PARAMETER,
  v1PolicyContent,
} from '@/tests/fixtures/libs/flagship/missingParametersMocks';
import {
  KEPT_PARAMETER,
  KEPT_PARAMETER_CHANGE,
  KEPT_PROVISION,
  REMOVED_PARAMETER_CHANGE,
  REMOVED_PROVISION,
} from '@/tests/fixtures/libs/flagship/missingParameterTransferMocks';

const BASELINE_POLICY_ID = 88;

describe('parametersWithout', () => {
  test('given a missing parameter then only the other changes remain, in order', () => {
    expect(
      parametersWithout([REMOVED_PARAMETER_CHANGE, KEPT_PARAMETER_CHANGE], [REMOVED_US_PARAMETER])
    ).toEqual([KEPT_PARAMETER_CHANGE]);
  });

  test('given only missing parameters then nothing remains', () => {
    expect(parametersWithout([REMOVED_PARAMETER_CHANGE], [REMOVED_US_PARAMETER])).toEqual([]);
  });
});

describe('provisionsWithout', () => {
  test('given a missing parameter then only the other provisions remain', () => {
    expect(provisionsWithout([KEPT_PROVISION, REMOVED_PROVISION], [REMOVED_US_PARAMETER])).toEqual([
      KEPT_PROVISION,
    ]);
  });
});

describe('baselineWithout', () => {
  test('given a baseline policy that sets no missing parameter then it is kept as it is', async () => {
    // Given
    const baseline = { reformId: 'rf-plan-b', label: 'Plan B', policyId: BASELINE_POLICY_ID };
    const readPolicy = vi
      .fn()
      .mockResolvedValue(
        v1PolicyContent({ [KEPT_PARAMETER]: { '2026-01-01.2100-12-31': 3600 } }, [])
      );

    // When
    const result = await baselineWithout(baseline, [REMOVED_US_PARAMETER], readPolicy);

    // Then
    expect(readPolicy).toHaveBeenCalledWith(String(BASELINE_POLICY_ID));
    expect(result).toEqual(baseline);
  });

  test('given a baseline policy that sets a missing parameter then its other parameters make the new baseline', async () => {
    // Given
    const readPolicy = vi.fn().mockResolvedValue(
      v1PolicyContent(
        {
          [KEPT_PARAMETER]: { '2026-01-01.2100-12-31': 3600 },
          [REMOVED_US_PARAMETER]: { '2026-01-01.2100-12-31': 0 },
        },
        [REMOVED_US_PARAMETER]
      )
    );

    // When
    const result = await baselineWithout(
      { reformId: 'rf-plan-b', label: 'Plan B', policyId: BASELINE_POLICY_ID },
      [REMOVED_US_PARAMETER],
      readPolicy
    );

    // Then: no policy ID, so the run makes the baseline policy from these
    expect(result).toEqual({
      reformId: 'rf-plan-b',
      label: 'Plan B',
      parameters: [
        {
          name: KEPT_PARAMETER,
          values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3600 }],
        },
      ],
    });
  });

  test('given a baseline policy that sets only missing parameters then nothing remains', async () => {
    // Given
    const readPolicy = vi
      .fn()
      .mockResolvedValue(
        v1PolicyContent({ [REMOVED_US_PARAMETER]: { '2026-01-01.2100-12-31': 0 } }, [
          REMOVED_US_PARAMETER,
        ])
      );

    // When
    const result = await baselineWithout(
      { reformId: 'rf-plan-b', label: 'Plan B', policyId: BASELINE_POLICY_ID },
      [REMOVED_US_PARAMETER],
      readPolicy
    );

    // Then
    expect(result).toBeNull();
  });

  test('given a baseline of parameters with no policy yet then the missing ones are left out', async () => {
    // Given
    const readPolicy = vi.fn();

    // When
    const result = await baselineWithout(
      {
        reformId: 'rf-plan-b',
        label: 'Plan B',
        parameters: [KEPT_PARAMETER_CHANGE, REMOVED_PARAMETER_CHANGE],
      },
      [REMOVED_US_PARAMETER],
      readPolicy
    );

    // Then
    expect(result).toEqual({
      reformId: 'rf-plan-b',
      label: 'Plan B',
      parameters: [KEPT_PARAMETER_CHANGE],
    });
    expect(readPolicy).not.toHaveBeenCalled();
  });

  test('given the baseline policy cannot be read then it fails', async () => {
    // Given
    const readPolicy = vi.fn().mockRejectedValue(new Error('Failed to fetch policy 88'));

    // When / Then
    await expect(
      baselineWithout(
        { reformId: 'rf-plan-b', label: 'Plan B', policyId: BASELINE_POLICY_ID },
        [REMOVED_US_PARAMETER],
        readPolicy
      )
    ).rejects.toThrow('Failed to fetch policy 88');
  });
});
