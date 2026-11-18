import { describe, expect, test } from 'vitest';
import { colors } from '@/designTokens';
import { reliefColor, reliefScale } from '@/libs/flagship/explore/reliefScale';

describe('reliefScale', () => {
  test('given values then the lowest sits at 0 and the highest at 1', () => {
    const scale = reliefScale([0.05, 0.1, 0.15]);

    expect(scale.position(0.05)).toBe(0);
    expect(scale.position(0.1)).toBeCloseTo(0.5);
    expect(scale.position(0.15)).toBe(1);
  });

  test('given one extreme value among many then it does not flatten the others', () => {
    const values = [...Array.from({ length: 99 }, (_, i) => 0.1 + i * 0.001), 5];
    const scale = reliefScale(values);

    expect(scale.high).toBeLessThan(1);
    expect(scale.position(5)).toBe(1);
    expect(scale.position(0.15)).toBeGreaterThan(0.4);
  });

  test('given equal values then every one sits in the middle', () => {
    expect(reliefScale([0.2, 0.2]).position(0.2)).toBe(0.5);
  });

  test('given no values then the scale still answers', () => {
    expect(reliefScale([]).position(1)).toBe(0.5);
  });
});

describe('reliefColor', () => {
  test('given the ends of the scale then it gives the lightest and the darkest teal', () => {
    expect(reliefColor(0)).toBe(colors.primary[50].toLowerCase());
    expect(reliefColor(1)).toBe(colors.primary[900].toLowerCase());
  });

  test('given a position past an end then it stays at that end', () => {
    expect(reliefColor(-1)).toBe(reliefColor(0));
    expect(reliefColor(2)).toBe(reliefColor(1));
  });
});
