import { describe, expect, test } from 'vitest';
import {
  buildDistrictLabelLookup,
  transformDistrictAverageChange,
  transformDistrictData,
  transformDistrictRelativeChange,
} from '@/adapters/congressional-district/congressionalDistrictDataAdapter';
import {
  DISTRICT_DATA_WITH_UNKNOWN,
  EMPTY_DISTRICT_DATA,
  EXPECTED_AVERAGE_CHANGE_DATA,
  EXPECTED_RELATIVE_CHANGE_DATA,
  MOCK_DISTRICT_DATA,
  MOCK_MIXED_REGIONS,
  MOCK_REGIONS,
  SINGLE_DISTRICT_DATA,
} from '@/tests/fixtures/adapters/congressional-district/congressionalDistrictMocks';

describe('congressionalDistrictDataAdapter', () => {
  describe('buildDistrictLabelLookup', () => {
    test('given regions with congressional districts then creates correct lookup map', () => {
      // Given
      const regions = MOCK_REGIONS;

      // When
      const lookup = buildDistrictLabelLookup(regions);

      // Then
      expect(lookup.get('AL-01')).toBe("Alabama's 1st congressional district");
      expect(lookup.get('CA-52')).toBe("California's 52nd congressional district");
      expect(lookup.get('NY-12')).toBe("New York's 12th congressional district");
      expect(lookup.get('TX-28')).toBe("Texas's 28th congressional district");
    });

    test('given regions with mixed types then only includes congressional districts', () => {
      // Given
      const regions = MOCK_MIXED_REGIONS;

      // When
      const lookup = buildDistrictLabelLookup(regions);

      // Then
      // Should include congressional districts
      expect(lookup.has('AL-01')).toBe(true);
      expect(lookup.has('CA-52')).toBe(true);

      // Should NOT include other region types
      expect(lookup.has('us')).toBe(false); // national
      expect(lookup.has('CA')).toBe(false); // state
      expect(lookup.has('NYC')).toBe(false); // city
      expect(lookup.has('uk')).toBe(false); // UK national
      expect(lookup.has('Westminster North')).toBe(false); // UK constituency
    });

    test('given only congressional districts then lookup size matches district count', () => {
      // Given
      const regions = MOCK_REGIONS;

      // When
      const lookup = buildDistrictLabelLookup(regions);

      // Then
      // MOCK_REGIONS has 4 congressional districts
      expect(lookup.size).toBe(4);
    });

    test('given empty regions then returns empty map', () => {
      // Given
      const regions: typeof MOCK_REGIONS = [];

      // When
      const lookup = buildDistrictLabelLookup(regions);

      // Then
      expect(lookup.size).toBe(0);
    });
  });

  describe('transformDistrictData', () => {
    test('given average change field then transforms data correctly', () => {
      // Given
      const apiData = MOCK_DISTRICT_DATA;
      const valueField = 'average_household_income_change' as const;
      const labelLookup = buildDistrictLabelLookup(MOCK_REGIONS);

      // When
      const result = transformDistrictData(apiData, valueField, labelLookup);

      // Then
      expect(result).toEqual(EXPECTED_AVERAGE_CHANGE_DATA);
    });

    test('given relative change field then transforms data correctly', () => {
      // Given
      const apiData = MOCK_DISTRICT_DATA;
      const valueField = 'relative_household_income_change' as const;
      const labelLookup = buildDistrictLabelLookup(MOCK_REGIONS);

      // When
      const result = transformDistrictData(apiData, valueField, labelLookup);

      // Then
      expect(result).toEqual(EXPECTED_RELATIVE_CHANGE_DATA);
    });

    test('given district IDs then uses them as geoId', () => {
      // Given
      const apiData = MOCK_DISTRICT_DATA;
      const labelLookup = buildDistrictLabelLookup(MOCK_REGIONS);

      // When
      const result = transformDistrictData(apiData, 'average_household_income_change', labelLookup);

      // Then
      expect(result[0].geoId).toBe('AL-01');
      expect(result[1].geoId).toBe('CA-52');
      expect(result[2].geoId).toBe('NY-12');
      expect(result[3].geoId).toBe('TX-28');
    });

    test('given metadata labels then uses them for display', () => {
      // Given
      const apiData = MOCK_DISTRICT_DATA;
      const labelLookup = buildDistrictLabelLookup(MOCK_REGIONS);

      // When
      const result = transformDistrictData(apiData, 'average_household_income_change', labelLookup);

      // Then
      expect(result[0].label).toBe("Alabama's 1st congressional district");
      expect(result[1].label).toBe("California's 52nd congressional district");
    });

    test('given empty data then returns empty array', () => {
      // Given
      const apiData = EMPTY_DISTRICT_DATA;
      const labelLookup = buildDistrictLabelLookup(MOCK_REGIONS);

      // When
      const result = transformDistrictData(apiData, 'average_household_income_change', labelLookup);

      // Then
      expect(result).toEqual([]);
    });

    test('given single district then returns single point', () => {
      // Given
      const apiData = SINGLE_DISTRICT_DATA;
      const labelLookup = new Map([['WY-01', "Wyoming's at-large congressional district"]]);

      // When
      const result = transformDistrictData(apiData, 'average_household_income_change', labelLookup);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].geoId).toBe('WY-01');
      expect(result[0].label).toBe("Wyoming's at-large congressional district");
      expect(result[0].value).toBe(500.0);
    });

    test('given district not in metadata then uses fallback label', () => {
      // Given
      const apiData = DISTRICT_DATA_WITH_UNKNOWN;
      const labelLookup = buildDistrictLabelLookup(MOCK_REGIONS); // Only has AL-01, not ZZ-99

      // When
      const result = transformDistrictData(apiData, 'average_household_income_change', labelLookup);

      // Then
      expect(result[0].label).toBe("Alabama's 1st congressional district"); // Found in metadata
      expect(result[1].label).toBe('District ZZ-99'); // Fallback for unknown district
    });
  });

  describe('transformDistrictAverageChange', () => {
    test('given district data then extracts average change values', () => {
      // Given
      const apiData = MOCK_DISTRICT_DATA;
      const labelLookup = buildDistrictLabelLookup(MOCK_REGIONS);

      // When
      const result = transformDistrictAverageChange(apiData, labelLookup);

      // Then
      expect(result).toEqual(EXPECTED_AVERAGE_CHANGE_DATA);
    });

    test('given data then uses average_household_income_change field', () => {
      // Given
      const apiData = MOCK_DISTRICT_DATA;
      const labelLookup = buildDistrictLabelLookup(MOCK_REGIONS);

      // When
      const result = transformDistrictAverageChange(apiData, labelLookup);

      // Then
      expect(result[0].value).toBe(312.45);
      expect(result[1].value).toBe(612.88);
    });

    test('given positive and negative values then preserves signs', () => {
      // Given
      const apiData = MOCK_DISTRICT_DATA;
      const labelLookup = buildDistrictLabelLookup(MOCK_REGIONS);

      // When
      const result = transformDistrictAverageChange(apiData, labelLookup);

      // Then
      expect(result[0].value).toBeGreaterThan(0); // AL-01
      expect(result[1].value).toBeGreaterThan(0); // CA-52
      expect(result[2].value).toBeLessThan(0); // NY-12
      expect(result[3].value).toBe(0); // TX-28
    });
  });

  describe('transformDistrictRelativeChange', () => {
    test('given district data then extracts relative change values', () => {
      // Given
      const apiData = MOCK_DISTRICT_DATA;
      const labelLookup = buildDistrictLabelLookup(MOCK_REGIONS);

      // When
      const result = transformDistrictRelativeChange(apiData, labelLookup);

      // Then
      expect(result).toEqual(EXPECTED_RELATIVE_CHANGE_DATA);
    });

    test('given data then uses relative_household_income_change field', () => {
      // Given
      const apiData = MOCK_DISTRICT_DATA;
      const labelLookup = buildDistrictLabelLookup(MOCK_REGIONS);

      // When
      const result = transformDistrictRelativeChange(apiData, labelLookup);

      // Then
      expect(result[0].value).toBe(0.0187);
      expect(result[1].value).toBe(0.041);
    });

    test('given percentage values then preserves decimal precision', () => {
      // Given
      const apiData = MOCK_DISTRICT_DATA;
      const labelLookup = buildDistrictLabelLookup(MOCK_REGIONS);

      // When
      const result = transformDistrictRelativeChange(apiData, labelLookup);

      // Then
      expect(result[0].value).toBe(0.0187); // Exact match
      expect(result[1].value).toBe(0.041); // Exact match
      expect(result[2].value).toBe(-0.012); // NY-12
    });

    test('given positive and negative percentages then preserves signs', () => {
      // Given
      const apiData = MOCK_DISTRICT_DATA;
      const labelLookup = buildDistrictLabelLookup(MOCK_REGIONS);

      // When
      const result = transformDistrictRelativeChange(apiData, labelLookup);

      // Then
      expect(result[0].value).toBeGreaterThan(0); // AL-01
      expect(result[2].value).toBeLessThan(0); // NY-12
      expect(result[3].value).toBe(0); // TX-28
    });
  });
});
