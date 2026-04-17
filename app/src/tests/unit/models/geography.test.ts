import { describe, expect, test } from 'vitest';
import {
  buildCanonicalGeography,
  findRegionRecord,
  getCanonicalGeographyCode,
  getCountryDisplayName,
  getGeographyRegionTypeLabel,
} from '@/models/geography';
import { toRegionRecord } from '@/models/region';

const usRegions = [
  toRegionRecord('us', {
    id: 'region-state-ca',
    code: 'state/ca',
    label: 'California',
    region_type: 'state',
    parent_code: 'us',
    filter_field: null,
    filter_value: null,
    requires_filter: false,
    state_code: 'CA',
    state_name: 'California',
  }),
  toRegionRecord('us', {
    id: 'region-place-la',
    code: 'place/CA-44000',
    label: 'Los Angeles',
    region_type: 'place',
    parent_code: 'state/ca',
    filter_field: 'place_fips',
    filter_value: '44000',
    requires_filter: true,
    state_code: 'CA',
    state_name: 'California',
  }),
];

describe('geography model helpers', () => {
  test('given a national geography then it resolves to the country display name', () => {
    expect(
      buildCanonicalGeography({
        countryId: 'us',
        scope: 'national',
        geographyId: 'us',
      })
    ).toEqual({
      id: 'us',
      countryId: 'us',
      scope: 'national',
      geographyId: 'us',
      name: 'United States',
    });
  });

  test('given a legacy subnational code then it resolves through canonical region metadata', () => {
    expect(
      buildCanonicalGeography({
        countryId: 'us',
        scope: 'subnational',
        geographyId: 'ca',
        regions: usRegions,
      })
    ).toEqual({
      id: 'state/ca',
      countryId: 'us',
      scope: 'subnational',
      geographyId: 'state/ca',
      name: 'California',
    });
  });

  test('given a place code then it preserves the canonical place code and label', () => {
    const geography = buildCanonicalGeography({
      countryId: 'us',
      scope: 'subnational',
      geographyId: 'place/CA-44000',
      regions: usRegions,
    });

    expect(geography.geographyId).toBe('place/CA-44000');
    expect(geography.name).toBe('Los Angeles');
    expect(getGeographyRegionTypeLabel(geography)).toBe('City');
  });

  test('given region candidates then it finds a matching canonical region record', () => {
    const region = findRegionRecord(usRegions, 'us', 'ca');

    expect(region?.code).toBe('state/ca');
    expect(getCanonicalGeographyCode('us', 'subnational', 'ca', usRegions)).toBe('state/ca');
  });

  test('given an unsupported country display name then it falls back to upper-case', () => {
    expect(getCountryDisplayName('us')).toBe('United States');
    expect(getCountryDisplayName('ca')).toBe('Canada');
  });
});
