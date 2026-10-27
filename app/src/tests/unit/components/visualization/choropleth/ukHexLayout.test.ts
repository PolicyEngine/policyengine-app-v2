import { describe, expect, test } from 'vitest';
import {
  placeOnUKHexLayout,
  UK_HEX_LAYOUTS,
  ukHexPosition,
} from '@/components/visualization/choropleth/ukHexLayout';
import {
  ALLERDALE_CODE,
  ALLERDALE_POINT,
  BARNSLEY_NORTH_CODE,
  BARNSLEY_NORTH_HEX,
  BARNSLEY_NORTH_POINT,
  DARLINGTON_POINT,
  HARTLEPOOL_CODE,
  HARTLEPOOL_HEX,
  HARTLEPOOL_POINT,
  UNCODED_POINT,
} from '@/tests/fixtures/components/visualization/choropleth/ukHexLayoutMocks';

describe('ukHexPosition', () => {
  test('given a constituency code then it gives the layout column and the row moved up by one', () => {
    // When
    const position = ukHexPosition('constituency', BARNSLEY_NORTH_CODE);

    // Then
    expect(UK_HEX_LAYOUTS.constituency[BARNSLEY_NORTH_CODE]).toEqual(BARNSLEY_NORTH_HEX);
    expect(position).toEqual({ x: BARNSLEY_NORTH_HEX[0], y: BARNSLEY_NORTH_HEX[1] + 1 });
  });

  test('given a local authority code then it reads the local authority layout', () => {
    // When
    const position = ukHexPosition('local_authority', HARTLEPOOL_CODE);

    // Then
    expect(position).toEqual({ x: HARTLEPOOL_HEX[0], y: HARTLEPOOL_HEX[1] + 1 });
  });

  test('given an odd layout row then the hex map shifts it, as odd-r rows are', () => {
    // Given
    const oddRow = Object.entries(UK_HEX_LAYOUTS.constituency).find(
      ([, [, r]]) => Math.abs(r % 2) === 1
    )!;

    // When
    const position = ukHexPosition('constituency', oddRow[0])!;

    // Then: the hex map shifts its even rows (applyHexagonalPositioning)
    expect(Math.abs(position.y % 2)).toBe(0);
  });

  test.each([
    ['an unknown code', 'E99999999'],
    ['no code', undefined],
    ['a local authority code at the constituency level', HARTLEPOOL_CODE],
  ])('given %s then it gives no position', (_, code) => {
    // When
    const position = ukHexPosition('constituency', code);

    // Then
    expect(position).toBeNull();
  });

  test('given the layouts then northern areas sit on higher rows than southern ones', () => {
    // Given
    const layout = UK_HEX_LAYOUTS.constituency;
    const scottishRows = Object.entries(layout)
      .filter(([code]) => code.startsWith('S'))
      .map(([, [, r]]) => r);
    const englishRows = Object.entries(layout)
      .filter(([code]) => code.startsWith('E'))
      .map(([, [, r]]) => r);

    // Then
    expect(Math.min(...scottishRows)).toBeGreaterThan(Math.min(...englishRows));
    expect(Math.max(...scottishRows)).toBeGreaterThan(Math.max(...englishRows));
  });
});

describe('placeOnUKHexLayout', () => {
  test('given the pre-2023 local authority code then the layout has no position for it', () => {
    // Then
    expect(ukHexPosition('local_authority', ALLERDALE_CODE)).toBeNull();
  });

  test('given points whose codes the layout has then each takes its layout position, tiled', () => {
    // When
    const placement = placeOnUKHexLayout('constituency', [BARNSLEY_NORTH_POINT]);

    // Then
    expect(placement).toEqual({
      points: [{ ...BARNSLEY_NORTH_POINT, x: BARNSLEY_NORTH_HEX[0], y: BARNSLEY_NORTH_HEX[1] + 1 }],
      tiled: true,
    });
  });

  test('given a local authority then it reads the local authority layout', () => {
    // When
    const placement = placeOnUKHexLayout('local_authority', [HARTLEPOOL_POINT]);

    // Then
    expect(placement.points[0]).toEqual({
      ...HARTLEPOOL_POINT,
      x: HARTLEPOOL_HEX[0],
      y: HARTLEPOOL_HEX[1] + 1,
    });
  });

  test('given a point without a code then every point keeps its own position, untiled', () => {
    // When
    const placement = placeOnUKHexLayout('constituency', [BARNSLEY_NORTH_POINT, UNCODED_POINT]);

    // Then: one grid for every point, not layout positions mixed with the result's
    expect(placement).toEqual({ points: [BARNSLEY_NORTH_POINT, UNCODED_POINT], tiled: false });
  });

  test("given a code the level's layout lacks then every point keeps its own position, untiled", () => {
    // When: a local authority code at the constituency level
    const placement = placeOnUKHexLayout('constituency', [BARNSLEY_NORTH_POINT, HARTLEPOOL_POINT]);

    // Then
    expect(placement).toEqual({ points: [BARNSLEY_NORTH_POINT, HARTLEPOOL_POINT], tiled: false });
  });

  test('given a local authority on a pre-2023 code then every point keeps its own position, untiled', () => {
    // When
    const placement = placeOnUKHexLayout('local_authority', [DARLINGTON_POINT, ALLERDALE_POINT]);

    // Then
    expect(placement).toEqual({ points: [DARLINGTON_POINT, ALLERDALE_POINT], tiled: false });
  });

  test('given every code in the layout then no point keeps its own position', () => {
    // When
    const placement = placeOnUKHexLayout('local_authority', [DARLINGTON_POINT, HARTLEPOOL_POINT]);

    // Then
    expect(placement.points.map(({ x, y }) => [x, y])).toEqual([
      [7, 19],
      [HARTLEPOOL_HEX[0], HARTLEPOOL_HEX[1] + 1],
    ]);
    expect(placement.tiled).toBe(true);
  });
});
