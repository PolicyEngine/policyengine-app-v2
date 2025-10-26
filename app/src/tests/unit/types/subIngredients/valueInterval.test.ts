import { describe, expect, test } from 'vitest';
import { ValueIntervalCollection } from '@/types/subIngredients/valueInterval';
import {
  MOCK_VALUE_INTERVAL,
  MOCK_VALUE_INTERVAL_2,
  MOCK_VALUE_INTERVAL_3,
  MOCK_VALUE_INTERVALS,
} from '@/tests/fixtures/types/valueIntervalMocks';

describe('ValueIntervalCollection', () => {
  describe('Construction from Array', () => {
    test('given array of ValueInterval objects then creates collection', () => {
      // Given
      const intervals = MOCK_VALUE_INTERVALS;

      // When
      const collection = new ValueIntervalCollection(intervals);

      // Then
      expect(collection.getIntervals()).toEqual(intervals);
      expect(collection.getIntervals()).toHaveLength(3);
    });

    test('given array then spreads into new array to avoid reference issues', () => {
      // Given
      const originalIntervals = [MOCK_VALUE_INTERVAL, MOCK_VALUE_INTERVAL_2];

      // When
      const collection = new ValueIntervalCollection(originalIntervals);

      // Then - Should be different array instance (spread creates new array)
      expect(collection.getIntervals()).toEqual(originalIntervals);
      expect(collection.getIntervals()).not.toBe(originalIntervals);
    });

    test('given empty array then creates empty collection', () => {
      // Given
      const intervals: any[] = [];

      // When
      const collection = new ValueIntervalCollection(intervals);

      // Then
      expect(collection.getIntervals()).toEqual([]);
      expect(collection.getIntervals()).toHaveLength(0);
    });
  });

  describe('Proxy/Reference Safety', () => {
    test('given array passed to constructor then does not maintain reference', () => {
      // Given
      const originalArray = [MOCK_VALUE_INTERVAL, MOCK_VALUE_INTERVAL_2];

      // When
      const collection = new ValueIntervalCollection(originalArray);

      // Modify original array
      originalArray.push(MOCK_VALUE_INTERVAL_3);

      // Then - Collection should not be affected by mutation of original array
      expect(collection.getIntervals()).toHaveLength(2);
      expect(originalArray).toHaveLength(3);
    });

    test('given collection intervals modified externally then does not affect internal state', () => {
      // Given
      const originalArray = [MOCK_VALUE_INTERVAL, MOCK_VALUE_INTERVAL_2];
      const collection = new ValueIntervalCollection(originalArray);

      // When - Get intervals and modify them
      const intervals = collection.getIntervals();
      intervals.push(MOCK_VALUE_INTERVAL_3);

      // Then - Internal state should not be affected (getIntervals returns a copy)
      expect(collection.getIntervals()).toHaveLength(2);
      expect(intervals).toHaveLength(3);
    });

    test('given constructor receives Immer draft then spreads to avoid Proxy reference', () => {
      // Given - Simulate an Immer-like object (though this is just a plain object for testing)
      const draftLikeArray = [MOCK_VALUE_INTERVAL, MOCK_VALUE_INTERVAL_2];

      // When
      const collection = new ValueIntervalCollection(draftLikeArray);

      // Then - Should create a new array, not keep reference to draft
      const result = collection.getIntervals();
      expect(result).toEqual(draftLikeArray);
      expect(result).not.toBe(draftLikeArray); // Different array instances
    });
  });

  describe('Construction from ValueIntervalCollection', () => {
    test('given another ValueIntervalCollection then creates copy', () => {
      // Given
      const original = new ValueIntervalCollection(MOCK_VALUE_INTERVALS);

      // When
      const copy = new ValueIntervalCollection(original);

      // Then
      expect(copy.getIntervals()).toEqual(original.getIntervals());
    });
  });

  describe('Edge Cases', () => {
    test('given single interval then stores correctly', () => {
      // Given
      const singleInterval = [MOCK_VALUE_INTERVAL];

      // When
      const collection = new ValueIntervalCollection(singleInterval);

      // Then
      expect(collection.getIntervals()).toHaveLength(1);
      expect(collection.getIntervals()[0]).toEqual(MOCK_VALUE_INTERVAL);
    });

    test('given no input then creates empty collection', () => {
      // When
      const collection = new ValueIntervalCollection();

      // Then
      expect(collection.getIntervals()).toEqual([]);
      expect(collection.getIntervals()).toHaveLength(0);
    });
  });
});
