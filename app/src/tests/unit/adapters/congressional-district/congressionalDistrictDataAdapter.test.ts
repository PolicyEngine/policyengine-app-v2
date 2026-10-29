import { describe, expect, test } from 'vitest';
import {
  buildDistrictLabelLookup,
  districtErrorSummary,
  districtsOf,
  mergeStateDistricts,
  normalizeDistrictId,
  transformDistrictAbsoluteChange,
  transformDistrictData,
  transformDistrictRelativeChange,
} from '@/adapters/congressional-district/congressionalDistrictDataAdapter';
import {
  BUGGY_DC_DISTRICT_DATA,
  BUGGY_SINGLE_DISTRICT_DATA,
  DISTRICT_DATA_WITH_UNKNOWN,
  EMPTY_DISTRICT_DATA,
  EXPECTED_ABSOLUTE_CHANGE_DATA,
  EXPECTED_DISTRICT_IDS,
  EXPECTED_RELATIVE_CHANGE_DATA,
  MOCK_DISTRICT_DATA,
  MOCK_MIXED_REGIONS,
  MOCK_REGIONS,
  SINGLE_DISTRICT_DATA,
  TEXAS_REGION,
  UTAH_DISTRICTS,
  WYOMING_DISTRICTS,
  WYOMING_DISTRICTS_NORMALIZED,
  WYOMING_REGION,
} from '@/tests/fixtures/adapters/congressional-district/congressionalDistrictMocks';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

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
      expect(result).toEqual(EXPECTED_ABSOLUTE_CHANGE_DATA);
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

  describe('transformDistrictAbsoluteChange', () => {
    test('given district data then extracts average change values', () => {
      // Given
      const apiData = MOCK_DISTRICT_DATA;
      const labelLookup = buildDistrictLabelLookup(MOCK_REGIONS);

      // When
      const result = transformDistrictAbsoluteChange(apiData, labelLookup);

      // Then
      expect(result).toEqual(EXPECTED_ABSOLUTE_CHANGE_DATA);
    });

    test('given data then uses average_household_income_change field', () => {
      // Given
      const apiData = MOCK_DISTRICT_DATA;
      const labelLookup = buildDistrictLabelLookup(MOCK_REGIONS);

      // When
      const result = transformDistrictAbsoluteChange(apiData, labelLookup);

      // Then
      expect(result[0].value).toBe(312.45);
      expect(result[1].value).toBe(612.88);
    });

    test('given positive and negative values then preserves signs', () => {
      // Given
      const apiData = MOCK_DISTRICT_DATA;
      const labelLookup = buildDistrictLabelLookup(MOCK_REGIONS);

      // When
      const result = transformDistrictAbsoluteChange(apiData, labelLookup);

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

  describe('normalizeDistrictId', () => {
    test('given single-district state with -00 then normalizes to -01', () => {
      expect(normalizeDistrictId('WY-00')).toBe('WY-01');
    });

    test('given any state with -00 then normalizes to -01', () => {
      expect(normalizeDistrictId('AK-00')).toBe('AK-01');
      expect(normalizeDistrictId('DE-00')).toBe('DE-01');
      expect(normalizeDistrictId('MT-00')).toBe('MT-01');
      expect(normalizeDistrictId('ND-00')).toBe('ND-01');
      expect(normalizeDistrictId('SD-00')).toBe('SD-01');
      expect(normalizeDistrictId('VT-00')).toBe('VT-01');
    });

    test('given DC-98 then normalizes to DC-01', () => {
      expect(normalizeDistrictId('DC-98')).toBe('DC-01');
    });

    test('given normal district ID then returns unchanged', () => {
      expect(normalizeDistrictId('CA-52')).toBe('CA-52');
      expect(normalizeDistrictId('AL-01')).toBe('AL-01');
      expect(normalizeDistrictId('NY-12')).toBe('NY-12');
    });

    test('given DC with correct format then returns unchanged', () => {
      expect(normalizeDistrictId('DC-01')).toBe('DC-01');
    });
  });

  describe('transformDistrictData with buggy district IDs', () => {
    test('given single-district state with -00 then normalizes geoId and resolves label', () => {
      // Given
      const apiData = BUGGY_SINGLE_DISTRICT_DATA;
      const labelLookup = new Map([['WY-01', "Wyoming's at-large congressional district"]]);

      // When
      const result = transformDistrictData(apiData, 'average_household_income_change', labelLookup);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].geoId).toBe('WY-01');
      expect(result[0].label).toBe("Wyoming's at-large congressional district");
      expect(result[0].value).toBe(500.0);
    });

    test('given DC-98 then normalizes geoId and resolves label', () => {
      // Given
      const apiData = BUGGY_DC_DISTRICT_DATA;
      const labelLookup = new Map([
        ['DC-01', "District of Columbia's at-large congressional district"],
      ]);

      // When
      const result = transformDistrictData(apiData, 'average_household_income_change', labelLookup);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].geoId).toBe('DC-01');
      expect(result[0].label).toBe("District of Columbia's at-large congressional district");
      expect(result[0].value).toBe(250.0);
    });
  });

  describe('districtsOf', () => {
    test('given an output with districts then it gives them with normalised IDs', () => {
      // Given
      const output = createMockSocietyWideOutput({
        congressional_district_impact: { districts: WYOMING_DISTRICTS },
      });

      // When
      const districts = districtsOf(output);

      // Then
      expect(districts).toEqual(WYOMING_DISTRICTS_NORMALIZED);
    });

    test.each([
      ['no output', null],
      [
        'an output whose districts are null',
        createMockSocietyWideOutput({ congressional_district_impact: null }),
      ],
      ['an output without the field', { budget: { budgetary_impact: 0 } }],
    ])('given %s then there are none', (_label, output) => {
      expect(districtsOf(output as never)).toBeNull();
    });
  });

  describe('mergeStateDistricts', () => {
    test('given the districts of each state then it gives them as one list', () => {
      expect(mergeStateDistricts([UTAH_DISTRICTS, WYOMING_DISTRICTS_NORMALIZED])).toEqual([
        ...UTAH_DISTRICTS,
        ...WYOMING_DISTRICTS_NORMALIZED,
      ]);
    });

    test('given states with no districts yet then it skips them', () => {
      expect(mergeStateDistricts([null, UTAH_DISTRICTS, undefined])).toEqual(UTAH_DISTRICTS);
    });
  });

  describe('districtErrorSummary', () => {
    test('given no coverage then every expected district that is not saved is missing, and its state painted', () => {
      // When
      const summary = districtErrorSummary(UTAH_DISTRICTS, EXPECTED_DISTRICT_IDS);

      // Then
      expect(summary).toEqual({ errorDistrictCount: 3, errorStateAbbrs: ['WY', 'TX'] });
    });

    test('given no saved districts then nothing is missing', () => {
      expect(districtErrorSummary(null, EXPECTED_DISTRICT_IDS)).toEqual({
        errorDistrictCount: 0,
        errorStateAbbrs: [],
      });
    });

    test('given states still pending then their districts are neither counted nor painted', () => {
      // When
      const summary = districtErrorSummary(UTAH_DISTRICTS, EXPECTED_DISTRICT_IDS, {
        pendingStates: [WYOMING_REGION, TEXAS_REGION],
      });

      // Then
      expect(summary).toEqual({ errorDistrictCount: 0, errorStateAbbrs: [] });
    });

    test('given a failed state then its districts are counted and it is painted', () => {
      // When
      const summary = districtErrorSummary(UTAH_DISTRICTS, EXPECTED_DISTRICT_IDS, {
        pendingStates: [WYOMING_REGION],
        failedStates: [TEXAS_REGION],
      });

      // Then
      expect(summary).toEqual({ errorDistrictCount: 2, errorStateAbbrs: ['TX'] });
    });

    test('given a failed state with no districts listed then it is still painted', () => {
      // When
      const summary = districtErrorSummary(UTAH_DISTRICTS, ['UT-01', 'UT-02'], {
        failedStates: [TEXAS_REGION],
      });

      // Then
      expect(summary).toEqual({ errorDistrictCount: 0, errorStateAbbrs: ['TX'] });
    });
  });
});
