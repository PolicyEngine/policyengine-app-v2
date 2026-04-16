import { describe, expect, test } from 'vitest';
import {
  createResolvedRegionTarget,
  getRegionCodeCandidates,
  getRegionYearKey,
  normalizeRegionCode,
  toRegionRecord,
} from '@/models/region';

describe('region model helpers', () => {
  test('given v2 region metadata then converts to RegionRecord', () => {
    const result = toRegionRecord('us', {
      id: 'region-1',
      code: 'state/ca',
      label: 'California',
      region_type: 'state',
      parent_code: 'us',
      filter_field: null,
      filter_value: null,
      requires_filter: false,
      state_code: 'CA',
      state_name: 'California',
    });

    expect(result).toEqual({
      id: 'region-1',
      countryId: 'us',
      code: 'state/ca',
      label: 'California',
      regionType: 'state',
      parentCode: 'us',
      filterField: null,
      filterValue: null,
      requiresFilter: false,
      stateCode: 'CA',
      stateName: 'California',
    });
  });

  test('given region and dataset resolution then creates a ResolvedRegionTarget', () => {
    const region = toRegionRecord('uk', {
      id: 'region-uk-england',
      code: 'country/england',
      label: 'England',
      region_type: 'country',
      parent_code: 'uk',
      filter_field: 'country',
      filter_value: 'england',
      requires_filter: true,
    });

    expect(
      createResolvedRegionTarget({
        region,
        datasetId: 'dataset-123',
        year: 2026,
        filterStrategy: 'row_filter',
      })
    ).toEqual({
      countryId: 'uk',
      code: 'country/england',
      regionId: 'region-uk-england',
      label: 'England',
      regionType: 'country',
      datasetId: 'dataset-123',
      year: 2026,
      filterField: 'country',
      filterValue: 'england',
      filterStrategy: 'row_filter',
    });
  });

  test('given supported legacy region codes then normalizes to canonical codes', () => {
    expect(normalizeRegionCode('us', 'ca')).toBe('state/ca');
    expect(normalizeRegionCode('us', 'CA-12')).toBe('congressional_district/CA-12');
    expect(normalizeRegionCode('uk', 'england')).toBe('country/england');
  });

  test('given unsupported legacy region code then preserves original value', () => {
    expect(normalizeRegionCode('uk', 'Sheffield Central')).toBe('Sheffield Central');
  });

  test('given legacy region code then returns canonical lookup candidates', () => {
    expect(getRegionCodeCandidates('ca')).toContain('state/ca');
    expect(getRegionCodeCandidates('Sheffield Central')).toContain(
      'constituency/Sheffield Central'
    );
  });

  test('given nullable year then uses latest year key', () => {
    expect(getRegionYearKey()).toBe('latest');
    expect(getRegionYearKey(null)).toBe('latest');
    expect(getRegionYearKey(2026)).toBe('2026');
  });
});
