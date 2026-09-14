import { describe, expect, test } from 'vitest';
import {
  MOCK_VALUE_INTERVAL,
  MOCK_VALUE_INTERVAL_2,
  MOCK_VALUE_INTERVAL_3,
  MOCK_VALUE_INTERVALS,
} from '@/tests/fixtures/types/valueIntervalMocks';
import { ValueIntervalCollection } from '@/types/subIngredients/valueInterval';

const ONE_DAY_INTERVAL = {
  startDate: '2026-04-15',
  endDate: '2026-04-15',
  value: 100,
};

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

    test('given equal inclusive bounds when adding an interval then stores one policy day', () => {
      const collection = new ValueIntervalCollection();

      collection.addInterval(ONE_DAY_INTERVAL);

      expect(collection.getIntervals()).toEqual([ONE_DAY_INTERVAL]);
    });

    test('given the start is after the end when adding an interval then rejects it', () => {
      const collection = new ValueIntervalCollection();

      expect(() =>
        collection.addInterval({
          startDate: '2026-04-16',
          endDate: '2026-04-15',
          value: 100,
        })
      ).toThrow('start date 2026-04-16 must be on or before end date 2026-04-15');
    });

    test('given values on consecutive effective dates then represents the first as one day', () => {
      const collection = new ValueIntervalCollection({
        '2026-04-15': 100,
        '2026-04-16': 200,
      });

      expect(collection.getIntervals()).toEqual([
        ONE_DAY_INTERVAL,
        { startDate: '2026-04-16', endDate: '2100-12-31', value: 200 },
      ]);
    });

    test('given a one-day replacement inside a longer interval then preserves both sides', () => {
      const collection = new ValueIntervalCollection([
        { startDate: '2026-04-01', endDate: '2026-04-30', value: 50 },
      ]);

      collection.addInterval(ONE_DAY_INTERVAL);

      expect(collection.getIntervals()).toEqual([
        { startDate: '2026-04-01', endDate: '2026-04-14', value: 50 },
        ONE_DAY_INTERVAL,
        { startDate: '2026-04-16', endDate: '2026-04-30', value: 50 },
      ]);
    });

    test('given a one-day replacement on a daylight-saving transition then preserves both sides', () => {
      const collection = new ValueIntervalCollection([
        { startDate: '2026-03-01', endDate: '2026-03-31', value: 50 },
      ]);
      const transitionDateInterval = {
        startDate: '2026-03-08',
        endDate: '2026-03-08',
        value: 100,
      };

      collection.addInterval(transitionDateInterval);

      expect(collection.getIntervals()).toEqual([
        { startDate: '2026-03-01', endDate: '2026-03-07', value: 50 },
        transitionDateInterval,
        { startDate: '2026-03-09', endDate: '2026-03-31', value: 50 },
      ]);
    });

    test('given adjacent one-day intervals with equal values then merges them', () => {
      const collection = new ValueIntervalCollection([ONE_DAY_INTERVAL]);

      collection.addInterval({
        startDate: '2026-04-16',
        endDate: '2026-04-16',
        value: 100,
      });

      expect(collection.getIntervals()).toEqual([
        { startDate: '2026-04-15', endDate: '2026-04-16', value: 100 },
      ]);
    });
  });

  describe('Date lookup', () => {
    test('given a covered date then returns the complete matching interval', () => {
      const collection = new ValueIntervalCollection(MOCK_VALUE_INTERVALS);

      const interval = collection.getIntervalAtDate(MOCK_VALUE_INTERVAL.startDate);

      expect(interval).toEqual(MOCK_VALUE_INTERVAL);
      expect(interval).not.toBe(MOCK_VALUE_INTERVAL);
    });

    test('given an uncovered date then returns undefined', () => {
      const collection = new ValueIntervalCollection(MOCK_VALUE_INTERVALS);

      expect(collection.getIntervalAtDate('1900-01-01')).toBeUndefined();
    });

    test('given a starting date then returns the remaining schedule with its first interval clipped', () => {
      const source = [
        { startDate: '2025-01-01', endDate: '2026-12-31', value: 100 },
        { startDate: '2027-01-01', endDate: '2100-12-31', value: 200 },
      ];
      const collection = new ValueIntervalCollection(source);

      const result = collection.getIntervalsFromDate('2026-01-01');

      expect(result).toEqual([
        { startDate: '2026-01-01', endDate: '2026-12-31', value: 100 },
        { startDate: '2027-01-01', endDate: '2100-12-31', value: 200 },
      ]);
      expect(result[1]).not.toBe(source[1]);
    });
  });

  describe('Interval removal', () => {
    test('given a matching interval then removes that complete interval', () => {
      const intervalToRemove = {
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        value: 1_000,
      };
      const retainedInterval = {
        startDate: '2027-01-01',
        endDate: '2100-12-31',
        value: 2_000,
      };
      const collection = new ValueIntervalCollection([intervalToRemove, retainedInterval]);

      collection.removeInterval(intervalToRemove);

      expect(collection.getIntervals()).toEqual([retainedInterval]);
    });
  });
});
