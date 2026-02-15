import { describe, expect, test } from 'vitest';
import { formatParameterValue } from '@/utils/policyTableHelpers';

describe('policyTableHelpers', () => {
  describe('formatParameterValue', () => {
    describe('Integer formatting', () => {
      test('given integer with currency-USD unit then formats with one decimal place', () => {
        // Given / When
        const result = formatParameterValue(1000, 'currency-USD');

        // Then
        expect(result).toBe('$1,000.0');
      });

      test('given integer with currency-GBP unit then formats with one decimal place', () => {
        // Given / When
        const result = formatParameterValue(2500, 'currency-GBP');

        // Then
        expect(result).toBe('£2,500.0');
      });

      test('given integer with /1 unit then formats as percentage with one decimal place', () => {
        // Given / When
        const result = formatParameterValue(0.15, '/1');

        // Then
        expect(result).toBe('15.0%');
      });

      test('given integer with no unit then formats with one decimal place', () => {
        // Given / When
        const result = formatParameterValue(5000);

        // Then
        expect(result).toBe('5,000.0');
      });
    });

    describe('Decimal formatting', () => {
      test('given decimal with currency-USD unit then formats with one decimal place', () => {
        // Given / When
        const result = formatParameterValue(1234.56, 'currency-USD');

        // Then
        expect(result).toBe('$1,234.6');
      });

      test('given decimal with currency-GBP unit then formats with one decimal place', () => {
        // Given / When
        const result = formatParameterValue(789.45, 'currency-GBP');

        // Then
        expect(result).toBe('£789.5');
      });

      test('given decimal with /1 unit then formats as percentage with one decimal place', () => {
        // Given / When
        const result = formatParameterValue(0.125, '/1');

        // Then
        expect(result).toBe('12.5%');
      });

      test('given decimal with no unit then formats with one decimal place', () => {
        // Given / When
        const result = formatParameterValue(1234.5);

        // Then
        expect(result).toBe('1,234.5');
      });
    });

    describe('Percentage edge cases', () => {
      test('given decimal that becomes integer when multiplied by 100 then formats with one decimal place', () => {
        // Given / When
        const result = formatParameterValue(0.2, '/1'); // 0.2 * 100 = 20

        // Then
        expect(result).toBe('20.0%');
      });

      test('given decimal that stays decimal when multiplied by 100 then formats with one decimal place', () => {
        // Given / When
        const result = formatParameterValue(0.125, '/1'); // 0.125 * 100 = 12.5

        // Then
        expect(result).toBe('12.5%');
      });

      test('given zero then formats as 0.0%', () => {
        // Given / When
        const result = formatParameterValue(0, '/1');

        // Then
        expect(result).toBe('0.0%');
      });

      test('given one then formats as 100.0%', () => {
        // Given / When
        const result = formatParameterValue(1, '/1');

        // Then
        expect(result).toBe('100.0%');
      });
    });

    describe('Non-numeric values', () => {
      test('given string value then returns string as-is', () => {
        // Given / When
        const result = formatParameterValue('test');

        // Then
        expect(result).toBe('test');
      });

      test('given boolean value then returns boolean as string', () => {
        // Given / When
        const result = formatParameterValue(true);

        // Then
        expect(result).toBe('true');
      });

      test('given null value then returns null as string', () => {
        // Given / When
        const result = formatParameterValue(null);

        // Then
        expect(result).toBe('null');
      });

      test('given undefined value then returns undefined as string', () => {
        // Given / When
        const result = formatParameterValue(undefined);

        // Then
        expect(result).toBe('undefined');
      });
    });

    describe('Large numbers', () => {
      test('given large integer then formats with commas and one decimal place', () => {
        // Given / When
        const result = formatParameterValue(1000000, 'currency-USD');

        // Then
        expect(result).toBe('$1,000,000.0');
      });

      test('given large decimal then formats with commas and one decimal place', () => {
        // Given / When
        const result = formatParameterValue(1234567.89, 'currency-USD');

        // Then
        expect(result).toBe('$1,234,567.9');
      });
    });

    describe('Negative numbers', () => {
      test('given negative integer with currency then formats with sign before symbol', () => {
        // Given / When
        const result = formatParameterValue(-1000, 'currency-USD');

        // Then
        expect(result).toBe('-$1,000.0');
      });

      test('given negative decimal with currency then formats with sign before symbol', () => {
        // Given / When
        const result = formatParameterValue(-1234.5, 'currency-USD');

        // Then
        expect(result).toBe('-$1,234.5');
      });

      test('given negative GBP value then formats with sign before symbol', () => {
        // Given / When
        const result = formatParameterValue(-500, 'currency-GBP');

        // Then
        expect(result).toBe('-£500.0');
      });

      test('given negative percentage then formats with one decimal place', () => {
        // Given / When
        const result = formatParameterValue(-0.1, '/1');

        // Then
        expect(result).toBe('-10.0%');
      });
    });

    describe('Zero values', () => {
      test('given zero with currency-USD then formats as $0.0', () => {
        // Given / When
        const result = formatParameterValue(0, 'currency-USD');

        // Then
        expect(result).toBe('$0.0');
      });

      test('given zero with currency-GBP then formats as £0.0', () => {
        // Given / When
        const result = formatParameterValue(0, 'currency-GBP');

        // Then
        expect(result).toBe('£0.0');
      });

      test('given zero with no unit then formats as 0.0', () => {
        // Given / When
        const result = formatParameterValue(0);

        // Then
        expect(result).toBe('0.0');
      });
    });
  });
});
