import { describe, expect, test } from 'vitest';
import {
  createResolvedRegionTarget,
  fromMetadataRegionEntry,
  getLegacyRegionCodeFallbacks,
  getRegionCodeCandidates,
  normalizeRegionCode,
  type RegionRecord,
} from '@/models/region';

describe('region model helpers', () => {
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

  test('given resolved canonical region then creates a ResolvedRegionTarget', () => {
    const region: RegionRecord = {
      id: 'region-uk-england',
      countryId: 'uk',
      code: 'country/england',
      label: 'England',
      regionType: 'country',
      parentCode: 'uk',
      filterField: 'country',
      filterValue: 'england',
      filterStrategy: 'row_filter',
      requiresFilter: true,
      stateCode: null,
      stateName: null,
      source: 'v1_metadata',
      sourceId: null,
    };

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

  test('given canonical or legacy district codes then returns backend fetch fallbacks only for compatibility', () => {
    expect(getLegacyRegionCodeFallbacks('us', 'congressional_district/DE-01')).toEqual([
      'congressional_district/DE-00',
    ]);
    expect(getLegacyRegionCodeFallbacks('us', 'congressional_district/DE-00')).toEqual([
      'congressional_district/DE-00',
    ]);
    expect(getLegacyRegionCodeFallbacks('us', 'congressional_district/CA-01')).toEqual([
      'congressional_district/CA-00',
    ]);
    expect(getLegacyRegionCodeFallbacks('us', 'DC-01')).toEqual(['congressional_district/DC-98']);
    expect(getLegacyRegionCodeFallbacks('us', 'DC-98')).toEqual(['congressional_district/DC-98']);
    expect(getLegacyRegionCodeFallbacks('us', 'state/ca')).toEqual([]);
  });
});
