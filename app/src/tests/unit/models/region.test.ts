import { describe, expect, test } from 'vitest';
import {
  createResolvedRegionTarget,
  fromMetadataRegionEntry,
  fromV2RegionMetadata,
  getLegacyRegionCodeFallbacks,
  getRegionCodeCandidates,
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
      filter_strategy: null,
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
      filterStrategy: null,
      requiresFilter: false,
      stateCode: 'CA',
      stateName: 'California',
      source: 'v2_api',
      sourceId: 'region-1',
    });
  });

  test('given metadata region entry then converts to app-level Region', () => {
    const result = fromMetadataRegionEntry('us', {
      name: 'congressional_district/CA-01',
      label: "California's 1st congressional district",
      type: 'congressional_district',
      state_abbreviation: 'CA',
      state_name: 'California',
    });

    expect(result).toEqual({
      id: 'metadata:us:congressional_district/CA-01',
      countryId: 'us',
      code: 'congressional_district/CA-01',
      label: "California's 1st congressional district",
      regionType: 'congressional_district',
      parentCode: null,
      filterField: null,
      filterValue: null,
      filterStrategy: null,
      requiresFilter: false,
      stateCode: 'CA',
      stateName: 'California',
      source: 'v1_metadata',
      sourceId: null,
    });
  });

  test('given buggy district codes from v2 then converts them to canonical app-level regions', () => {
    const result = fromV2RegionMetadata('us', {
      id: 'region-de-at-large',
      code: 'congressional_district/DE-00',
      label: "Delaware's at-large congressional district",
      region_type: 'congressional_district',
      parent_code: 'us',
      filter_field: 'congressional_district',
      filter_value: 'DE-00',
      filter_strategy: 'weight_replacement',
      requires_filter: true,
      state_code: 'DE',
      state_name: 'Delaware',
    });

    expect(result.code).toBe('congressional_district/DE-01');
    expect(result.filterValue).toBe('DE-01');
  });

  test('given resolved canonical region then creates a ResolvedRegionTarget', () => {
    const region = toRegionRecord('uk', {
      id: 'region-uk-england',
      code: 'country/england',
      label: 'England',
      region_type: 'country',
      parent_code: 'uk',
      filter_field: 'country',
      filter_value: 'england',
      filter_strategy: 'row_filter',
      requires_filter: true,
    });

    expect(
      createResolvedRegionTarget({
        region,
        filterStrategy: 'row_filter',
      })
    ).toEqual({
      countryId: 'uk',
      code: 'country/england',
      regionId: 'region-uk-england',
      label: 'England',
      regionType: 'country',
      filterField: 'country',
      filterValue: 'england',
      filterStrategy: 'row_filter',
    });
  });

  test('given supported legacy region codes then normalizes to canonical codes', () => {
    expect(normalizeRegionCode('us', 'ca')).toBe('state/ca');
    expect(normalizeRegionCode('us', 'CA-12')).toBe('congressional_district/CA-12');
    expect(normalizeRegionCode('us', 'us-ca')).toBe('state/ca');
    expect(normalizeRegionCode('us', 'us-DE-00')).toBe('congressional_district/DE-01');
    expect(normalizeRegionCode('us', 'congressional_district/DE-00')).toBe(
      'congressional_district/DE-01'
    );
    expect(normalizeRegionCode('us', 'DC-98')).toBe('congressional_district/DC-01');
    expect(normalizeRegionCode('uk', 'england')).toBe('country/england');
    expect(normalizeRegionCode('uk', 'uk-scotland')).toBe('country/scotland');
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

  test('given canonical at-large districts then returns legacy fetch fallbacks only for backend compatibility', () => {
    expect(getLegacyRegionCodeFallbacks('us', 'congressional_district/DE-01')).toEqual([
      'congressional_district/DE-00',
    ]);
    expect(getLegacyRegionCodeFallbacks('us', 'congressional_district/DC-01')).toEqual([
      'congressional_district/DC-98',
    ]);
    expect(getLegacyRegionCodeFallbacks('us', 'congressional_district/CA-01')).toEqual([]);
  });
});
