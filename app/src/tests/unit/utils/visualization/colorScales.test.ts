import { describe, expect, test } from 'vitest';
import { interpolateColor } from '@/utils/visualization/colorScales';

describe('interpolateColor', () => {
  test('given value at minimum then returns first color', () => {
    // Given
    const scaleColors = ['#000000', '#808080', '#ffffff'];

    // When
    const result = interpolateColor(0, 0, 100, scaleColors);

    // Then
    expect(result).toBe('#000000');
  });

  test('given value at maximum then returns last color', () => {
    // Given
    const scaleColors = ['#000000', '#808080', '#ffffff'];

    // When
    const result = interpolateColor(100, 0, 100, scaleColors);

    // Then
    expect(result).toBe('#ffffff');
  });

  test('given value at midpoint of two colors then returns middle color', () => {
    // Given
    const scaleColors = ['#000000', '#ffffff'];

    // When
    const result = interpolateColor(50, 0, 100, scaleColors);

    // Then — should be roughly #808080
    expect(result).toMatch(/^#[0-9a-f]{6}$/i);
    // Parse and check it's approximately midway
    const r = parseInt(result.slice(1, 3), 16);
    expect(r).toBeGreaterThan(110);
    expect(r).toBeLessThan(145);
  });

  test('given value below minimum then clamps to first color', () => {
    // Given
    const scaleColors = ['#ff0000', '#00ff00'];

    // When
    const result = interpolateColor(-10, 0, 100, scaleColors);

    // Then
    expect(result).toBe('#ff0000');
  });

  test('given value above maximum then clamps to last color', () => {
    // Given
    const scaleColors = ['#ff0000', '#00ff00'];

    // When
    const result = interpolateColor(150, 0, 100, scaleColors);

    // Then
    expect(result).toBe('#00ff00');
  });

  test('given min equals max then returns first color', () => {
    // Given
    const scaleColors = ['#ff0000', '#00ff00'];

    // When
    const result = interpolateColor(50, 50, 50, scaleColors);

    // Then
    expect(result).toBe('#ff0000');
  });

  test('given five-color scale at quarter position then interpolates between first two', () => {
    // Given — 5 colors spans 4 segments, so 0.25 of range hits boundary of segment 0 and 1
    const scaleColors = ['#000000', '#404040', '#808080', '#c0c0c0', '#ffffff'];

    // When — value at 25% of range (boundary between segment 0 and 1)
    const result = interpolateColor(25, 0, 100, scaleColors);

    // Then — should be exactly second color
    expect(result).toBe('#404040');
  });
});
