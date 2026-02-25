import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchRegionByCode, fetchRegions } from '@/api/v2/regions';
import {
  mockErrorResponse,
  mockRegionList,
  mockSuccessResponse,
  mockV2Region,
  REGION_ERROR_MESSAGES,
  TEST_REGION_CODES,
} from '@/tests/fixtures/api/v2/regionMocks';
import { TEST_COUNTRIES } from '@/tests/fixtures/constants';

vi.mock('@/api/v2/taxBenefitModels', () => ({
  API_V2_BASE_URL: 'https://test-api.example.com',
  getModelName: (countryId: string) => 'policyengine-' + countryId,
}));

describe('regions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  // ==========================================================================
  // fetchRegions
  // ==========================================================================

  describe('fetchRegions', () => {
    test('given countryId then fetches with model name query param', async () => {
      // Given
      const regions = mockRegionList();
      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(regions) as unknown as Response);

      // When
      const result = await fetchRegions(TEST_COUNTRIES.US);

      // Then
      expect(fetch).toHaveBeenCalledWith(
        'https://test-api.example.com/regions/?tax_benefit_model_name=policyengine-us'
      );
      expect(result).toHaveLength(3);
    });

    test('given regionType then appends region_type param', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(
        mockSuccessResponse([mockV2Region()]) as unknown as Response
      );

      // When
      await fetchRegions(TEST_COUNTRIES.US, 'state');

      // Then
      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain('tax_benefit_model_name=policyengine-us');
      expect(calledUrl).toContain('region_type=state');
    });

    test('given no regionType then omits region_type param', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse([]) as unknown as Response);

      // When
      await fetchRegions(TEST_COUNTRIES.US);

      // Then
      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).not.toContain('region_type');
    });

    test('given error response then throws', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(mockErrorResponse(500) as unknown as Response);

      // When / Then
      await expect(fetchRegions(TEST_COUNTRIES.US)).rejects.toThrow(
        REGION_ERROR_MESSAGES.FETCH_FAILED(TEST_COUNTRIES.US)
      );
    });
  });

  // ==========================================================================
  // fetchRegionByCode
  // ==========================================================================

  describe('fetchRegionByCode', () => {
    test('given success then returns region data', async () => {
      // Given
      const region = mockV2Region();
      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(region) as unknown as Response);

      // When
      const result = await fetchRegionByCode(TEST_COUNTRIES.US, TEST_REGION_CODES.CALIFORNIA);

      // Then
      expect(fetch).toHaveBeenCalledWith(
        `https://test-api.example.com/regions/by-code/${encodeURIComponent(TEST_REGION_CODES.CALIFORNIA)}?tax_benefit_model_name=policyengine-us`
      );
      expect(result.code).toBe(TEST_REGION_CODES.CALIFORNIA);
      expect(result.label).toBe('California');
    });

    test('given 404 then throws "Region not found" error', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(mockErrorResponse(404) as unknown as Response);

      // When / Then
      await expect(fetchRegionByCode(TEST_COUNTRIES.US, 'nonexistent/region')).rejects.toThrow(
        REGION_ERROR_MESSAGES.NOT_FOUND('nonexistent/region')
      );
    });

    test('given other error then throws generic error', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(mockErrorResponse(500) as unknown as Response);

      // When / Then
      await expect(
        fetchRegionByCode(TEST_COUNTRIES.US, TEST_REGION_CODES.CALIFORNIA)
      ).rejects.toThrow(
        REGION_ERROR_MESSAGES.FETCH_BY_CODE_FAILED(TEST_REGION_CODES.CALIFORNIA, TEST_COUNTRIES.US)
      );
    });
  });
});
