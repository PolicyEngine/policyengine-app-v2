import { describe, expect, test } from 'vitest';
import { container, title } from '@/tests/fixtures/styles/sample.css';

describe('vanilla-extract integration', () => {
  test('given a style definition then it produces a string class name', () => {
    // Given / When - styles are imported from .css.ts fixture

    // Then - VE styles compile to string class names
    expect(typeof container).toBe('string');
    expect(typeof title).toBe('string');
  });

  test('given two style definitions then they produce distinct class names', () => {
    // Given / When - two different styles from same file

    // Then - each style gets a unique class name
    expect(container).not.toBe(title);
  });

  test('given a style definition then the class name is non-empty', () => {
    // Then
    expect(container.length).toBeGreaterThan(0);
    expect(title.length).toBeGreaterThan(0);
  });
});
