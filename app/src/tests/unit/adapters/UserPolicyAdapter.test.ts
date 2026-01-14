import { describe, expect, test } from 'vitest';
import { UserPolicyAdapter } from '@/adapters/UserPolicyAdapter';
import {
  mockUserPolicyApiResponse,
  mockUserPolicyCreationPayload,
  mockUserPolicyUS,
  mockUserPolicyWithoutOptionalFields,
  TEST_COUNTRIES,
  TEST_LABELS,
  TEST_POLICY_IDS,
  TEST_TIMESTAMPS,
  TEST_USER_IDS,
} from '@/tests/fixtures';
import { UserPolicy } from '@/types/ingredients/UserPolicy';

describe('UserPolicyAdapter', () => {
  describe('toCreationPayload', () => {
    test('given UserPolicy with all fields then creates proper payload', () => {
      // Given
      const userPolicy: Omit<UserPolicy, 'id' | 'createdAt'> = {
        userId: TEST_USER_IDS.USER_123,
        policyId: TEST_POLICY_IDS.POLICY_789,
        countryId: TEST_COUNTRIES.US,
        label: TEST_LABELS.MY_POLICY,
        updatedAt: TEST_TIMESTAMPS.UPDATED_AT,
        isCreated: true,
      };

      // When
      const result = UserPolicyAdapter.toCreationPayload(userPolicy);

      // Then
      expect(result).toEqual(mockUserPolicyCreationPayload);
    });

    test('given UserPolicy without label then creates payload without label', () => {
      // Given
      const userPolicy: Omit<UserPolicy, 'id' | 'createdAt'> = {
        userId: TEST_USER_IDS.USER_123,
        policyId: TEST_POLICY_IDS.POLICY_789,
        countryId: TEST_COUNTRIES.US,
        isCreated: true,
      };

      // When
      const result = UserPolicyAdapter.toCreationPayload(userPolicy);

      // Then
      expect(result.user_id).toBe(TEST_USER_IDS.USER_123);
      expect(result.policy_id).toBe(TEST_POLICY_IDS.POLICY_789);
      expect(result.country_id).toBe(TEST_COUNTRIES.US);
      expect(result.label).toBeUndefined();
    });

    test('given UserPolicy with numeric IDs then converts to strings', () => {
      // Given
      const userPolicy: Omit<UserPolicy, 'id' | 'createdAt'> = {
        userId: 123 as any,
        policyId: 456 as any,
        countryId: TEST_COUNTRIES.US,
        label: TEST_LABELS.MY_POLICY,
        isCreated: true,
      };

      // When
      const result = UserPolicyAdapter.toCreationPayload(userPolicy);

      // Then
      expect(result.user_id).toBe('123');
      expect(result.policy_id).toBe('456');
      expect(result.country_id).toBe(TEST_COUNTRIES.US);
    });

    test('given UserPolicy without label then includes undefined label', () => {
      // Given
      const userPolicy = mockUserPolicyWithoutOptionalFields;

      // When
      const result = UserPolicyAdapter.toCreationPayload(userPolicy);

      // Then
      expect(result.label).toBeUndefined();
      expect(result.country_id).toBe(TEST_COUNTRIES.US);
    });

    test('given UserPolicy with UK country then preserves country ID', () => {
      // Given
      const userPolicy: Omit<UserPolicy, 'id' | 'createdAt'> = {
        userId: TEST_USER_IDS.USER_123,
        policyId: TEST_POLICY_IDS.POLICY_ABC,
        countryId: TEST_COUNTRIES.UK,
        label: TEST_LABELS.MY_POLICY,
        isCreated: true,
      };

      // When
      const result = UserPolicyAdapter.toCreationPayload(userPolicy);

      // Then
      expect(result.country_id).toBe(TEST_COUNTRIES.UK);
    });
  });

  describe('fromApiResponse', () => {
    test('given API response with all fields then creates UserPolicy', () => {
      // Given
      const apiData = mockUserPolicyApiResponse;

      // When
      const result = UserPolicyAdapter.fromApiResponse(apiData);

      // Then
      expect(result).toEqual(mockUserPolicyUS);
    });

    test('given API response with null label then creates UserPolicy with undefined label', () => {
      // Given
      const apiData = {
        id: 'user-policy-456',
        policy_id: TEST_POLICY_IDS.POLICY_789,
        user_id: TEST_USER_IDS.USER_123,
        country_id: TEST_COUNTRIES.US,
        label: null,
        created_at: TEST_TIMESTAMPS.CREATED_AT,
        updated_at: TEST_TIMESTAMPS.UPDATED_AT,
      };

      // When
      const result = UserPolicyAdapter.fromApiResponse(apiData);

      // Then
      expect(result.id).toBe('user-policy-456');
      expect(result.userId).toBe(TEST_USER_IDS.USER_123);
      expect(result.policyId).toBe(TEST_POLICY_IDS.POLICY_789);
      expect(result.countryId).toBe(TEST_COUNTRIES.US);
      expect(result.label).toBeUndefined();
      expect(result.createdAt).toBe(TEST_TIMESTAMPS.CREATED_AT);
      expect(result.updatedAt).toBe(TEST_TIMESTAMPS.UPDATED_AT);
      expect(result.isCreated).toBe(true);
    });

    test('given API response with string id then preserves id', () => {
      // Given
      const apiData = {
        id: 'custom-association-id',
        policy_id: TEST_POLICY_IDS.POLICY_789,
        user_id: TEST_USER_IDS.USER_123,
        country_id: TEST_COUNTRIES.US,
        label: TEST_LABELS.MY_POLICY,
        created_at: TEST_TIMESTAMPS.CREATED_AT,
        updated_at: TEST_TIMESTAMPS.UPDATED_AT,
      };

      // When
      const result = UserPolicyAdapter.fromApiResponse(apiData);

      // Then
      expect(result.id).toBe('custom-association-id');
      expect(result.countryId).toBe(TEST_COUNTRIES.US);
    });

    test('given API response with UK country then preserves country ID', () => {
      // Given
      const apiData = {
        ...mockUserPolicyApiResponse,
        country_id: TEST_COUNTRIES.UK,
      };

      // When
      const result = UserPolicyAdapter.fromApiResponse(apiData);

      // Then
      expect(result.countryId).toBe(TEST_COUNTRIES.UK);
    });
  });
});
