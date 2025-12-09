import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  fetchSocietyWideCalculation,
  getDatasetForRegion,
  getDistrictDatasetUrl,
  isUSCongressionalDistrict,
  US_DISTRICT_PREFIX,
} from '@/api/societyWideCalculation';
import { BASE_URL, CURRENT_YEAR } from '@/constants';
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  mockCompletedResponse,
  mockErrorCalculationResponse,
  mockErrorResponse,
  mockNetworkError,
  mockPendingResponse,
  mockSuccessResponse,
  TEST_COUNTRIES,
  TEST_POLICY_IDS,
  TEST_REGIONS,
  TEST_US_DISTRICTS,
  TEST_US_STATES,
} from '@/tests/fixtures/api/societyWideMocks';

global.fetch = vi.fn();

describe('societyWide API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchSocietyWideCalculation', () => {
    test('given valid parameters then fetches society-wide calculation successfully', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const params = { region: TEST_REGIONS.ENHANCED_US, time_period: CURRENT_YEAR };
      const mockResponse = mockSuccessResponse(mockCompletedResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await fetchSocietyWideCalculation(
        countryId,
        reformPolicyId,
        baselinePolicyId,
        params
      );

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}?region=${TEST_REGIONS.ENHANCED_US}&time_period=${CURRENT_YEAR}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockCompletedResponse);
    });

    test('given minimal params then constructs URL with required params', async () => {
      // Given
      const countryId = TEST_COUNTRIES.UK;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const params = { region: 'uk', time_period: CURRENT_YEAR };
      const mockResponse = mockSuccessResponse(mockPendingResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await fetchSocietyWideCalculation(
        countryId,
        reformPolicyId,
        baselinePolicyId,
        params
      );

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}?region=uk&time_period=${CURRENT_YEAR}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockPendingResponse);
    });

    test('given pending status then returns queue position and average time', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const mockResponse = mockSuccessResponse(mockPendingResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const params = { region: 'us', time_period: CURRENT_YEAR };
      const result = await fetchSocietyWideCalculation(
        countryId,
        reformPolicyId,
        baselinePolicyId,
        params
      );

      // Then
      expect(result.status).toBe('computing');
      expect(result.queue_position).toBe(5);
      expect(result.average_time).toBe(120);
      expect(result.result).toBeNull();
    });

    test('given completed status then returns calculation result', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const mockResponse = mockSuccessResponse(mockCompletedResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const params = { region: 'us', time_period: CURRENT_YEAR };
      const result = await fetchSocietyWideCalculation(
        countryId,
        reformPolicyId,
        baselinePolicyId,
        params
      );

      // Then
      expect(result.status).toBe('ok');
      expect(result.result).toBeDefined();
      expect(result.result?.budget.budgetary_impact).toBe(75000);
    });

    test('given error status then returns error message with null result', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const mockResponse = mockSuccessResponse(mockErrorCalculationResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const params = { region: 'us', time_period: CURRENT_YEAR };
      const result = await fetchSocietyWideCalculation(
        countryId,
        reformPolicyId,
        baselinePolicyId,
        params
      );

      // Then
      expect(result.status).toBe('error');
      expect(result.result).toBeNull();
      expect(result.error).toBe('Calculation failed due to invalid parameters');
    });

    test('given API returns HTTP error then throws error with status text', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.INVALID;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const mockResponse = mockErrorResponse(HTTP_STATUS.NOT_FOUND);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      const params = { region: 'us', time_period: CURRENT_YEAR };
      await expect(
        fetchSocietyWideCalculation(countryId, reformPolicyId, baselinePolicyId, params)
      ).rejects.toThrow(ERROR_MESSAGES.CALCULATION_FAILED('Not Found'));
    });

    test('given server error then throws generic error message', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const mockResponse = mockErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      const params = { region: 'us', time_period: CURRENT_YEAR };
      await expect(
        fetchSocietyWideCalculation(countryId, reformPolicyId, baselinePolicyId, params)
      ).rejects.toThrow(ERROR_MESSAGES.CALCULATION_FAILED('Error'));
    });

    test('given network error then propagates error', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      (global.fetch as any).mockRejectedValue(mockNetworkError);

      // When/Then
      const params = { region: 'us', time_period: CURRENT_YEAR };
      await expect(
        fetchSocietyWideCalculation(countryId, reformPolicyId, baselinePolicyId, params)
      ).rejects.toThrow(ERROR_MESSAGES.NETWORK_ERROR);
    });

    test('given params with undefined values then excludes them from query string', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const params = { region: undefined, time_period: CURRENT_YEAR } as any;
      const mockResponse = mockSuccessResponse(mockPendingResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      await fetchSocietyWideCalculation(countryId, reformPolicyId, baselinePolicyId, params);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}?time_period=${CURRENT_YEAR}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    });

    test('given different countries then constructs correct URLs', async () => {
      // Given
      const countries = Object.values(TEST_COUNTRIES);
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const mockResponse = mockSuccessResponse(mockPendingResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const params = { region: 'us', time_period: CURRENT_YEAR };
      for (const country of countries) {
        await fetchSocietyWideCalculation(country, reformPolicyId, baselinePolicyId, params);
      }

      // Then
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        `${BASE_URL}/${TEST_COUNTRIES.US}/economy/${reformPolicyId}/over/${baselinePolicyId}?region=us&time_period=${CURRENT_YEAR}&dataset=enhanced_cps`,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        `${BASE_URL}/${TEST_COUNTRIES.UK}/economy/${reformPolicyId}/over/${baselinePolicyId}?region=us&time_period=${CURRENT_YEAR}`,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        3,
        `${BASE_URL}/${TEST_COUNTRIES.CA}/economy/${reformPolicyId}/over/${baselinePolicyId}?region=us&time_period=${CURRENT_YEAR}`,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    test('given US nationwide then automatically adds enhanced_cps dataset', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const params = { region: 'us', time_period: CURRENT_YEAR };
      const mockResponse = mockSuccessResponse(mockCompletedResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      await fetchSocietyWideCalculation(countryId, reformPolicyId, baselinePolicyId, params);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}?region=us&time_period=${CURRENT_YEAR}&dataset=enhanced_cps`,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    test('given US state then does not add dataset parameter', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const params = { region: 'ca', time_period: CURRENT_YEAR };
      const mockResponse = mockSuccessResponse(mockCompletedResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      await fetchSocietyWideCalculation(countryId, reformPolicyId, baselinePolicyId, params);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}?region=ca&time_period=${CURRENT_YEAR}`,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    test('given UK then does not add dataset parameter', async () => {
      // Given
      const countryId = TEST_COUNTRIES.UK;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const params = { region: 'uk', time_period: CURRENT_YEAR };
      const mockResponse = mockSuccessResponse(mockPendingResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      await fetchSocietyWideCalculation(countryId, reformPolicyId, baselinePolicyId, params);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}?region=uk&time_period=${CURRENT_YEAR}`,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    test('given explicit dataset parameter then uses that instead of default', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const params = { region: 'us', time_period: CURRENT_YEAR, dataset: 'custom_dataset' };
      const mockResponse = mockSuccessResponse(mockCompletedResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      await fetchSocietyWideCalculation(countryId, reformPolicyId, baselinePolicyId, params);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}?region=us&time_period=${CURRENT_YEAR}&dataset=custom_dataset`,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });
  });

  describe('getDatasetForRegion', () => {
    test('given US country and US region then returns enhanced_cps', () => {
      // When
      const result = getDatasetForRegion('us', 'us');

      // Then
      expect(result).toBe('enhanced_cps');
    });

    test('given US country and state region then returns undefined', () => {
      // When
      const result = getDatasetForRegion('us', 'ca');

      // Then
      expect(result).toBeUndefined();
    });

    test('given UK country then returns undefined', () => {
      // When
      const result = getDatasetForRegion('uk', 'uk');

      // Then
      expect(result).toBeUndefined();
    });

    test('given CA country then returns undefined', () => {
      // When
      const result = getDatasetForRegion('ca', 'ca');

      // Then
      expect(result).toBeUndefined();
    });

    test('given US country and congressional district then returns HuggingFace URL', () => {
      // When
      const result = getDatasetForRegion('us', TEST_US_DISTRICTS.CA_01);

      // Then
      expect(result).toBe('hf://policyengine/policyengine-us-data/districts/CA-01.h5');
    });

    test('given US country and NY district then returns correct HuggingFace URL', () => {
      // When
      const result = getDatasetForRegion('us', TEST_US_DISTRICTS.NY_12);

      // Then
      expect(result).toBe('hf://policyengine/policyengine-us-data/districts/NY-12.h5');
    });
  });

  describe('isUSCongressionalDistrict', () => {
    test('given district region then returns true', () => {
      // When/Then
      expect(isUSCongressionalDistrict(TEST_US_DISTRICTS.CA_01)).toBe(true);
      expect(isUSCongressionalDistrict(TEST_US_DISTRICTS.NY_12)).toBe(true);
      expect(isUSCongressionalDistrict(TEST_US_DISTRICTS.TX_35)).toBe(true);
    });

    test('given state region then returns false', () => {
      // When/Then
      expect(isUSCongressionalDistrict(TEST_US_STATES.CA)).toBe(false);
      expect(isUSCongressionalDistrict(TEST_US_STATES.NY)).toBe(false);
    });

    test('given nationwide region then returns false', () => {
      // When/Then
      expect(isUSCongressionalDistrict('us')).toBe(false);
    });

    test('given undefined then returns false', () => {
      // When/Then
      expect(isUSCongressionalDistrict(undefined)).toBe(false);
    });

    test('given empty string then returns false', () => {
      // When/Then
      expect(isUSCongressionalDistrict('')).toBe(false);
    });
  });

  describe('getDistrictDatasetUrl', () => {
    test('given CA-01 district then returns correct HuggingFace URL', () => {
      // When
      const result = getDistrictDatasetUrl(TEST_US_DISTRICTS.CA_01);

      // Then
      expect(result).toBe('hf://policyengine/policyengine-us-data/districts/CA-01.h5');
    });

    test('given NY-12 district then returns correct HuggingFace URL', () => {
      // When
      const result = getDistrictDatasetUrl(TEST_US_DISTRICTS.NY_12);

      // Then
      expect(result).toBe('hf://policyengine/policyengine-us-data/districts/NY-12.h5');
    });

    test('given at-large district then returns correct HuggingFace URL', () => {
      // When
      const result = getDistrictDatasetUrl(TEST_US_DISTRICTS.AK_01);

      // Then
      expect(result).toBe('hf://policyengine/policyengine-us-data/districts/AK-01.h5');
    });
  });

  describe('US_DISTRICT_PREFIX', () => {
    test('has correct value', () => {
      // Then
      expect(US_DISTRICT_PREFIX).toBe('district/');
    });
  });
});
