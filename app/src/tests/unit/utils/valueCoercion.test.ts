import { describe, expect, test } from 'vitest';
import { coerceByUnit, coerceByValueType } from '@/utils/valueCoercion';

describe('coerceByUnit', () => {
  describe('given bool unit', () => {
    const BOOL_UNIT = 'bool';

    test('given true boolean then returns true', () => {
      // Given
      const value = true;

      // When
      const result = coerceByUnit(value, BOOL_UNIT);

      // Then
      expect(result).toBe(true);
    });

    test('given false boolean then returns false', () => {
      // Given
      const value = false;

      // When
      const result = coerceByUnit(value, BOOL_UNIT);

      // Then
      expect(result).toBe(false);
    });

    test('given string "true" then returns true', () => {
      // Given
      const value = 'true';

      // When
      const result = coerceByUnit(value, BOOL_UNIT);

      // Then
      expect(result).toBe(true);
    });

    test('given number 1 then returns true', () => {
      // Given
      const value = 1;

      // When
      const result = coerceByUnit(value, BOOL_UNIT);

      // Then
      expect(result).toBe(true);
    });

    test('given number 0 then returns false', () => {
      // Given
      const value = 0;

      // When
      const result = coerceByUnit(value, BOOL_UNIT);

      // Then
      expect(result).toBe(false);
    });

    test('given empty string then returns false', () => {
      // Given
      const value = '';

      // When
      const result = coerceByUnit(value, BOOL_UNIT);

      // Then
      expect(result).toBe(false);
    });

    test('given null then returns false', () => {
      // Given
      const value = null;

      // When
      const result = coerceByUnit(value, BOOL_UNIT);

      // Then
      expect(result).toBe(false);
    });

    test('given undefined then returns false', () => {
      // Given
      const value = undefined;

      // When
      const result = coerceByUnit(value, BOOL_UNIT);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('given numeric unit', () => {
    const CURRENCY_UNIT = 'currency-USD';
    const PERCENTAGE_UNIT = '/1';
    const YEAR_UNIT = 'year';

    test('given valid number then returns same number', () => {
      // Given
      const value = 42.5;

      // When
      const result = coerceByUnit(value, CURRENCY_UNIT);

      // Then
      expect(result).toBe(42.5);
    });

    test('given zero then returns zero', () => {
      // Given
      const value = 0;

      // When
      const result = coerceByUnit(value, CURRENCY_UNIT);

      // Then
      expect(result).toBe(0);
    });

    test('given negative number then returns same number', () => {
      // Given
      const value = -100;

      // When
      const result = coerceByUnit(value, PERCENTAGE_UNIT);

      // Then
      expect(result).toBe(-100);
    });

    test('given numeric string then returns parsed number', () => {
      // Given
      const value = '123.45';

      // When
      const result = coerceByUnit(value, CURRENCY_UNIT);

      // Then
      expect(result).toBe(123.45);
    });

    test('given string "0" then returns zero', () => {
      // Given
      const value = '0';

      // When
      const result = coerceByUnit(value, CURRENCY_UNIT);

      // Then
      expect(result).toBe(0);
    });

    test('given string "00" then returns zero', () => {
      // Given
      const value = '00';

      // When
      const result = coerceByUnit(value, CURRENCY_UNIT);

      // Then
      expect(result).toBe(0);
    });

    test('given empty string then returns zero', () => {
      // Given
      const value = '';

      // When
      const result = coerceByUnit(value, CURRENCY_UNIT);

      // Then
      expect(result).toBe(0);
    });

    test('given non-numeric string then returns zero', () => {
      // Given
      const value = 'abc';

      // When
      const result = coerceByUnit(value, CURRENCY_UNIT);

      // Then
      expect(result).toBe(0);
    });

    test('given null then returns zero', () => {
      // Given
      const value = null;

      // When
      const result = coerceByUnit(value, YEAR_UNIT);

      // Then
      expect(result).toBe(0);
    });

    test('given undefined then returns zero', () => {
      // Given
      const value = undefined;

      // When
      const result = coerceByUnit(value, YEAR_UNIT);

      // Then
      expect(result).toBe(0);
    });

    test('given NaN then returns zero', () => {
      // Given
      const value = NaN;

      // When
      const result = coerceByUnit(value, CURRENCY_UNIT);

      // Then
      expect(result).toBe(0);
    });
  });

  describe('given null or undefined unit', () => {
    test('given null unit then treats as numeric', () => {
      // Given
      const value = 42;

      // When
      const result = coerceByUnit(value, null);

      // Then
      expect(result).toBe(42);
    });

    test('given undefined unit then treats as numeric', () => {
      // Given
      const value = '123';

      // When
      const result = coerceByUnit(value, undefined);

      // Then
      expect(result).toBe(123);
    });
  });
});

describe('coerceByValueType', () => {
  describe('given bool valueType', () => {
    const BOOL_TYPE = 'bool';

    test('given true boolean then returns true', () => {
      // Given
      const value = true;

      // When
      const result = coerceByValueType(value, BOOL_TYPE);

      // Then
      expect(result).toBe(true);
    });

    test('given false boolean then returns false', () => {
      // Given
      const value = false;

      // When
      const result = coerceByValueType(value, BOOL_TYPE);

      // Then
      expect(result).toBe(false);
    });

    test('given string "true" then returns true', () => {
      // Given
      const value = 'true';

      // When
      const result = coerceByValueType(value, BOOL_TYPE);

      // Then
      expect(result).toBe(true);
    });

    test('given number 1 then returns true', () => {
      // Given
      const value = 1;

      // When
      const result = coerceByValueType(value, BOOL_TYPE);

      // Then
      expect(result).toBe(true);
    });

    test('given number 0 then returns false', () => {
      // Given
      const value = 0;

      // When
      const result = coerceByValueType(value, BOOL_TYPE);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('given float valueType', () => {
    const FLOAT_TYPE = 'float';

    test('given valid number then returns same number', () => {
      // Given
      const value = 3.14159;

      // When
      const result = coerceByValueType(value, FLOAT_TYPE);

      // Then
      expect(result).toBe(3.14159);
    });

    test('given zero then returns zero', () => {
      // Given
      const value = 0;

      // When
      const result = coerceByValueType(value, FLOAT_TYPE);

      // Then
      expect(result).toBe(0);
    });

    test('given numeric string then returns parsed float', () => {
      // Given
      const value = '42.5';

      // When
      const result = coerceByValueType(value, FLOAT_TYPE);

      // Then
      expect(result).toBe(42.5);
    });

    test('given empty string then returns zero', () => {
      // Given
      const value = '';

      // When
      const result = coerceByValueType(value, FLOAT_TYPE);

      // Then
      expect(result).toBe(0);
    });

    test('given string "00" then returns zero', () => {
      // Given
      const value = '00';

      // When
      const result = coerceByValueType(value, FLOAT_TYPE);

      // Then
      expect(result).toBe(0);
    });
  });

  describe('given int valueType', () => {
    const INT_TYPE = 'int';

    test('given integer then returns same integer', () => {
      // Given
      const value = 42;

      // When
      const result = coerceByValueType(value, INT_TYPE);

      // Then
      expect(result).toBe(42);
    });

    test('given float then returns rounded integer', () => {
      // Given
      const value = 42.7;

      // When
      const result = coerceByValueType(value, INT_TYPE);

      // Then
      expect(result).toBe(43);
    });

    test('given float string then returns rounded integer', () => {
      // Given
      const value = '42.4';

      // When
      const result = coerceByValueType(value, INT_TYPE);

      // Then
      expect(result).toBe(42);
    });

    test('given zero then returns zero', () => {
      // Given
      const value = 0;

      // When
      const result = coerceByValueType(value, INT_TYPE);

      // Then
      expect(result).toBe(0);
    });
  });

  describe('given Enum valueType', () => {
    const ENUM_TYPE = 'Enum';

    test('given string then returns same string', () => {
      // Given
      const value = 'SINGLE';

      // When
      const result = coerceByValueType(value, ENUM_TYPE);

      // Then
      expect(result).toBe('SINGLE');
    });

    test('given number then returns string representation', () => {
      // Given
      const value = 123;

      // When
      const result = coerceByValueType(value, ENUM_TYPE);

      // Then
      expect(result).toBe('123');
    });

    test('given null then returns empty string', () => {
      // Given
      const value = null;

      // When
      const result = coerceByValueType(value, ENUM_TYPE);

      // Then
      expect(result).toBe('');
    });

    test('given undefined then returns empty string', () => {
      // Given
      const value = undefined;

      // When
      const result = coerceByValueType(value, ENUM_TYPE);

      // Then
      expect(result).toBe('');
    });
  });

  describe('given str valueType', () => {
    const STR_TYPE = 'str';

    test('given string then returns same string', () => {
      // Given
      const value = 'hello world';

      // When
      const result = coerceByValueType(value, STR_TYPE);

      // Then
      expect(result).toBe('hello world');
    });

    test('given empty string then returns empty string', () => {
      // Given
      const value = '';

      // When
      const result = coerceByValueType(value, STR_TYPE);

      // Then
      expect(result).toBe('');
    });

    test('given number then returns string representation', () => {
      // Given
      const value = 42;

      // When
      const result = coerceByValueType(value, STR_TYPE);

      // Then
      expect(result).toBe('42');
    });

    test('given boolean then returns string representation', () => {
      // Given
      const value = true;

      // When
      const result = coerceByValueType(value, STR_TYPE);

      // Then
      expect(result).toBe('true');
    });
  });

  describe('given unknown valueType', () => {
    test('given unknown type then defaults to numeric coercion', () => {
      // Given
      const value = '42.5';
      const unknownType = 'unknown_type';

      // When
      const result = coerceByValueType(value, unknownType);

      // Then
      expect(result).toBe(42.5);
    });

    test('given unknown type with non-numeric value then returns zero', () => {
      // Given
      const value = 'not a number';
      const unknownType = 'something_else';

      // When
      const result = coerceByValueType(value, unknownType);

      // Then
      expect(result).toBe(0);
    });
  });
});
