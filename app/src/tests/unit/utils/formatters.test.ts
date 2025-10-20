import { describe, expect, test } from 'vitest';
import { formatCurrencyAbbr } from '@/utils/formatters';

describe('formatCurrencyAbbr', () => {
  test('given trillions with 1 decimal option then formats with tn suffix', () => {
    // When
    const result = formatCurrencyAbbr(2.3e12, 'us', { maximumFractionDigits: 1 });

    // Then
    expect(result).toBe('$2.3tn');
  });

  test('given billions with 1 decimal option then formats with bn suffix', () => {
    // When
    const result = formatCurrencyAbbr(12.3e9, 'us', { maximumFractionDigits: 1 });

    // Then
    expect(result).toBe('$12.3bn');
  });

  test('given millions with 0 decimals then formats with m suffix', () => {
    // When
    const result = formatCurrencyAbbr(301e6, 'us', { maximumFractionDigits: 0 });

    // Then
    expect(result).toBe('$301m');
  });

  test('given thousands with 1 decimal then formats with k suffix', () => {
    // When
    const result = formatCurrencyAbbr(1200, 'us', { maximumFractionDigits: 1 });

    // Then
    expect(result).toBe('$1.2k');
  });

  test('given small number with 0 decimals then formats without suffix', () => {
    // When
    const result = formatCurrencyAbbr(500, 'us', { maximumFractionDigits: 0 });

    // Then
    expect(result).toBe('$500');
  });

  test('given negative billions with 1 decimal then formats correctly', () => {
    // When
    const result = formatCurrencyAbbr(-12.3e9, 'us', { maximumFractionDigits: 1 });

    // Then
    expect(result).toBe('-$12.3bn');
  });

  test('given custom maximumFractionDigits then applies rounding', () => {
    // When
    const result = formatCurrencyAbbr(2.3456e12, 'us', { maximumFractionDigits: 2 });

    // Then
    expect(result).toBe('$2.35tn');
  });

  test('given UK country with 0 decimals then formats as GBP', () => {
    // When
    const result = formatCurrencyAbbr(5e9, 'uk', { maximumFractionDigits: 0 });

    // Then
    expect(result).toBe('£5bn');
  });

  test('given zero with 0 decimals then formats without suffix', () => {
    // When
    const result = formatCurrencyAbbr(0, 'us', { maximumFractionDigits: 0 });

    // Then
    expect(result).toBe('$0');
  });

  test('given 1 fraction digit option then formats correctly', () => {
    // When
    const result = formatCurrencyAbbr(2.567e9, 'us', { maximumFractionDigits: 1 });

    // Then
    expect(result).toBe('$2.6bn');
  });

  test('given boundary at 1 trillion with 0 decimals then uses tn suffix', () => {
    // When
    const result = formatCurrencyAbbr(1e12, 'us', { maximumFractionDigits: 0 });

    // Then
    expect(result).toBe('$1tn');
  });

  test('given boundary at 1 billion with 0 decimals then uses bn suffix', () => {
    // When
    const result = formatCurrencyAbbr(1e9, 'us', { maximumFractionDigits: 0 });

    // Then
    expect(result).toBe('$1bn');
  });

  test('given boundary at 1 million with 0 decimals then uses m suffix', () => {
    // When
    const result = formatCurrencyAbbr(1e6, 'us', { maximumFractionDigits: 0 });

    // Then
    expect(result).toBe('$1m');
  });

  test('given boundary at 1 thousand with 0 decimals then uses k suffix', () => {
    // When
    const result = formatCurrencyAbbr(1e3, 'us', { maximumFractionDigits: 0 });

    // Then
    expect(result).toBe('$1k');
  });
});
