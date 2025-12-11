import { describe, expect, test } from 'vitest';
import {
  expectedCaliforniaDistricts,
  expectedUKConstituencies,
  expectedUKCountries,
  expectedUSCongressionalDistricts,
  expectedUSStates,
  mockSingleDistrictState,
  mockUKRegions,
  mockUSRegions,
  TEST_REGIONS,
} from '@/tests/fixtures/utils/regionStrategiesMocks';
import { US_REGION_TYPES } from '@/types/regionTypes';
import {
  createGeographyFromScope,
  extractRegionDisplayValue,
  filterDistrictsByState,
  formatDistrictOptionsForDisplay,
  getStateNameFromDistrict,
  getUKConstituencies,
  getUKCountries,
  getUSCongressionalDistricts,
  getUSStates,
} from '@/utils/regionStrategies';

describe('regionStrategies', () => {
  describe('getUSStates', () => {
    test('given US regions then returns states excluding national entry', () => {
      // Given
      const regions = mockUSRegions;

      // When
      const result = getUSStates(regions);

      // Then
      expect(result).toEqual(expectedUSStates);
      expect(result).not.toContainEqual(expect.objectContaining({ value: 'us' }));
    });

    test('given US regions then returns states with type field', () => {
      // Given
      const regions = mockUSRegions;

      // When
      const result = getUSStates(regions);

      // Then
      expect(result.every((r) => r.type === US_REGION_TYPES.STATE)).toBe(true);
    });

    test('given empty regions then returns empty array', () => {
      // Given
      const regions: typeof mockUSRegions = [];

      // When
      const result = getUSStates(regions);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('getUSCongressionalDistricts', () => {
    test('given US regions then returns congressional districts', () => {
      // Given
      const regions = mockUSRegions;

      // When
      const result = getUSCongressionalDistricts(regions);

      // Then
      expect(result).toEqual(expectedUSCongressionalDistricts);
    });

    test('given US regions then includes state info on districts', () => {
      // Given
      const regions = mockUSRegions;

      // When
      const result = getUSCongressionalDistricts(regions);

      // Then
      expect(result[0].stateAbbreviation).toBe('CA');
      expect(result[0].stateName).toBe('California');
    });

    test('given empty regions then returns empty array', () => {
      // Given
      const regions: typeof mockUSRegions = [];

      // When
      const result = getUSCongressionalDistricts(regions);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('filterDistrictsByState', () => {
    test('given districts and state name then returns matching districts', () => {
      // Given
      const districts = expectedUSCongressionalDistricts;
      const stateName = 'California';

      // When
      const result = filterDistrictsByState(districts, stateName);

      // Then
      expect(result).toEqual(expectedCaliforniaDistricts);
    });

    test('given districts and non-matching state name then returns empty array', () => {
      // Given
      const districts = expectedUSCongressionalDistricts;
      const stateName = 'Texas';

      // When
      const result = filterDistrictsByState(districts, stateName);

      // Then
      expect(result).toEqual([]);
    });

    test('given districts and empty state name then returns empty array', () => {
      // Given
      const districts = expectedUSCongressionalDistricts;
      const stateName = '';

      // When
      const result = filterDistrictsByState(districts, stateName);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('getStateNameFromDistrict', () => {
    test('given valid district value then returns state name', () => {
      // Given
      const districtValue = TEST_REGIONS.US_CONGRESSIONAL_DISTRICT;
      const districts = expectedUSCongressionalDistricts;

      // When
      const result = getStateNameFromDistrict(districtValue, districts);

      // Then
      expect(result).toBe('California');
    });

    test('given invalid district value then returns empty string', () => {
      // Given
      const districtValue = 'congressional_district/XX-99';
      const districts = expectedUSCongressionalDistricts;

      // When
      const result = getStateNameFromDistrict(districtValue, districts);

      // Then
      expect(result).toBe('');
    });
  });

  describe('formatDistrictOptionsForDisplay', () => {
    test('given single district (at-large state) then returns At-large label', () => {
      // Given
      const districts = getUSCongressionalDistricts(mockSingleDistrictState);

      // When
      const result = formatDistrictOptionsForDisplay(districts);

      // Then
      expect(result[0].label).toBe('At-large');
    });

    test('given multiple districts then returns district numbers only', () => {
      // Given
      const districts = expectedCaliforniaDistricts;

      // When
      const result = formatDistrictOptionsForDisplay(districts);

      // Then
      expect(result[0].label).toBe('1st');
      expect(result[1].label).toBe('2nd');
    });

    test('given districts then preserves other properties', () => {
      // Given
      const districts = expectedCaliforniaDistricts;

      // When
      const result = formatDistrictOptionsForDisplay(districts);

      // Then
      expect(result[0].value).toBe(districts[0].value);
      expect(result[0].type).toBe(districts[0].type);
      expect(result[0].stateName).toBe(districts[0].stateName);
    });
  });

  describe('getUKCountries', () => {
    test('given UK regions then returns only country entries with prefix', () => {
      // Given
      const regions = mockUKRegions;

      // When
      const result = getUKCountries(regions);

      // Then
      expect(result).toEqual(expectedUKCountries);
      expect(result.every((r) => r.value.startsWith('country/'))).toBe(true);
    });

    test('given regions with no countries then returns empty array', () => {
      // Given
      const regions = mockUSRegions;

      // When
      const result = getUKCountries(regions);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('getUKConstituencies', () => {
    test('given UK regions then returns only constituency entries with prefix', () => {
      // Given
      const regions = mockUKRegions;

      // When
      const result = getUKConstituencies(regions);

      // Then
      expect(result).toEqual(expectedUKConstituencies);
      expect(result.every((r) => r.value.startsWith('constituency/'))).toBe(true);
    });

    test('given regions with no constituencies then returns empty array', () => {
      // Given
      const regions = mockUSRegions;

      // When
      const result = getUKConstituencies(regions);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('extractRegionDisplayValue', () => {
    test('given UK constituency with prefix then strips prefix', () => {
      // Given
      const fullValue = TEST_REGIONS.UK_CONSTITUENCY_PREFIXED;

      // When
      const result = extractRegionDisplayValue(fullValue);

      // Then
      expect(result).toBe(TEST_REGIONS.UK_CONSTITUENCY_DISPLAY);
    });

    test('given UK country with prefix then strips prefix', () => {
      // Given
      const fullValue = TEST_REGIONS.UK_COUNTRY_PREFIXED;

      // When
      const result = extractRegionDisplayValue(fullValue);

      // Then
      expect(result).toBe(TEST_REGIONS.UK_COUNTRY_DISPLAY);
    });

    test('given US state with prefix then strips prefix', () => {
      // Given
      const fullValue = TEST_REGIONS.US_STATE; // 'state/ca'

      // When
      const result = extractRegionDisplayValue(fullValue);

      // Then
      expect(result).toBe('ca');
    });

    test('given US congressional district with prefix then strips prefix', () => {
      // Given
      const fullValue = TEST_REGIONS.US_CONGRESSIONAL_DISTRICT; // 'congressional_district/CA-01'

      // When
      const result = extractRegionDisplayValue(fullValue);

      // Then
      expect(result).toBe('CA-01');
    });

    test('given legacy US state code without prefix then returns as-is', () => {
      // Given
      const fullValue = TEST_REGIONS.US_LEGACY_STATE_CODE; // 'tx'

      // When
      const result = extractRegionDisplayValue(fullValue);

      // Then
      expect(result).toBe('tx');
    });

    test('given legacy NYC code without prefix then returns as-is', () => {
      // Given
      const fullValue = TEST_REGIONS.US_LEGACY_CITY_CODE_NYC; // 'nyc'

      // When
      const result = extractRegionDisplayValue(fullValue);

      // Then
      expect(result).toBe('nyc');
    });

    test('given national identifier then returns as-is', () => {
      // Given
      const ukNational = TEST_REGIONS.UK_NATIONAL;
      const usNational = TEST_REGIONS.US_NATIONAL;

      // When
      const ukResult = extractRegionDisplayValue(ukNational);
      const usResult = extractRegionDisplayValue(usNational);

      // Then
      expect(ukResult).toBe(TEST_REGIONS.UK_NATIONAL);
      expect(usResult).toBe(TEST_REGIONS.US_NATIONAL);
    });

    test('given value with multiple slashes then returns last segment', () => {
      // Given
      const fullValue = 'country/region/city';

      // When
      const result = extractRegionDisplayValue(fullValue);

      // Then
      expect(result).toBe('city');
    });
  });

  describe('createGeographyFromScope', () => {
    test('given household scope then returns null', () => {
      // Given
      const scope = 'household' as const;
      const countryId = 'uk' as const;

      // When
      const result = createGeographyFromScope(scope, countryId);

      // Then
      expect(result).toBeNull();
    });

    test('given national scope for UK then returns geography with country ID', () => {
      // Given
      const scope = 'national' as const;
      const countryId = 'uk' as const;

      // When
      const result = createGeographyFromScope(scope, countryId);

      // Then
      expect(result).toEqual({
        id: 'uk',
        countryId: 'uk',
        scope: 'national',
        geographyId: 'uk',
      });
    });

    test('given national scope for US then returns geography with country ID', () => {
      // Given
      const scope = 'national' as const;
      const countryId = 'us' as const;

      // When
      const result = createGeographyFromScope(scope, countryId);

      // Then
      expect(result).toEqual({
        id: 'us',
        countryId: 'us',
        scope: 'national',
        geographyId: 'us',
      });
    });

    test('given UK constituency scope then stores full prefixed value', () => {
      // Given
      const scope = 'constituency' as const;
      const countryId = 'uk' as const;
      const selectedRegion = TEST_REGIONS.UK_CONSTITUENCY_PREFIXED;

      // When
      const result = createGeographyFromScope(scope, countryId, selectedRegion);

      // Then
      expect(result).toEqual({
        id: 'uk-Sheffield Central', // ID uses display value
        countryId: 'uk',
        scope: 'subnational',
        geographyId: TEST_REGIONS.UK_CONSTITUENCY_PREFIXED, // Stores FULL prefixed value
      });
    });

    test('given UK country scope then stores full prefixed value', () => {
      // Given
      const scope = 'country' as const;
      const countryId = 'uk' as const;
      const selectedRegion = TEST_REGIONS.UK_COUNTRY_PREFIXED;

      // When
      const result = createGeographyFromScope(scope, countryId, selectedRegion);

      // Then
      expect(result).toEqual({
        id: 'uk-england', // ID uses display value
        countryId: 'uk',
        scope: 'subnational',
        geographyId: TEST_REGIONS.UK_COUNTRY_PREFIXED, // Stores FULL prefixed value
      });
    });

    test('given US state scope then stores full prefixed value', () => {
      // Given
      const scope = 'state' as const;
      const countryId = 'us' as const;
      const selectedRegion = TEST_REGIONS.US_STATE; // 'state/ca'

      // When
      const result = createGeographyFromScope(scope, countryId, selectedRegion);

      // Then
      expect(result).toEqual({
        id: 'us-ca', // ID uses display value
        countryId: 'us',
        scope: 'subnational',
        geographyId: TEST_REGIONS.US_STATE, // Stores FULL prefixed value
      });
    });

    test('given US congressional district scope then stores full prefixed value', () => {
      // Given
      const scope = 'congressional_district' as const;
      const countryId = 'us' as const;
      const selectedRegion = TEST_REGIONS.US_CONGRESSIONAL_DISTRICT; // 'congressional_district/CA-01'

      // When
      const result = createGeographyFromScope(scope, countryId, selectedRegion);

      // Then
      expect(result).toEqual({
        id: 'us-CA-01', // ID uses display value
        countryId: 'us',
        scope: 'subnational',
        geographyId: TEST_REGIONS.US_CONGRESSIONAL_DISTRICT, // Stores FULL prefixed value
      });
    });

    test('given subnational scope without selected region then returns null', () => {
      // Given
      const scope = 'constituency' as const;
      const countryId = 'uk' as const;

      // When
      const result = createGeographyFromScope(scope, countryId);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('Legacy US region format support', () => {
    test('given legacy state code (tx) then extractRegionDisplayValue returns as-is', () => {
      // Given - Legacy format without "state/" prefix
      const legacyStateCode = TEST_REGIONS.US_LEGACY_STATE_CODE;

      // When
      const result = extractRegionDisplayValue(legacyStateCode);

      // Then
      expect(result).toBe('tx');
    });

    test('given legacy NYC code then extractRegionDisplayValue returns as-is', () => {
      // Given - NYC was a special case in legacy format
      const legacyNyc = TEST_REGIONS.US_LEGACY_CITY_CODE_NYC;

      // When
      const result = extractRegionDisplayValue(legacyNyc);

      // Then
      expect(result).toBe('nyc');
    });

    test('given legacy state code in createGeographyFromScope then handles correctly', () => {
      // Given - Legacy format being passed to createGeographyFromScope
      const scope = 'state' as const;
      const countryId = 'us' as const;
      const legacyStateCode = TEST_REGIONS.US_LEGACY_STATE_CODE; // 'tx'

      // When
      const result = createGeographyFromScope(scope, countryId, legacyStateCode);

      // Then - Should still work with legacy format
      expect(result).toEqual({
        id: 'us-tx',
        countryId: 'us',
        scope: 'subnational',
        geographyId: 'tx', // Legacy format preserved
      });
    });

    test('given legacy CA state code then createGeographyFromScope handles correctly', () => {
      // Given
      const scope = 'state' as const;
      const countryId = 'us' as const;
      const legacyStateCode = TEST_REGIONS.US_LEGACY_STATE_CODE_CA; // 'ca'

      // When
      const result = createGeographyFromScope(scope, countryId, legacyStateCode);

      // Then
      expect(result).toEqual({
        id: 'us-ca',
        countryId: 'us',
        scope: 'subnational',
        geographyId: 'ca', // Legacy format preserved
      });
    });
  });
});
