import { describe, test, expect } from 'vitest';
import {
  FixedLengthSet,
  lengthen,
  shorten,
  changeSizeTo,
  setAt,
  removeAt,
  get,
  findFirstEmpty,
  findIndex,
  getCompactArray,
  hasEmpty,
  isFull,
  swap,
  fromArray,
} from '@/types/FixedLengthSet';
import {
  EMPTY_SET_SIZE_2,
  EMPTY_SET_SIZE_3,
  MIXED_SET_WITH_NULLS,
  FULL_STRING_SET,
  TEST_VALUES,
  INDEX_VALUES,
} from '@/tests/fixtures/types/FixedLengthSet';

describe('FixedLengthSet', () => {
  describe('constructor', () => {
    test('given length 0 then creates empty array', () => {
      const set = FixedLengthSet(0);
      expect(set).toEqual([]);
    });

    test('given positive length then creates array filled with nulls', () => {
      const set = FixedLengthSet(3);
      expect(set).toEqual([null, null, null]);
      expect(set.length).toBe(3);
    });

    test('given type parameter then maintains type safety', () => {
      const set = FixedLengthSet<string>(2);
      expect(set).toEqual([null, null]);
    });
  });

  describe('lengthen', () => {
    test('given empty set when lengthening by 2 then adds 2 nulls', () => {
      const set = FixedLengthSet(0);
      const result = lengthen(set, 2);
      expect(result).toEqual([null, null]);
    });

    test('given set with values when lengthening then preserves existing values', () => {
      const set = setAt(EMPTY_SET_SIZE_2, 0, TEST_VALUES.FIRST);
      const result = lengthen(set, 1);
      expect(result).toEqual([TEST_VALUES.FIRST, null, null]);
    });

    test('given zero count then returns unchanged set', () => {
      const result = lengthen(EMPTY_SET_SIZE_2, 0);
      expect(result).toEqual(EMPTY_SET_SIZE_2);
    });
  });

  describe('shorten', () => {
    test('given set when shortening by 1 then removes last element', () => {
      const result = shorten(EMPTY_SET_SIZE_3, 1);
      expect(result).toEqual([null, null]);
    });

    test('given set when shortening by more than length then returns empty array', () => {
      const result = shorten(EMPTY_SET_SIZE_2, 5);
      expect(result).toEqual([]);
    });

    test('given set with values when shortening then preserves remaining values', () => {
      const set = fromArray([TEST_VALUES.FIRST, TEST_VALUES.SECOND, null]);
      const result = shorten(set, 1);
      expect(result).toEqual([TEST_VALUES.FIRST, TEST_VALUES.SECOND]);
    });

    test('given zero count then returns unchanged set', () => {
      const result = shorten(EMPTY_SET_SIZE_2, 0);
      expect(result).toEqual(EMPTY_SET_SIZE_2);
    });
  });

  describe('changeSizeTo', () => {
    test('given smaller size then shortens set', () => {
      const result = changeSizeTo(EMPTY_SET_SIZE_3, 1);
      expect(result).toEqual([null]);
    });

    test('given larger size then lengthens set', () => {
      const result = changeSizeTo(EMPTY_SET_SIZE_2, 4);
      expect(result).toEqual([null, null, null, null]);
    });

    test('given same size then returns unchanged set', () => {
      const result = changeSizeTo(EMPTY_SET_SIZE_2, 2);
      expect(result).toEqual(EMPTY_SET_SIZE_2);
    });

    test('given zero size then returns empty array', () => {
      const result = changeSizeTo(EMPTY_SET_SIZE_2, 0);
      expect(result).toEqual([]);
    });
  });

  describe('setAt', () => {
    test('given valid index and value then sets value at position', () => {
      const result = setAt(EMPTY_SET_SIZE_3, INDEX_VALUES.FIRST, TEST_VALUES.FIRST);
      expect(result).toEqual([TEST_VALUES.FIRST, null, null]);
    });

    test('given valid index and null then sets null at position', () => {
      const set = fromArray([TEST_VALUES.FIRST, TEST_VALUES.SECOND, null]);
      const result = setAt(set, INDEX_VALUES.SECOND, null);
      expect(result).toEqual([TEST_VALUES.FIRST, null, null]);
    });

    test('given negative index then throws error', () => {
      expect(() => setAt(EMPTY_SET_SIZE_2, -1, TEST_VALUES.FIRST)).toThrow(
        'Index -1 out of bounds for FixedLengthSet of length 2'
      );
    });

    test('given index beyond bounds then throws error', () => {
      expect(() => setAt(EMPTY_SET_SIZE_2, 5, TEST_VALUES.FIRST)).toThrow(
        'Index 5 out of bounds for FixedLengthSet of length 2'
      );
    });
  });

  describe('removeAt', () => {
    test('given valid index with value then sets to null', () => {
      const set = fromArray([TEST_VALUES.FIRST, TEST_VALUES.SECOND]);
      const result = removeAt(set, INDEX_VALUES.FIRST);
      expect(result).toEqual([null, TEST_VALUES.SECOND]);
    });

    test('given valid index already null then remains null', () => {
      const result = removeAt(EMPTY_SET_SIZE_2, INDEX_VALUES.FIRST);
      expect(result).toEqual([null, null]);
    });

    test('given invalid index then throws error', () => {
      expect(() => removeAt(EMPTY_SET_SIZE_2, 3)).toThrow(
        'Index 3 out of bounds for FixedLengthSet of length 2'
      );
    });
  });

  describe('get', () => {
    test('given valid index with value then returns value', () => {
      const set = setAt(EMPTY_SET_SIZE_2, INDEX_VALUES.FIRST, TEST_VALUES.FIRST);
      const result = get(set, INDEX_VALUES.FIRST);
      expect(result).toBe(TEST_VALUES.FIRST);
    });

    test('given valid index with null then returns null', () => {
      const result = get(EMPTY_SET_SIZE_2, INDEX_VALUES.FIRST);
      expect(result).toBeNull();
    });

    test('given index beyond bounds then returns null', () => {
      const result = get(EMPTY_SET_SIZE_2, 10);
      expect(result).toBeNull();
    });

    test('given negative index then returns null', () => {
      const result = get(EMPTY_SET_SIZE_2, -1);
      expect(result).toBeNull();
    });
  });

  describe('findFirstEmpty', () => {
    test('given all nulls then returns 0', () => {
      const result = findFirstEmpty(EMPTY_SET_SIZE_3);
      expect(result).toBe(0);
    });

    test('given mixed values then returns first null index', () => {
      const result = findFirstEmpty(MIXED_SET_WITH_NULLS);
      expect(result).toBe(1);
    });

    test('given no nulls then returns -1', () => {
      const result = findFirstEmpty(FULL_STRING_SET);
      expect(result).toBe(-1);
    });

    test('given empty array then returns -1', () => {
      const result = findFirstEmpty([]);
      expect(result).toBe(-1);
    });
  });

  describe('findIndex', () => {
    test('given predicate matching value then returns correct index', () => {
      const result = findIndex(MIXED_SET_WITH_NULLS, (val) => val === TEST_VALUES.THIRD);
      expect(result).toBe(2);
    });

    test('given predicate matching null then returns first null index', () => {
      const result = findIndex(MIXED_SET_WITH_NULLS, (val) => val === null);
      expect(result).toBe(1);
    });

    test('given predicate with no match then returns -1', () => {
      const result = findIndex(FULL_STRING_SET, (val) => val === 'nonexistent');
      expect(result).toBe(-1);
    });

    test('given predicate using index then works correctly', () => {
      const result = findIndex(MIXED_SET_WITH_NULLS, (val, idx) => idx === 2);
      expect(result).toBe(2);
    });
  });

  describe('getCompactArray', () => {
    test('given all nulls then returns empty array', () => {
      const result = getCompactArray(EMPTY_SET_SIZE_3);
      expect(result).toEqual([]);
    });

    test('given mixed values then returns only non-null values', () => {
      const result = getCompactArray(MIXED_SET_WITH_NULLS);
      expect(result).toEqual([TEST_VALUES.FIRST, TEST_VALUES.THIRD]);
    });

    test('given no nulls then returns all values', () => {
      const result = getCompactArray(FULL_STRING_SET);
      expect(result).toEqual([TEST_VALUES.FIRST, TEST_VALUES.SECOND, TEST_VALUES.THIRD]);
    });

    test('given empty array then returns empty array', () => {
      const result = getCompactArray([]);
      expect(result).toEqual([]);
    });
  });

  describe('hasEmpty', () => {
    test('given all nulls then returns true', () => {
      const result = hasEmpty(EMPTY_SET_SIZE_3);
      expect(result).toBe(true);
    });

    test('given mixed values then returns true', () => {
      const result = hasEmpty(MIXED_SET_WITH_NULLS);
      expect(result).toBe(true);
    });

    test('given no nulls then returns false', () => {
      const result = hasEmpty(FULL_STRING_SET);
      expect(result).toBe(false);
    });

    test('given empty array then returns false', () => {
      const result = hasEmpty([]);
      expect(result).toBe(false);
    });
  });

  describe('isFull', () => {
    test('given all nulls then returns false', () => {
      const result = isFull(EMPTY_SET_SIZE_3);
      expect(result).toBe(false);
    });

    test('given mixed values then returns false', () => {
      const result = isFull(MIXED_SET_WITH_NULLS);
      expect(result).toBe(false);
    });

    test('given no nulls then returns true', () => {
      const result = isFull(FULL_STRING_SET);
      expect(result).toBe(true);
    });

    test('given empty array then returns true', () => {
      const result = isFull([]);
      expect(result).toBe(true);
    });
  });

  describe('swap', () => {
    test('given two valid indices then swaps values', () => {
      const set = fromArray([TEST_VALUES.FIRST, TEST_VALUES.SECOND, TEST_VALUES.THIRD]);
      const result = swap(set, INDEX_VALUES.FIRST, INDEX_VALUES.THIRD);
      expect(result).toEqual([TEST_VALUES.THIRD, TEST_VALUES.SECOND, TEST_VALUES.FIRST]);
    });

    test('given same index then returns unchanged', () => {
      const result = swap(FULL_STRING_SET, INDEX_VALUES.SECOND, INDEX_VALUES.SECOND);
      expect(result).toEqual(FULL_STRING_SET);
    });

    test('given null positions then swaps nulls', () => {
      const result = swap(MIXED_SET_WITH_NULLS, INDEX_VALUES.FIRST, INDEX_VALUES.SECOND);
      expect(result).toEqual([null, TEST_VALUES.FIRST, TEST_VALUES.THIRD]);
    });

    test('given index out of bounds then throws error', () => {
      expect(() => swap(EMPTY_SET_SIZE_2, 0, 5)).toThrow(
        'Indices out of bounds for swap operation'
      );
    });

    test('given negative index then throws error', () => {
      expect(() => swap(EMPTY_SET_SIZE_2, -1, 0)).toThrow(
        'Indices out of bounds for swap operation'
      );
    });
  });

  describe('fromArray', () => {
    test('given array then returns copy as FixedLengthSet', () => {
      const original = [TEST_VALUES.FIRST, null, TEST_VALUES.SECOND];
      const result = fromArray(original);
      expect(result).toEqual(original);
      expect(result).not.toBe(original); // Should be a copy
    });

    test('given empty array then returns empty FixedLengthSet', () => {
      const result = fromArray([]);
      expect(result).toEqual([]);
    });

    test('given typed array then maintains type', () => {
      const stringArray: (string | null)[] = [TEST_VALUES.FIRST, null];
      const result = fromArray(stringArray);
      expect(result).toEqual(stringArray);
    });
  });
});