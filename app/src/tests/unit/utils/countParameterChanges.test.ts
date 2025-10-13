import { describe, expect, test } from 'vitest';
import {
  mockPolicyWithEmptyParameter,
  mockPolicyWithMultipleParameters,
  mockPolicyWithNoJson,
  mockPolicyWithNullParameter,
  mockPolicyWithOneParameterMultipleRanges,
  mockPolicyWithOneParameterOneRange,
} from '@/tests/fixtures/utils/countParameterChangesMocks';
import { PolicyMetadata } from '@/types/metadata/policyMetadata';

// Helper function to count parameter changes in a policy
const countParameterChanges = (policy: PolicyMetadata | undefined): number => {
  if (!policy?.policy_json) {
    return 0;
  }

  let count = 0;

  for (const paramName in policy.policy_json) {
    count += policy.policy_json[paramName] ? Object.keys(policy.policy_json[paramName]).length : 0;
  }

  return count;
};

describe('countParameterChanges', () => {
  test('given undefined policy then returns 0', () => {
    // Given
    const policy = undefined;

    // When
    const result = countParameterChanges(policy);

    // Then
    expect(result).toBe(0);
  });

  test('given policy with no policy_json then returns 0', () => {
    // When
    const result = countParameterChanges(mockPolicyWithNoJson);

    // Then
    expect(result).toBe(0);
  });

  test('given policy with one parameter and one date range then returns 1', () => {
    // When
    const result = countParameterChanges(mockPolicyWithOneParameterOneRange);

    // Then
    expect(result).toBe(1);
  });

  test('given policy with one parameter and multiple date ranges then returns count of date ranges', () => {
    // When
    const result = countParameterChanges(mockPolicyWithOneParameterMultipleRanges);

    // Then
    expect(result).toBe(3);
  });

  test('given policy with multiple parameters then returns sum of all date ranges', () => {
    // When
    const result = countParameterChanges(mockPolicyWithMultipleParameters);

    // Then
    expect(result).toBe(6); // 2 + 3 + 1
  });

  test('given policy with parameter having null values then handles gracefully', () => {
    // When
    const result = countParameterChanges(mockPolicyWithNullParameter);

    // Then
    expect(result).toBe(0);
  });

  test('given policy with empty parameter object then returns 0', () => {
    // When
    const result = countParameterChanges(mockPolicyWithEmptyParameter);

    // Then
    expect(result).toBe(0);
  });
});
