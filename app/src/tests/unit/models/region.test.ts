import { describe, expect, test } from 'vitest';
import {
  canonicalRegionCode,
  createResolvedRegionTarget,
  fromMetadataRegionEntry,
  getLegacyRegionCodeFallbacks,
  getRegionCodeCandidates,
  normalizeRegionCode,
  type RegionRecord,
} from '@/models/region';
import {
  LEGACY_NORTHERN_IRELAND_REGION_CODE,
  LEGACY_NORTHERN_IRELAND_SPELLINGS,
  NORTHERN_IRELAND_LABEL,
  NORTHERN_IRELAND_REGION_CODE,
} from '@/tests/fixtures/models/regionMocks';
import { UK_REGION_TYPES } from '@/types/regionTypes';

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

describe('Northern Ireland region code', () => {
  test.each(LEGACY_NORTHERN_IRELAND_SPELLINGS)(
    'given the UK region %j then it normalizes to country/northern_ireland',
    (spelling) => {
      expect(normalizeRegionCode('uk', spelling)).toBe(NORTHERN_IRELAND_REGION_CODE);
    }
  );

  test('given country/northern_ireland then it is kept as it is', () => {
    expect(normalizeRegionCode('uk', NORTHERN_IRELAND_REGION_CODE)).toBe(
      NORTHERN_IRELAND_REGION_CODE
    );
  });

  test('given country/ni then the canonical code is country/northern_ireland', () => {
    expect(canonicalRegionCode(LEGACY_NORTHERN_IRELAND_REGION_CODE)).toBe(
      NORTHERN_IRELAND_REGION_CODE
    );
  });

  test.each(['uk', 'country/wales', 'constituency/Belfast East', 'state/ca', 'local_authority/Ni'])(
    'given the region %s then the canonical code is the code given',
    (regionCode) => {
      expect(canonicalRegionCode(regionCode)).toBe(regionCode);
    }
  );

  test('given metadata listing country/ni then the region record is country/northern_ireland', () => {
    const region = fromMetadataRegionEntry('uk', {
      name: LEGACY_NORTHERN_IRELAND_REGION_CODE,
      label: NORTHERN_IRELAND_LABEL,
      type: UK_REGION_TYPES.COUNTRY,
    });

    expect(region.code).toBe(NORTHERN_IRELAND_REGION_CODE);
    expect(region.id).toBe(`metadata:uk:${NORTHERN_IRELAND_REGION_CODE}`);
  });

  test.each(['ni', LEGACY_NORTHERN_IRELAND_REGION_CODE])(
    'given %s then the lookup candidates name country/northern_ireland, never country/ni',
    (regionCode) => {
      const candidates = getRegionCodeCandidates(regionCode);

      expect(candidates).toContain(NORTHERN_IRELAND_REGION_CODE);
      expect(candidates).not.toContain(LEGACY_NORTHERN_IRELAND_REGION_CODE);
    }
  );
});
