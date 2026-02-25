import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchAnalysisOptions } from '@/api/v2/analysisOptions';
import {
  ANALYSIS_OPTIONS_ERROR_MESSAGES,
  mockErrorResponse,
  mockModuleOptionList,
  mockSuccessResponse,
} from '@/tests/fixtures/api/v2/analysisOptionsMocks';
import { TEST_COUNTRIES } from '@/tests/fixtures/constants';

vi.mock('@/api/v2/taxBenefitModels', () => ({
  API_V2_BASE_URL: 'https://test-api.example.com',
  getModelName: (countryId: string) => 'policyengine-' + countryId,
}));

describe('analysisOptions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  // ==========================================================================
  // fetchAnalysisOptions
  // ==========================================================================

  describe('fetchAnalysisOptions', () => {
    test('given no country then fetches without params', async () => {
      // Given
      const modules = mockModuleOptionList();
      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(modules) as unknown as Response);

      // When
      await fetchAnalysisOptions();

      // Then
      expect(fetch).toHaveBeenCalledWith('https://test-api.example.com/analysis/options', {
        headers: { Accept: 'application/json' },
      });
    });

    test('given country then fetches with country param', async () => {
      // Given
      const modules = mockModuleOptionList();
      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(modules) as unknown as Response);

      // When
      await fetchAnalysisOptions(TEST_COUNTRIES.US);

      // Then
      expect(fetch).toHaveBeenCalledWith(
        `https://test-api.example.com/analysis/options?country=${TEST_COUNTRIES.US}`,
        { headers: { Accept: 'application/json' } }
      );
    });

    test('given success then returns module list', async () => {
      // Given
      const modules = mockModuleOptionList();
      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(modules) as unknown as Response);

      // When
      const result = await fetchAnalysisOptions(TEST_COUNTRIES.US);

      // Then
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('decile_impacts');
      expect(result[1].name).toBe('poverty');
      expect(result[2].name).toBe('inequality');
    });

    test('given error then throws', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(
        mockErrorResponse(500, 'Server error') as unknown as Response
      );

      // When / Then
      await expect(fetchAnalysisOptions(TEST_COUNTRIES.US)).rejects.toThrow(
        ANALYSIS_OPTIONS_ERROR_MESSAGES.FETCH_FAILED(500, 'Server error')
      );
    });
  });
});
