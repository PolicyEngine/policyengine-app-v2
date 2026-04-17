import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchDatasets } from '@/api/v2/datasets';
import { fetchRegionByCode } from '@/api/v2/regions';
import { logMigrationComparison } from '@/libs/migration/comparisonLogger';
import { getResolvedDatasetId, getResolvedRegionId } from '@/libs/migration/idMapping';
import { sendMigrationLog } from '@/libs/migration/migrationLogTransport';
import {
  clearRegionShadowCachesForTest,
  inferRegionFilterStrategy,
  selectDatasetForRegionYear,
  shadowResolveRegionTarget,
} from '@/libs/migration/regionShadow';
import type { V2DatasetMetadata } from '@/types/metadata';

vi.mock('@/api/v2/datasets', () => ({
  fetchDatasets: vi.fn(),
}));

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

function createDataset(overrides: Partial<V2DatasetMetadata>): V2DatasetMetadata {
  return {
    id: overrides.id ?? 'dataset-1',
    name: overrides.name ?? 'CPS 2025',
    description: overrides.description ?? 'Dataset',
    filepath: overrides.filepath ?? 'datasets/example.csv',
    year: overrides.year ?? 2025,
    is_output_dataset: overrides.is_output_dataset ?? false,
    tax_benefit_model_id: overrides.tax_benefit_model_id ?? 'model-us',
    created_at: overrides.created_at ?? '2026-01-01T00:00:00Z',
    updated_at: overrides.updated_at ?? '2026-01-01T00:00:00Z',
  };
}

describe('regionShadow', () => {
  beforeEach(() => {
    localStorage.clear();
    clearRegionShadowCachesForTest();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('given exact-year dataset match then resolves region target and stores mappings', async () => {
    vi.mocked(fetchRegionByCode).mockResolvedValue({
      id: 'region-ca',
      code: 'state/ca',
      label: 'California',
      region_type: 'state',
      requires_filter: false,
      filter_field: null,
      filter_value: null,
      parent_code: 'us',
      state_code: 'CA',
      state_name: 'California',
      tax_benefit_model_id: 'model-us',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    });
    vi.mocked(fetchDatasets).mockResolvedValue([
      createDataset({ id: 'dataset-2024', year: 2024 }),
      createDataset({ id: 'dataset-2025', year: 2025 }),
    ]);

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
      datasetId: 'dataset-2025',
      year: 2025,
      filterField: null,
      filterValue: null,
      filterStrategy: null,
    });
    expect(getResolvedRegionId('us', 'state/ca')).toBe('region-ca');
    expect(getResolvedDatasetId('us', 'state/ca', '2025')).toBe('dataset-2025');
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
    expect(fetchDatasets).not.toHaveBeenCalled();
    expect(sendMigrationLog).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'event',
        prefix: 'RegionMigration',
        operation: 'RESOLVE',
        status: 'SKIPPED',
      })
    );
  });

  test('given target year without exact match then dataset selection falls back deterministically', () => {
    const datasets = [
      createDataset({ id: 'dataset-2024', year: 2024 }),
      createDataset({ id: 'dataset-2025', year: 2025 }),
      createDataset({ id: 'dataset-2027', year: 2027 }),
    ];

    expect(selectDatasetForRegionYear(datasets, 2026)?.id).toBe('dataset-2025');
    expect(selectDatasetForRegionYear(datasets, 2023)?.id).toBe('dataset-2024');
    expect(selectDatasetForRegionYear(datasets, null)?.id).toBe('dataset-2027');
  });

  test('given supported region types then infers filter strategy from canonical metadata', () => {
    expect(
      inferRegionFilterStrategy({
        id: 'place-1',
        countryId: 'us',
        code: 'place/ca-44000',
        label: 'Los Angeles',
        regionType: 'place',
        parentCode: 'state/ca',
        filterField: 'place_fips',
        filterValue: '44000',
        requiresFilter: true,
        stateCode: 'CA',
        stateName: 'California',
      })
    ).toBe('row_filter');

    expect(
      inferRegionFilterStrategy({
        id: 'constituency-1',
        countryId: 'uk',
        code: 'constituency/Sheffield Central',
        label: 'Sheffield Central',
        regionType: 'constituency',
        parentCode: 'country/england',
        filterField: 'constituency_code',
        filterValue: 'E14000915',
        requiresFilter: true,
        stateCode: null,
        stateName: null,
      })
    ).toBe('weight_replacement');
  });
});
