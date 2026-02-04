import { describe, expect, test } from 'vitest';
import { formatParameterValue } from '@/utils/policyTableHelpers';

describe('policyTableHelpers', () => {
  describe('formatParameterValue', () => {
    describe('default behavior (up to 2 decimals, none for whole numbers)', () => {
      describe('Integer formatting', () => {
        test('given integer with currency-USD unit then formats with no decimals', () => {
          // Given / When
          const result = formatParameterValue(1000, 'currency-USD');

          // Then
          expect(result).toBe('$1,000');
        });

        test('given integer with currency-GBP unit then formats with no decimals', () => {
          // Given / When
          const result = formatParameterValue(2500, 'currency-GBP');

          // Then
          expect(result).toBe('£2,500');
        });

        test('given integer with /1 unit then formats as percentage with no decimals', () => {
          // Given / When
          const result = formatParameterValue(0.15, '/1');

          // Then
          expect(result).toBe('15%');
        });

        test('given integer with no unit then formats with no decimals', () => {
          // Given / When
          const result = formatParameterValue(5000, null);

          // Then
          expect(result).toBe('5,000');
        });
      });

      describe('Decimal formatting', () => {
        test('given decimal with currency-USD unit then formats with up to 2 decimals', () => {
          // Given / When
          const result = formatParameterValue(1234.56, 'currency-USD');

          // Then
          expect(result).toBe('$1,234.56');
        });

        test('given decimal with currency-GBP unit then formats with up to 2 decimals', () => {
          // Given / When
          const result = formatParameterValue(789.45, 'currency-GBP');

          // Then
          expect(result).toBe('£789.45');
        });

        test('given decimal with /1 unit then formats as percentage with up to 2 decimals', () => {
          // Given / When
          const result = formatParameterValue(0.125, '/1');

          // Then
          expect(result).toBe('12.5%');
        });

        test('given decimal with no unit then formats with up to 2 decimals', () => {
          // Given / When
          const result = formatParameterValue(1234.5, null);

          // Then
          expect(result).toBe('1,234.5');
        });

        test('given value with more than 2 decimals then rounds to 2', () => {
          // Given / When
          const result = formatParameterValue(1234.567, 'currency-USD');

          // Then
          expect(result).toBe('$1,234.57');
        });
      });

      describe('Percentage edge cases', () => {
        test('given decimal that becomes integer when multiplied by 100 then formats with no decimals', () => {
          // Given / When
          const result = formatParameterValue(0.2, '/1'); // 0.2 * 100 = 20

          // Then
          expect(result).toBe('20%');
        });

        test('given zero then formats as 0%', () => {
          // Given / When
          const result = formatParameterValue(0, '/1');

          // Then
          expect(result).toBe('0%');
        });

        test('given one then formats as 100%', () => {
          // Given / When
          const result = formatParameterValue(1, '/1');

          // Then
          expect(result).toBe('100%');
        });
      });

      describe('Boolean formatting', () => {
        test('given true with bool unit then returns True', () => {
          // Given / When
          const result = formatParameterValue(true, 'bool');

          // Then
          expect(result).toBe('True');
        });

        test('given false with bool unit then returns False', () => {
          // Given / When
          const result = formatParameterValue(false, 'bool');

          // Then
          expect(result).toBe('False');
        });

        test('given true with abolition unit then returns True', () => {
          // Given / When
          const result = formatParameterValue(true, 'abolition');

          // Then
          expect(result).toBe('True');
        });
      });

      describe('Null and undefined values', () => {
        test('given null value then returns N/A', () => {
          // Given / When
          const result = formatParameterValue(null, 'currency-USD');

          // Then
          expect(result).toBe('N/A');
        });

        test('given undefined value then returns N/A', () => {
          // Given / When
          const result = formatParameterValue(undefined, 'currency-USD');

          // Then
          expect(result).toBe('N/A');
        });
      });

      describe('Zero values', () => {
        test('given zero with currency-USD then formats as $0', () => {
          // Given / When
          const result = formatParameterValue(0, 'currency-USD');

          // Then
          expect(result).toBe('$0');
        });

        test('given zero with currency-GBP then formats as £0', () => {
          // Given / When
          const result = formatParameterValue(0, 'currency-GBP');

          // Then
          expect(result).toBe('£0');
        });

        test('given zero with no unit then formats as 0', () => {
          // Given / When
          const result = formatParameterValue(0, null);

          // Then
          expect(result).toBe('0');
        });
      });
    });

    describe('with explicit decimal places', () => {
      test('given 2 decimal places then formats with exactly 2 decimals', () => {
        // Given / When
        const result = formatParameterValue(1000, 'currency-USD', { decimalPlaces: 2 });

        // Then
        expect(result).toBe('$1,000.00');
      });

      test('given 0 decimal places then formats with no decimals', () => {
        // Given / When
        const result = formatParameterValue(1234.56, 'currency-USD', { decimalPlaces: 0 });

        // Then
        expect(result).toBe('$1,235');
      });

      test('given 3 decimal places then formats with exactly 3 decimals', () => {
        // Given / When
        const result = formatParameterValue(1234.5, 'currency-USD', { decimalPlaces: 3 });

        // Then
        expect(result).toBe('$1,234.500');
      });
    });
  });
});
