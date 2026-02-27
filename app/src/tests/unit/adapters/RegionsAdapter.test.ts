import { describe, expect, test } from 'vitest';
import { RegionsAdapter } from '@/adapters/RegionsAdapter';
import {
  mockRegionList,
  mockV2Region,
  mockV2RegionNational,
  mockV2RegionUKConstituency,
} from '@/tests/fixtures/api/v2/regionMocks';

describe('RegionsAdapter', () => {
  describe('regionFromV2', () => {
    test('given state region then maps code to name and label to label', () => {
      const input = mockV2Region();
      const result = RegionsAdapter.regionFromV2(input);
      expect(result.name).toBe('state/ca');
      expect(result.label).toBe('California');
      expect(result.type).toBe('state');
    });

    test('given region with state_code then maps to state_abbreviation', () => {
      const input = mockV2Region({ state_code: 'CA', state_name: 'California' });
      const result = RegionsAdapter.regionFromV2(input);
      expect(result.state_abbreviation).toBe('CA');
      expect(result.state_name).toBe('California');
    });

    test('given region with null state_code then sets state_abbreviation to undefined', () => {
      const input = mockV2RegionNational();
      const result = RegionsAdapter.regionFromV2(input);
      expect(result.state_abbreviation).toBeUndefined();
      expect(result.state_name).toBeUndefined();
    });

    test('given UK constituency then maps region_type to type', () => {
      const input = mockV2RegionUKConstituency();
      const result = RegionsAdapter.regionFromV2(input);
      expect(result.type).toBe('constituency');
      expect(result.name).toBe('constituency/Sheffield Central');
    });
  });

  describe('regionsFromV2', () => {
    test('given array of regions then maps all', () => {
      const input = mockRegionList();
      const result = RegionsAdapter.regionsFromV2(input);
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('us');
      expect(result[1].name).toBe('state/ca');
    });

    test('given empty array then returns empty array', () => {
      const result = RegionsAdapter.regionsFromV2([]);
      expect(result).toEqual([]);
    });
  });
});
