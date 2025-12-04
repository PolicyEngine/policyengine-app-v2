import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchSocietyWideCalculation, getDatasetForRegion } from '@/api/societyWideCalculation';
import { BASE_URL, CURRENT_YEAR } from '@/constants';
import {
  ERROR_MESSAGES,
  getStateDatasetUrl,
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

      // Then - enhanced_us should add enhanced_cps dataset
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}?region=${TEST_REGIONS.ENHANCED_US}&time_period=${CURRENT_YEAR}&dataset=enhanced_cps`,
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

    test('given US state then adds state-specific dataset URL', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const stateCode = TEST_US_STATES.CA;
      const params = { region: stateCode, time_period: CURRENT_YEAR };
      const mockResponse = mockSuccessResponse(mockCompletedResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      await fetchSocietyWideCalculation(countryId, reformPolicyId, baselinePolicyId, params);

      // Then
      const expectedDataset = encodeURIComponent(getStateDatasetUrl(stateCode));
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}?region=${stateCode}&time_period=${CURRENT_YEAR}&dataset=${expectedDataset}`,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    test('given different US states then uses correct state-specific dataset URLs', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const mockResponse = mockSuccessResponse(mockCompletedResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When - test multiple states
      const states = [TEST_US_STATES.CA, TEST_US_STATES.NY, TEST_US_STATES.TX, TEST_US_STATES.UT];
      for (const stateCode of states) {
        await fetchSocietyWideCalculation(countryId, reformPolicyId, baselinePolicyId, {
          region: stateCode,
          time_period: CURRENT_YEAR,
        });
      }

      // Then - verify each state gets its own dataset URL
      states.forEach((stateCode, index) => {
        const expectedDataset = encodeURIComponent(getStateDatasetUrl(stateCode));
        expect(global.fetch).toHaveBeenNthCalledWith(
          index + 1,
          `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}?region=${stateCode}&time_period=${CURRENT_YEAR}&dataset=${expectedDataset}`,
          expect.objectContaining({
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
      });
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

    test('given US country and state region then returns state-specific dataset URL', () => {
      // When
      const result = getDatasetForRegion('us', 'ca');

      // Then
      expect(result).toBe('hf://policyengine/policyengine-us-data/states/CA.h5');
    });

    test('given US country and various state regions then returns correct uppercase state URLs', () => {
      // When/Then - test multiple states
      expect(getDatasetForRegion('us', 'ca')).toBe(
        'hf://policyengine/policyengine-us-data/states/CA.h5'
      );
      expect(getDatasetForRegion('us', 'ny')).toBe(
        'hf://policyengine/policyengine-us-data/states/NY.h5'
      );
      expect(getDatasetForRegion('us', 'tx')).toBe(
        'hf://policyengine/policyengine-us-data/states/TX.h5'
      );
      expect(getDatasetForRegion('us', 'ut')).toBe(
        'hf://policyengine/policyengine-us-data/states/UT.h5'
      );
    });

    test('given US country and enhanced_us region then returns enhanced_cps', () => {
      // When
      const result = getDatasetForRegion('us', 'enhanced_us');

      // Then
      expect(result).toBe('enhanced_cps');
    });

    test('given US country and nyc region then returns state-specific dataset URL for NYC', () => {
      // When
      const result = getDatasetForRegion('us', 'nyc');

      // Then
      expect(result).toBe('hf://policyengine/policyengine-us-data/states/NYC.h5');
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
  });
});
