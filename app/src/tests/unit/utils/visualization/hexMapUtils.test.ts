import { describe, expect, test } from 'vitest';
import type { HexMapDataPoint } from '@/types/visualization/HexMapDataPoint';
import {
  applyHexagonalPositioning,
  calculateSymmetricRange,
  generateHoverText,
} from '@/utils/visualization/hexMapUtils';

describe('hexMapUtils', () => {
  describe('applyHexagonalPositioning', () => {
    test('given even row (y=0) then x coordinate offset by 0.5', () => {
      // Given
      const points: HexMapDataPoint[] = [
        { id: '1', label: 'Point A', value: 10, x: 0, y: 0 },
        { id: '2', label: 'Point B', value: 20, x: 1, y: 0 },
      ];

      // When
      const result = applyHexagonalPositioning(points);

      // Then
      expect(result[0].x).toBe(0.5);
      expect(result[1].x).toBe(1.5);
    });

    test('given odd row (y=1) then x coordinate unchanged', () => {
      // Given
      const points: HexMapDataPoint[] = [
        { id: '1', label: 'Point A', value: 10, x: 0, y: 1 },
        { id: '2', label: 'Point B', value: 20, x: 1, y: 1 },
      ];

      // When
      const result = applyHexagonalPositioning(points);

      // Then
      expect(result[0].x).toBe(0);
      expect(result[1].x).toBe(1);
    });

    test('given mixed even and odd rows then correct offsets applied', () => {
      // Given
      const points: HexMapDataPoint[] = [
        { id: '1', label: 'Point A', value: 10, x: 0, y: 0 }, // even
        { id: '2', label: 'Point B', value: 20, x: 0, y: 1 }, // odd
        { id: '3', label: 'Point C', value: 30, x: 0, y: 2 }, // even
        { id: '4', label: 'Point D', value: 40, x: 0, y: 3 }, // odd
      ];

      // When
      const result = applyHexagonalPositioning(points);

      // Then
      expect(result[0].x).toBe(0.5); // even row
      expect(result[1].x).toBe(0); // odd row
      expect(result[2].x).toBe(0.5); // even row
      expect(result[3].x).toBe(0); // odd row
    });

    test('given empty array then returns empty array', () => {
      // Given
      const points: HexMapDataPoint[] = [];

      // When
      const result = applyHexagonalPositioning(points);

      // Then
      expect(result).toEqual([]);
    });

    test('given positioning then other properties preserved', () => {
      // Given
      const points: HexMapDataPoint[] = [
        { id: 'test-id', label: 'Test Label', value: 123.45, x: 5, y: 0 },
      ];

      // When
      const result = applyHexagonalPositioning(points);

      // Then
      expect(result[0].id).toBe('test-id');
      expect(result[0].label).toBe('Test Label');
      expect(result[0].value).toBe(123.45);
      expect(result[0].y).toBe(0);
    });
  });

  describe('calculateSymmetricRange', () => {
    test('given positive and negative values then returns symmetric range', () => {
      // Given
      const values = [-50, 10, 30, -20];

      // When
      const result = calculateSymmetricRange(values);

      // Then
      expect(result.min).toBe(-50);
      expect(result.max).toBe(50);
    });

    test('given all positive values then returns symmetric range', () => {
      // Given
      const values = [10, 20, 30, 40];

      // When
      const result = calculateSymmetricRange(values);

      // Then
      expect(result.min).toBe(-40);
      expect(result.max).toBe(40);
    });

    test('given all negative values then returns symmetric range', () => {
      // Given
      const values = [-10, -20, -30, -40];

      // When
      const result = calculateSymmetricRange(values);

      // Then
      expect(result.min).toBe(-40);
      expect(result.max).toBe(40);
    });

    test('given single value then returns symmetric range', () => {
      // Given
      const values = [25];

      // When
      const result = calculateSymmetricRange(values);

      // Then
      expect(result.min).toBe(-25);
      expect(result.max).toBe(25);
    });

    test('given zero then returns zero range', () => {
      // Given
      const values = [0];

      // When
      const result = calculateSymmetricRange(values);

      // Then
      expect(result.min).toBe(-0);
      expect(result.max).toBe(0);
    });

    test('given mix including zero then returns correct range', () => {
      // Given
      const values = [-15, 0, 30];

      // When
      const result = calculateSymmetricRange(values);

      // Then
      expect(result.min).toBe(-30);
      expect(result.max).toBe(30);
    });
  });

  describe('generateHoverText', () => {
    test('given point and formatter then returns formatted hover text', () => {
      // Given
      const point: HexMapDataPoint = {
        id: '1',
        label: 'Westminster North',
        value: 1234.56,
        x: 0,
        y: 0,
      };
      const formatValue = (val: number) => `£${val.toFixed(0)}`;

      // When
      const result = generateHoverText(point, formatValue);

      // Then
      expect(result).toBe('Westminster North: £1235');
    });

    test('given percentage formatter then returns percentage text', () => {
      // Given
      const point: HexMapDataPoint = {
        id: '2',
        label: 'Edinburgh Central',
        value: 0.025,
        x: 1,
        y: 0,
      };
      const formatValue = (val: number) => `${(val * 100).toFixed(1)}%`;

      // When
      const result = generateHoverText(point, formatValue);

      // Then
      expect(result).toBe('Edinburgh Central: 2.5%');
    });

    test('given negative value then returns formatted negative', () => {
      // Given
      const point: HexMapDataPoint = {
        id: '3',
        label: 'Cardiff South',
        value: -567.89,
        x: 0,
        y: 1,
      };
      const formatValue = (val: number) => `£${val.toFixed(0)}`;

      // When
      const result = generateHoverText(point, formatValue);

      // Then
      expect(result).toBe('Cardiff South: £-568');
    });

    test('given zero value then returns formatted zero', () => {
      // Given
      const point: HexMapDataPoint = {
        id: '4',
        label: 'Test Area',
        value: 0,
        x: 0,
        y: 0,
      };
      const formatValue = (val: number) => `£${val.toFixed(0)}`;

      // When
      const result = generateHoverText(point, formatValue);

      // Then
      expect(result).toBe('Test Area: £0');
    });
  });
});
