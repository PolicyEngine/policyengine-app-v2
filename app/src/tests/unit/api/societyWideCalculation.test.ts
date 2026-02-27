import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getDatasetIdForRegion } from '@/api/societyWideCalculation';
import { fetchRegionByCode } from '@/api/v2/regions';

const MOCK_DATASET_UUID = '00000000-0000-4000-a000-000000000001';

vi.mock('@/api/v2/regions', () => ({
  fetchRegionByCode: vi.fn(),
}));

const mockFetchRegionByCode = vi.mocked(fetchRegionByCode);

describe('societyWide API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDatasetIdForRegion', () => {
    test('given region exists then returns its dataset_id', async () => {
      // Given
      mockFetchRegionByCode.mockResolvedValue({
        id: 'region-1',
        code: 'us',
        label: 'United States',
        region_type: 'country',
        requires_filter: false,
        filter_field: null,
        filter_value: null,
        parent_code: null,
        state_code: null,
        state_name: null,
        dataset_id: MOCK_DATASET_UUID,
        tax_benefit_model_id: 'model-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      // When
      const result = await getDatasetIdForRegion('us', 'us');

      // Then
      expect(result).toBe(MOCK_DATASET_UUID);
      expect(mockFetchRegionByCode).toHaveBeenCalledWith('us', 'us');
    });

    test('given region lookup fails then returns null', async () => {
      // Given
      mockFetchRegionByCode.mockRejectedValue(new Error('Region not found'));

      // When
      const result = await getDatasetIdForRegion('us', 'unknown');

      // Then
      expect(result).toBeNull();
    });
  });
});
