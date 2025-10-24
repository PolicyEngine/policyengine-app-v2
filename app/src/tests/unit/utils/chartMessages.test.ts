import { describe, expect, test } from 'vitest';
import { absoluteChangeMessage, relativeChangeMessage } from '@/utils/chartMessages';

describe('chartMessages utilities', () => {
  describe('absoluteChangeMessage', () => {
    test('given positive change then returns increase message', () => {
      const formatter = (n: number) => `$${n.toFixed(0)}`;
      const result = absoluteChangeMessage('This reform', 'tax revenues', 100, 0, formatter);

      expect(result).toContain('would increase tax revenues by $100');
    });

    test('given negative change then returns decrease message', () => {
      const formatter = (n: number) => `$${n.toFixed(0)}`;
      const result = absoluteChangeMessage('This reform', 'tax revenues', -100, 0, formatter);

      expect(result).toContain('would decrease tax revenues by $100');
    });

    test('given zero change then returns no effect message', () => {
      const formatter = (n: number) => `$${n}`;
      const result = absoluteChangeMessage('This reform', 'the budget', 0, 0, formatter);

      expect(result).toContain('would have no effect on the budget');
    });

    test('given change below tolerance then returns less than message', () => {
      const formatter = (n: number) => `$${n}`;
      const result = absoluteChangeMessage('This reform', 'spending', 0.5, 1, formatter);

      expect(result).toContain('would increase spending by less than');
      expect(result).toContain('$1');
    });
  });

  describe('relativeChangeMessage', () => {
    test('given positive change then returns increase message with percentage', () => {
      const result = relativeChangeMessage('This reform', 'household income', 0.05, 0.001, 'us');

      expect(result).toContain('would increase household income by');
      expect(result).toContain('5.0%');
    });

    test('given negative change then returns decrease message with percentage', () => {
      const result = relativeChangeMessage('This reform', 'household income', -0.03, 0.001, 'us');

      expect(result).toContain('would decrease household income by');
      expect(result).toContain('3.0%');
    });

    test('given zero change then returns no effect message', () => {
      const result = relativeChangeMessage('This reform', 'net income', 0, 0.001, 'us');

      expect(result).toContain('would have no effect on net income');
    });

    test('given change below tolerance then returns less than message', () => {
      const result = relativeChangeMessage('This reform', 'income', 0.0005, 0.001, 'us');

      expect(result).toContain('would increase income by less than');
      expect(result).toContain('0.1%');
    });

    test('given message then includes word wrapping with br tags', () => {
      const result = relativeChangeMessage(
        'This reform',
        'the income of households',
        0.05,
        0.001,
        'us'
      );

      // Should have line breaks for word wrapping
      expect(result).toContain('<br>');
    });
  });
});
