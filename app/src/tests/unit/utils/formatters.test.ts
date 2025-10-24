import { describe, expect, test } from 'vitest';
import { formatPercent, ordinal, precision } from '@/utils/formatters';

describe('formatters utilities', () => {
  describe('ordinal', () => {
    test('given 1-3 then returns st/nd/rd suffixes', () => {
      expect(ordinal(1)).toBe('1st');
      expect(ordinal(2)).toBe('2nd');
      expect(ordinal(3)).toBe('3rd');
    });

    test('given 4-10 then returns th suffix', () => {
      expect(ordinal(4)).toBe('4th');
      expect(ordinal(10)).toBe('10th');
    });

    test('given 11-13 then returns th suffix (edge case)', () => {
      // Edge case: 11, 12, 13 should be "th" not "st/nd/rd"
      expect(ordinal(11)).toBe('11th');
      expect(ordinal(12)).toBe('12th');
      expect(ordinal(13)).toBe('13th');
    });

    test('given 21-23 then returns st/nd/rd suffixes', () => {
      expect(ordinal(21)).toBe('21st');
      expect(ordinal(22)).toBe('22nd');
      expect(ordinal(23)).toBe('23rd');
    });
  });

  describe('precision', () => {
    test('given large interval then returns 0 decimal places', () => {
      const values = [0, 100, 200];
      expect(precision(values, 1)).toBe(0);
    });

    test('given small interval then returns appropriate precision', () => {
      const values = [0, 1];
      expect(precision(values, 1)).toBe(1);
    });

    test('given tiny interval then returns high precision', () => {
      const values = [0, 0.001];
      expect(precision(values, 1)).toBe(4);
    });

    test('given negative values then calculates correctly', () => {
      const values = [-5, 0, 5];
      expect(precision(values, 1)).toBe(0);
    });

    test('given empty array then returns 0', () => {
      expect(precision([], 1)).toBe(0);
    });
  });

  describe('formatPercent', () => {
    test('given decimal value then formats as percentage', () => {
      expect(formatPercent(0.05, 'us')).toBe('5%');
      expect(formatPercent(-0.05, 'us')).toBe('-5%');
    });

    test('given options then respects precision', () => {
      const result = formatPercent(0.0525, 'us', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
      expect(result).toBe('5.3%');
    });
  });
});
