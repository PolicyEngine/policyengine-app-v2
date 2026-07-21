import { describe, expect, test } from 'vitest';
import {
  buildCanonicalGeography,
  findRegionRecord,
  getCanonicalGeographyCode,
  getCountryDisplayName,
  getGeographyRegionTypeLabel,
} from '@/models/geography';
import type { RegionRecord } from '@/models/region';

const usRegions: RegionRecord[] = [
  {
    id: 'region-state-ca',
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
    source: 'v1_metadata',
    sourceId: null,
  },
  {
    id: 'region-place-la',
    countryId: 'us',
    code: 'place/CA-44000',
    label: 'Los Angeles',
    regionType: 'place',
    parentCode: 'state/ca',
    filterField: 'place_fips',
    filterValue: '44000',
    filterStrategy: null,
    requiresFilter: true,
    stateCode: 'CA',
    stateName: 'California',
    source: 'v1_metadata',
    sourceId: null,
  },
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
