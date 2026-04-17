import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchRegionByCode } from '@/api/v2/regions';
import { logMigrationComparison } from '@/libs/migration/comparisonLogger';
import { getResolvedDatasetId, getResolvedRegionId } from '@/libs/migration/idMapping';
import { sendMigrationLog } from '@/libs/migration/migrationLogTransport';
import {
  clearRegionShadowCachesForTest,
  shadowResolveRegionTarget,
} from '@/libs/migration/regionShadow';

vi.mock('@/api/v2/regions', () => ({
  fetchRegionByCode: vi.fn(),
}));

vi.mock('@/libs/migration/comparisonLogger', () => ({
  logMigrationComparison: vi.fn(),
}));

vi.mock('@/libs/migration/migrationLogRuntime', () => ({
  logMigrationConsole: vi.fn(),
}));

vi.mock('@/libs/migration/migrationLogTransport', () => ({
  sendMigrationLog: vi.fn(),
}));

describe('regionShadow', () => {
  beforeEach(() => {
    localStorage.clear();
    clearRegionShadowCachesForTest();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('given canonical region match then resolves region target and stores only region mapping', async () => {
    vi.mocked(fetchRegionByCode).mockResolvedValue({
      id: 'region-ca',
      code: 'state/ca',
      label: 'California',
      region_type: 'state',
      requires_filter: false,
      filter_field: null,
      filter_value: null,
      filter_strategy: null,
      parent_code: 'us',
      state_code: 'CA',
      state_name: 'California',
      tax_benefit_model_id: 'model-us',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    });

    const result = await shadowResolveRegionTarget({
      countryId: 'us',
      regionCode: 'ca',
      year: 2025,
      selectedLabel: 'California',
    });

    expect(result).toEqual({
      countryId: 'us',
      code: 'state/ca',
      regionId: 'region-ca',
      label: 'California',
      regionType: 'state',
      datasetId: null,
      year: null,
      filterField: null,
      filterValue: null,
      filterStrategy: null,
    });
    expect(getResolvedRegionId('us', 'state/ca')).toBe('region-ca');
    expect(getResolvedDatasetId('us', 'state/ca', '2025')).toBeNull();
    expect(logMigrationComparison).toHaveBeenCalledWith(
      'RegionMigration',
      'RESOLVE',
      expect.any(Object),
      expect.any(Object),
      expect.objectContaining({
        skipFields: expect.arrayContaining([
          'regionType',
          'filterField',
          'filterValue',
          'datasetYear',
          'datasetId',
          'filterStrategy',
        ]),
      })
    );
  });

  test('given missing region then logs skipped and returns null', async () => {
    vi.mocked(fetchRegionByCode).mockRejectedValue(new Error('Region not found: state/zz'));

    const result = await shadowResolveRegionTarget({
      countryId: 'us',
      regionCode: 'zz',
    });

    expect(result).toBeNull();
    expect(sendMigrationLog).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'event',
        prefix: 'RegionMigration',
        operation: 'RESOLVE',
        status: 'SKIPPED',
      })
    );
  });

  test('given filtered region metadata then preserves filter strategy from canonical record', async () => {
    vi.mocked(fetchRegionByCode).mockResolvedValue({
      id: 'region-district-de-00',
      code: 'congressional_district/DE-00',
      label: 'Delaware At-Large',
      region_type: 'congressional_district',
      requires_filter: true,
      filter_field: 'congressional_district',
      filter_value: 'DE-00',
      filter_strategy: 'weight_replacement',
      parent_code: 'us',
      state_code: 'DE',
      state_name: 'Delaware',
      tax_benefit_model_id: 'model-us',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    });

    const result = await shadowResolveRegionTarget({
      countryId: 'us',
      regionCode: 'DE-00',
    });

    expect(result?.filterStrategy).toBe('weight_replacement');
    expect(result?.filterField).toBe('congressional_district');
    expect(result?.filterValue).toBe('DE-00');
  });

  test('given repeated skipped resolution then it retries instead of caching null results', async () => {
    vi.mocked(fetchRegionByCode).mockRejectedValue(new Error('Region not found: state/zz'));

    const first = await shadowResolveRegionTarget({
      countryId: 'us',
      regionCode: 'zz',
    });
    const second = await shadowResolveRegionTarget({
      countryId: 'us',
      regionCode: 'zz',
    });

    expect(first).toBeNull();
    expect(second).toBeNull();
    expect(fetchRegionByCode).toHaveBeenCalledTimes(2);
    expect(sendMigrationLog).toHaveBeenCalledTimes(2);
  });
});
