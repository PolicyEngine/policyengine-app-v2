import { describe, expect, test, vi, beforeEach } from 'vitest';
import { fetchHouseholdVariation, fetchHouseholdVariationV2 } from '@/api/householdVariation';
import { HouseholdWithAxes } from '@/utils/householdVariationAxes';
import {
  MOCK_HOUSEHOLD_WITH_AXES,
  MOCK_POLICY_DATA,
  MOCK_VARIATION_SUCCESS_RESPONSE,
  mockFetchSuccess,
  mockFetchHttpError,
  mockFetchApiError,
  mockFetchNullResult,
  mockFetchAbort,
} from '@/tests/fixtures/api/householdVariationMocks';

describe('householdVariation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('fetchHouseholdVariation', () => {
    test('given successful response then returns result data', async () => {
      mockFetchSuccess();

      const result = await fetchHouseholdVariation('us', MOCK_HOUSEHOLD_WITH_AXES, MOCK_POLICY_DATA);

      expect(result).toEqual(MOCK_VARIATION_SUCCESS_RESPONSE.result);
    });

    test('given successful response then sends POST to correct URL', async () => {
      const fetchSpy = mockFetchSuccess();

      await fetchHouseholdVariation('us', MOCK_HOUSEHOLD_WITH_AXES, MOCK_POLICY_DATA);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/us/calculate-full'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    test('given successful response then sends v1-format household with axes in body', async () => {
      const fetchSpy = mockFetchSuccess();

      await fetchHouseholdVariation('us', MOCK_HOUSEHOLD_WITH_AXES, MOCK_POLICY_DATA);

      const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);

      // Should contain v1-format people (keyed by name, year-wrapped values)
      expect(body.household.people.you.age).toEqual({ '2024': 30 });
      // Should contain axes
      expect(body.household.axes).toEqual(MOCK_HOUSEHOLD_WITH_AXES.axes);
      // Should contain policy
      expect(body.policy).toEqual(MOCK_POLICY_DATA);
    });

    test('given HTTP error then throws with status info', async () => {
      mockFetchHttpError(500, 'Internal Server Error', 'Server crashed');

      await expect(
        fetchHouseholdVariation('us', MOCK_HOUSEHOLD_WITH_AXES, MOCK_POLICY_DATA)
      ).rejects.toThrow('Variation calculation failed: 500 Internal Server Error');
    });

    test('given HTTP error with JSON body then extracts error message', async () => {
      mockFetchHttpError(400, 'Bad Request', JSON.stringify({ message: 'Invalid household data' }));

      await expect(
        fetchHouseholdVariation('us', MOCK_HOUSEHOLD_WITH_AXES, MOCK_POLICY_DATA)
      ).rejects.toThrow('Invalid household data');
    });

    test('given API returns error status then throws', async () => {
      mockFetchApiError();

      await expect(
        fetchHouseholdVariation('us', MOCK_HOUSEHOLD_WITH_AXES, MOCK_POLICY_DATA)
      ).rejects.toThrow('Calculation engine error');
    });

    test('given API returns null result then throws', async () => {
      mockFetchNullResult();

      await expect(
        fetchHouseholdVariation('us', MOCK_HOUSEHOLD_WITH_AXES, MOCK_POLICY_DATA)
      ).rejects.toThrow('Household variation calculation failed');
    });

    test('given fetch abort then throws timeout error', async () => {
      mockFetchAbort();

      await expect(
        fetchHouseholdVariation('us', MOCK_HOUSEHOLD_WITH_AXES, MOCK_POLICY_DATA)
      ).rejects.toThrow('timed out after 10 minutes');
    });
  });

  describe('fetchHouseholdVariationV2', () => {
    test('given US household then extracts country id and delegates', async () => {
      const fetchSpy = mockFetchSuccess();

      await fetchHouseholdVariationV2(MOCK_HOUSEHOLD_WITH_AXES, MOCK_POLICY_DATA);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/us/calculate-full'),
        expect.any(Object)
      );
    });

    test('given UK household then uses uk country id', async () => {
      const ukHousehold: HouseholdWithAxes = {
        ...MOCK_HOUSEHOLD_WITH_AXES,
        tax_benefit_model_name: 'policyengine_uk',
      };

      const fetchSpy = mockFetchSuccess();

      await fetchHouseholdVariationV2(ukHousehold, MOCK_POLICY_DATA);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/uk/calculate-full'),
        expect.any(Object)
      );
    });
  });
});
