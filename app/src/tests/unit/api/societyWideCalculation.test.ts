import { describe, expect, test } from 'vitest';
import { getDatasetForRegion } from '@/api/societyWideCalculation';

describe('societyWide API', () => {
  describe('getDatasetForRegion', () => {
    test('given US country and US region then returns enhanced_cps', () => {
      // When
      const result = getDatasetForRegion('us', 'us');

      // Then
      expect(result).toBe('enhanced_cps');
    });

    test('given US country and state region then returns undefined', () => {
      // When
      const result = getDatasetForRegion('us', 'ca');

      // Then
      expect(result).toBeUndefined();
    });

    test('given UK country then returns undefined', () => {
      // When
      const result = getDatasetForRegion('uk', 'uk');

      // Then
      expect(result).toBeUndefined();
    });

    test('given CA country then returns undefined', () => {
      // When
      const result = getDatasetForRegion('ca', 'ca');

      // Then
      expect(result).toBeUndefined();
    });
  });
});
