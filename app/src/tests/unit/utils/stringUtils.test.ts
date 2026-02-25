import { describe, expect, test } from 'vitest';
import { capitalize } from '@/utils/stringUtils';

describe('capitalize', () => {
  test('given lowercase word then capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  test('given uppercase word then keeps it uppercase', () => {
    expect(capitalize('HELLO')).toBe('HELLO');
  });

  test('given single character then capitalizes it', () => {
    expect(capitalize('a')).toBe('A');
  });

  test('given empty string then returns empty string', () => {
    expect(capitalize('')).toBe('');
  });

  test('given multi-word string then capitalizes only first letter', () => {
    expect(capitalize('hello world')).toBe('Hello world');
  });
});
