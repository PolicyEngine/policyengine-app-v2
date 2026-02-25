import { describe, expect, test } from 'vitest';
import { UserHouseholdAdapter } from '@/adapters/UserHouseholdAdapter';
import { TEST_COUNTRIES, TEST_TIMESTAMPS, TEST_USER_IDS } from '@/tests/fixtures/constants';
import type { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';

const TEST_HOUSEHOLD_ID = 'hh-001';
const TEST_LABEL = 'My Household';

const mockUserHousehold: UserHouseholdPopulation = {
  type: 'household',
  id: 'assoc-001',
  userId: TEST_USER_IDS.USER_123,
  householdId: TEST_HOUSEHOLD_ID,
  countryId: TEST_COUNTRIES.US,
  label: TEST_LABEL,
  createdAt: TEST_TIMESTAMPS.CREATED_AT,
  updatedAt: TEST_TIMESTAMPS.UPDATED_AT,
  isCreated: true,
};

const mockApiData = {
  user_id: TEST_USER_IDS.USER_123,
  household_id: TEST_HOUSEHOLD_ID,
  country_id: TEST_COUNTRIES.US,
  label: TEST_LABEL,
  created_at: TEST_TIMESTAMPS.CREATED_AT,
  updated_at: TEST_TIMESTAMPS.UPDATED_AT,
};

describe('UserHouseholdAdapter', () => {
  describe('toCreationPayload', () => {
    test('given household then converts to snake_case API format', () => {
      const result = UserHouseholdAdapter.toCreationPayload(mockUserHousehold);
      expect(result.user_id).toBe(TEST_USER_IDS.USER_123);
      expect(result.household_id).toBe(TEST_HOUSEHOLD_ID);
      expect(result.country_id).toBe(TEST_COUNTRIES.US);
      expect(result.label).toBe(TEST_LABEL);
    });

    test('given household with updatedAt then uses it', () => {
      const result = UserHouseholdAdapter.toCreationPayload(mockUserHousehold);
      expect(result.updated_at).toBe(TEST_TIMESTAMPS.UPDATED_AT);
    });

    test('given household without updatedAt then uses current ISO string', () => {
      const noUpdatedAt = { ...mockUserHousehold, updatedAt: undefined };
      const result = UserHouseholdAdapter.toCreationPayload(noUpdatedAt);
      // Should be an ISO date string (not undefined)
      expect(result.updated_at).toBeDefined();
      expect(typeof result.updated_at).toBe('string');
    });
  });

  describe('fromApiResponse', () => {
    test('given API data then converts to app format', () => {
      const result = UserHouseholdAdapter.fromApiResponse(mockApiData);
      expect(result.type).toBe('household');
      expect(result.userId).toBe(TEST_USER_IDS.USER_123);
      expect(result.householdId).toBe(TEST_HOUSEHOLD_ID);
      expect(result.countryId).toBe(TEST_COUNTRIES.US);
      expect(result.isCreated).toBe(true);
    });

    test('given numeric IDs then coerces to strings', () => {
      const numericData = { ...mockApiData, user_id: 12345, household_id: 67890 };
      const result = UserHouseholdAdapter.fromApiResponse(numericData);
      expect(result.userId).toBe('12345');
      expect(result.householdId).toBe('67890');
      expect(result.id).toBe('67890');
    });

    test('given API data then sets id from household_id', () => {
      const result = UserHouseholdAdapter.fromApiResponse(mockApiData);
      expect(result.id).toBe(TEST_HOUSEHOLD_ID);
    });
  });
});
