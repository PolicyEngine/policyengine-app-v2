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

    test('given UserPolicy without updatedAt then generates timestamp', () => {
      // Given
      const userPolicy: Omit<UserPolicy, 'id' | 'createdAt'> = {
        userId: TEST_USER_IDS.USER_123,
        policyId: TEST_POLICY_IDS.POLICY_789,
        countryId: TEST_COUNTRIES.US,
        label: TEST_LABELS.MY_POLICY,
        isCreated: true,
      };

      // When
      const result = UserPolicyAdapter.toCreationPayload(userPolicy);

      // Then
      expect(result.userId).toBe(TEST_USER_IDS.USER_123);
      expect(result.policyId).toBe(TEST_POLICY_IDS.POLICY_789);
      expect(result.countryId).toBe(TEST_COUNTRIES.US);
      expect(result.label).toBe(TEST_LABELS.MY_POLICY);
      expect(result.updatedAt).toBeDefined();
      expect(new Date(result.updatedAt as string).toISOString()).toBe(result.updatedAt);
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
      expect(result.userId).toBe('123');
      expect(result.policyId).toBe('456');
      expect(result.countryId).toBe(TEST_COUNTRIES.US);
    });

    test('given UserPolicy without label then includes undefined label', () => {
      // Given
      const userPolicy = mockUserPolicyWithoutOptionalFields;

      // When
      const result = UserPolicyAdapter.toCreationPayload(userPolicy);

      // Then
      expect(result.label).toBeUndefined();
      expect(result.countryId).toBe(TEST_COUNTRIES.US);
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
      expect(result.countryId).toBe(TEST_COUNTRIES.UK);
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

    test('given API response without optional fields then creates UserPolicy with defaults', () => {
      // Given
      const apiData = {
        policyId: TEST_POLICY_IDS.POLICY_789,
        userId: TEST_USER_IDS.USER_123,
        countryId: TEST_COUNTRIES.US,
      };

      // When
      const result = UserPolicyAdapter.fromApiResponse(apiData);

      // Then
      expect(result.id).toBe(TEST_POLICY_IDS.POLICY_789);
      expect(result.userId).toBe(TEST_USER_IDS.USER_123);
      expect(result.policyId).toBe(TEST_POLICY_IDS.POLICY_789);
      expect(result.countryId).toBe(TEST_COUNTRIES.US);
      expect(result.label).toBeUndefined();
      expect(result.createdAt).toBeUndefined();
      expect(result.updatedAt).toBeUndefined();
      expect(result.isCreated).toBe(true);
    });

    test('given API response with null label then preserves null', () => {
      // Given
      const apiData = {
        policyId: TEST_POLICY_IDS.POLICY_789,
        userId: TEST_USER_IDS.USER_123,
        countryId: TEST_COUNTRIES.US,
        label: null,
        createdAt: TEST_TIMESTAMPS.CREATED_AT,
        updatedAt: TEST_TIMESTAMPS.UPDATED_AT,
      };

      // When
      const result = UserPolicyAdapter.fromApiResponse(apiData);

      // Then
      expect(result.label).toBeNull();
      expect(result.countryId).toBe(TEST_COUNTRIES.US);
    });

    test('given API response with UK country then preserves country ID', () => {
      // Given
      const apiData = {
        ...mockUserPolicyApiResponse,
        countryId: TEST_COUNTRIES.UK,
      };

      // When
      const result = UserPolicyAdapter.fromApiResponse(apiData);

      // Then
      expect(result.countryId).toBe(TEST_COUNTRIES.UK);
    });
  });
});
