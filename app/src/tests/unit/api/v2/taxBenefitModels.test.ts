import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  fetchModelByCountry,
  fetchModelVersion,
  fetchTaxBenefitModels,
  getModelName,
} from '@/api/v2/taxBenefitModels';
import {
  createMockModelVersion,
  createMockTaxBenefitModel,
  mockFetchError,
  mockFetchSequence,
  mockFetchSuccess,
  TEST_IDS,
} from '@/tests/fixtures/api/v2/shared';

vi.stubGlobal('fetch', vi.fn());

describe('taxBenefitModels', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  describe('getModelName', () => {
    test('given "us" then it returns "policyengine-us"', () => {
      // Given
      const countryId = 'us';

      // When
      const result = getModelName(countryId);

      // Then
      expect(result).toBe('policyengine-us');
    });

    test('given "uk" then it returns "policyengine-uk"', () => {
      // Given
      const countryId = 'uk';

      // When
      const result = getModelName(countryId);

      // Then
      expect(result).toBe('policyengine-uk');
    });

    test('given an invalid country then it throws an error', () => {
      // Given
      const countryId = 'invalid';

      // When / Then
      expect(() => getModelName(countryId)).toThrow('Unknown country: invalid');
    });
  });

  describe('fetchTaxBenefitModels', () => {
    test('given a successful response then it returns the models array', async () => {
      // Given
      const mockModels = [
        createMockTaxBenefitModel({ name: 'policyengine-us' }),
        createMockTaxBenefitModel({
          id: '660e8400-e29b-41d4-a716-446655440001',
          name: 'policyengine-uk',
        }),
      ];
      vi.stubGlobal('fetch', mockFetchSuccess(mockModels));

      // When
      const result = await fetchTaxBenefitModels();

      // Then
      expect(result).toEqual(mockModels);
      expect(fetch).toHaveBeenCalledOnce();
    });

    test('given an error response then it throws', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetchError(500, 'Internal Server Error'));

      // When / Then
      await expect(fetchTaxBenefitModels()).rejects.toThrow(
        'fetchTaxBenefitModels: 500 Internal Server Error'
      );
    });
  });

  describe('fetchModelByCountry', () => {
    test('given "us" and a successful response then it returns model and latest version', async () => {
      // Given
      const mockModel = createMockTaxBenefitModel({ name: 'policyengine-us' });
      const mockVersion = createMockModelVersion({
        model_id: mockModel.id,
        version: '2.0.0',
      });
      vi.stubGlobal(
        'fetch',
        mockFetchSequence([
          { ok: true, status: 200, data: [mockModel] },
          { ok: true, status: 200, data: [mockVersion] },
        ])
      );

      // When
      const result = await fetchModelByCountry('us');

      // Then
      expect(result.model).toEqual(mockModel);
      expect(result.latest_version).toEqual(mockVersion);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('given model not found then it throws', async () => {
      // Given
      vi.stubGlobal(
        'fetch',
        mockFetchSuccess([createMockTaxBenefitModel({ name: 'policyengine-uk' })])
      );

      // When / Then
      await expect(fetchModelByCountry('us')).rejects.toThrow('Model not found for country: us');
    });
  });

  describe('fetchModelVersion', () => {
    test('given "us" and a successful response then it returns the version string', async () => {
      // Given
      const mockModel = createMockTaxBenefitModel({
        id: TEST_IDS.MODEL_ID,
        name: 'policyengine-us',
      });
      const mockVersion = createMockModelVersion({
        model_id: TEST_IDS.MODEL_ID,
        version: '3.5.1',
      });
      vi.stubGlobal(
        'fetch',
        mockFetchSequence([
          { ok: true, status: 200, data: [mockModel] },
          { ok: true, status: 200, data: [mockVersion] },
        ])
      );

      // When
      const result = await fetchModelVersion('us');

      // Then
      expect(result).toBe('3.5.1');
    });

    test('given no versions found then it throws', async () => {
      // Given
      const mockModel = createMockTaxBenefitModel({
        id: TEST_IDS.MODEL_ID,
        name: 'policyengine-us',
      });
      vi.stubGlobal(
        'fetch',
        mockFetchSequence([
          { ok: true, status: 200, data: [mockModel] },
          { ok: true, status: 200, data: [] },
        ])
      );

      // When / Then
      await expect(fetchModelVersion('us')).rejects.toThrow('No versions found for us');
    });
  });
});
