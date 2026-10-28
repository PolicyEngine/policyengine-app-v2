import { describe, expect, test } from 'vitest';
import {
  placeOnUKHexLayout,
  placeUKHexMap,
  UK_HEX_LAYOUTS,
  ukHexPosition,
  withheldUKAreaCodes,
  withheldUKHexAreas,
} from '@/components/visualization/choropleth/ukHexLayout';
import {
  ALLERDALE_CODE,
  ALLERDALE_POINT,
  BARNSLEY_NORTH_CODE,
  BARNSLEY_NORTH_HEX,
  BARNSLEY_NORTH_POINT,
  CARDIFF_EAST_CODE,
  CARDIFF_EAST_NAME,
  CARDIFF_NORTH_CODE,
  CARDIFF_NORTH_NAME,
  CARDIFF_WEST_CODE,
  CONSTITUENCY_REGION,
  DARLINGTON_POINT,
  HARTLEPOOL_CODE,
  HARTLEPOOL_HEX,
  HARTLEPOOL_NAME,
  HARTLEPOOL_POINT,
  LISTED_WITHHELD_WELSH_CONSTITUENCY_CODES,
  UK_WIDE_REGION,
  UNCODED_POINT,
  WALES_REGION,
  WELSH_CONSTITUENCY_COUNT,
  WELSH_CONSTITUENCY_POINTS,
} from '@/tests/fixtures/components/visualization/choropleth/ukHexLayoutMocks';
import {
  EXPECTED_CONSTITUENCY_COUNT,
  EXPECTED_LOCAL_AUTHORITY_COUNT,
} from '@/tests/fixtures/data/uk_geography/ukGeographyReference';

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

describe('withheldUKHexAreas', () => {
  test("given a Wales report with three constituencies then it lists Wales's other constituencies", () => {
    // When
    const areas = withheldUKHexAreas('constituency', WELSH_CONSTITUENCY_POINTS, WALES_REGION);

    // Then
    const reportedCodes = WELSH_CONSTITUENCY_POINTS.map((point) => point.code);
    expect(areas).toHaveLength(WELSH_CONSTITUENCY_COUNT - WELSH_CONSTITUENCY_POINTS.length);
    expect(areas.every((area) => area.id.startsWith('W'))).toBe(true);
    expect(areas.some((area) => reportedCodes.includes(area.id))).toBe(false);
  });

  test('given a withheld constituency then it is at its layout position, named from the boundary file', () => {
    // When
    const areas = withheldUKHexAreas('constituency', WELSH_CONSTITUENCY_POINTS, WALES_REGION);

    // Then
    expect(areas.find((area) => area.id === CARDIFF_EAST_CODE)).toEqual({
      id: CARDIFF_EAST_CODE,
      label: CARDIFF_EAST_NAME,
      ...ukHexPosition('constituency', CARDIFF_EAST_CODE),
    });
  });

  test.each([
    ['a UK-wide report', UK_WIDE_REGION],
    ['no region', undefined],
  ])('given %s then it lists every constituency the result leaves out', (_, region) => {
    // When
    const areas = withheldUKHexAreas('constituency', [BARNSLEY_NORTH_POINT], region);

    // Then
    expect(areas).toHaveLength(EXPECTED_CONSTITUENCY_COUNT - 1);
    expect(areas.some((area) => area.id === BARNSLEY_NORTH_CODE)).toBe(false);
  });

  test('given local authorities then it reads the local authority layout and names', () => {
    // When
    const areas = withheldUKHexAreas('local_authority', [DARLINGTON_POINT], UK_WIDE_REGION);

    // Then
    expect(areas).toHaveLength(EXPECTED_LOCAL_AUTHORITY_COUNT - 1);
    expect(areas.find((area) => area.id === HARTLEPOOL_CODE)).toEqual({
      id: HARTLEPOOL_CODE,
      label: HARTLEPOOL_NAME,
      x: HARTLEPOOL_HEX[0],
      y: HARTLEPOOL_HEX[1] + 1,
    });
  });

  test("given every one of a nation's areas reported then it lists none", () => {
    // Given
    const everyWelshConstituency = Object.keys(UK_HEX_LAYOUTS.constituency)
      .filter((code) => code.startsWith('W'))
      .map((code) => ({ id: code, label: code, value: 1, code }));

    // When
    const areas = withheldUKHexAreas('constituency', everyWelshConstituency, WALES_REGION);

    // Then
    expect(areas).toEqual([]);
  });

  test.each([
    ['an area without a code', [BARNSLEY_NORTH_POINT, UNCODED_POINT], UK_WIDE_REGION],
    ['a code the layout lacks', [HARTLEPOOL_POINT], UK_WIDE_REGION],
    ["an area outside the report's nation", [BARNSLEY_NORTH_POINT], WALES_REGION],
    ['a region that is neither the UK nor a nation', [BARNSLEY_NORTH_POINT], CONSTITUENCY_REGION],
  ])(
    'given %s then the result cannot be matched to the layout, and it lists none',
    (_, points, region) => {
      // When
      const areas = withheldUKHexAreas('constituency', points, region);

      // Then
      expect(areas).toEqual([]);
    }
  );

  test('given a local authority on a pre-2023 code then it lists none', () => {
    // When
    const areas = withheldUKHexAreas(
      'local_authority',
      [DARLINGTON_POINT, ALLERDALE_POINT],
      UK_WIDE_REGION
    );

    // Then
    expect(areas).toEqual([]);
  });
});

describe('placeUKHexMap', () => {
  test("given a disclosure-controlled level then it places the result's areas tiled and lists the region's others as withheld", () => {
    // When
    const hexMap = placeUKHexMap('constituency', WELSH_CONSTITUENCY_POINTS, {
      disclosureControlled: true,
      region: WALES_REGION,
    });

    // Then
    expect(hexMap.tiled).toBe(true);
    expect(hexMap.points).toEqual(
      placeOnUKHexLayout('constituency', WELSH_CONSTITUENCY_POINTS).points
    );
    expect(hexMap.withheldAreas).toHaveLength(
      WELSH_CONSTITUENCY_COUNT - WELSH_CONSTITUENCY_POINTS.length
    );
    expect(hexMap.withheldAreas.some((area) => area.id === CARDIFF_EAST_CODE)).toBe(true);
  });

  test('given a level that is not disclosure-controlled then it places the areas and lists no withheld ones', () => {
    // When
    const hexMap = placeUKHexMap('constituency', WELSH_CONSTITUENCY_POINTS, {
      disclosureControlled: false,
      region: WALES_REGION,
    });

    // Then
    expect(hexMap.tiled).toBe(true);
    expect(hexMap.withheldAreas).toEqual([]);
  });

  test("given an area the layout cannot place then every area keeps its result's position, untiled, with no withheld areas", () => {
    // When
    const hexMap = placeUKHexMap('constituency', [BARNSLEY_NORTH_POINT, UNCODED_POINT], {
      disclosureControlled: true,
      region: UK_WIDE_REGION,
    });

    // Then
    expect(hexMap).toEqual({
      points: [BARNSLEY_NORTH_POINT, UNCODED_POINT],
      tiled: false,
      withheldAreas: [],
      noDataAreas: [],
    });
  });
});

describe('withheldUKAreaCodes with a breakdown’s list of withheld codes', () => {
  const welshCodes = WELSH_CONSTITUENCY_POINTS.map((point) => point.code);

  test('given a list then only its codes are withheld, and the region’s other absent areas have no data', () => {
    // When
    const missing = withheldUKAreaCodes(
      'constituency',
      welshCodes,
      WALES_REGION,
      LISTED_WITHHELD_WELSH_CONSTITUENCY_CODES
    );

    // Then
    expect(missing?.codes).toEqual(LISTED_WITHHELD_WELSH_CONSTITUENCY_CODES);
    expect(missing?.noDataCodes).toHaveLength(
      WELSH_CONSTITUENCY_COUNT - welshCodes.length - LISTED_WITHHELD_WELSH_CONSTITUENCY_CODES.length
    );
    expect(missing?.noDataCodes).toContain(CARDIFF_NORTH_CODE);
    expect(missing?.total).toBe(WELSH_CONSTITUENCY_COUNT);
  });

  test('given an empty list then none is withheld and every absent area has no data', () => {
    // When
    const missing = withheldUKAreaCodes('constituency', welshCodes, WALES_REGION, []);

    // Then
    expect(missing?.codes).toEqual([]);
    expect(missing?.noDataCodes).toHaveLength(WELSH_CONSTITUENCY_COUNT - welshCodes.length);
  });

  test.each([
    ['a null', null],
    ['an absent', undefined],
  ])(
    'given %s list then every absent area is withheld, as before, and none has no data',
    (_, list) => {
      // When
      const missing = withheldUKAreaCodes('constituency', welshCodes, WALES_REGION, list);

      // Then
      expect(missing?.codes).toHaveLength(WELSH_CONSTITUENCY_COUNT - welshCodes.length);
      expect(missing?.noDataCodes).toEqual([]);
    }
  );

  test('given a listed code outside the report’s nation then it is not withheld', () => {
    // When: an English constituency in a Wales breakdown's list
    const missing = withheldUKAreaCodes('constituency', welshCodes, WALES_REGION, [
      BARNSLEY_NORTH_CODE,
      CARDIFF_EAST_CODE,
    ]);

    // Then
    expect(missing?.codes).toEqual([CARDIFF_EAST_CODE]);
  });

  test('given a listed code the result also publishes then it is not withheld', () => {
    // When
    const missing = withheldUKAreaCodes('constituency', welshCodes, WALES_REGION, [
      welshCodes[0]!,
      CARDIFF_EAST_CODE,
    ]);

    // Then
    expect(missing?.codes).toEqual([CARDIFF_EAST_CODE]);
    expect(missing?.noDataCodes).not.toContain(welshCodes[0]);
  });

  test('given a list and a result that cannot be matched to the layout then it gives nothing, as without one', () => {
    // When
    const missing = withheldUKAreaCodes(
      'constituency',
      [...welshCodes, undefined],
      WALES_REGION,
      LISTED_WITHHELD_WELSH_CONSTITUENCY_CODES
    );

    // Then
    expect(missing).toBeNull();
  });
});

describe('placeUKHexMap with a breakdown’s list of withheld codes', () => {
  test('given a disclosure-controlled level with a list then it draws the listed areas as withheld and the others as having no data', () => {
    // When
    const hexMap = placeUKHexMap('constituency', WELSH_CONSTITUENCY_POINTS, {
      disclosureControlled: true,
      region: WALES_REGION,
      listedWithheldCodes: LISTED_WITHHELD_WELSH_CONSTITUENCY_CODES,
    });

    // Then
    expect(hexMap.withheldAreas.map((area) => area.id)).toEqual([
      CARDIFF_EAST_CODE,
      CARDIFF_WEST_CODE,
    ]);
    expect(hexMap.noDataAreas).toHaveLength(
      WELSH_CONSTITUENCY_COUNT -
        WELSH_CONSTITUENCY_POINTS.length -
        LISTED_WITHHELD_WELSH_CONSTITUENCY_CODES.length
    );
    expect(hexMap.noDataAreas.find((area) => area.id === CARDIFF_NORTH_CODE)).toEqual({
      id: CARDIFF_NORTH_CODE,
      label: CARDIFF_NORTH_NAME,
      ...ukHexPosition('constituency', CARDIFF_NORTH_CODE),
    });
  });

  test('given an empty list then no area is withheld and every absent one has no data', () => {
    // When
    const hexMap = placeUKHexMap('constituency', WELSH_CONSTITUENCY_POINTS, {
      disclosureControlled: true,
      region: WALES_REGION,
      listedWithheldCodes: [],
    });

    // Then
    expect(hexMap.withheldAreas).toEqual([]);
    expect(hexMap.noDataAreas).toHaveLength(
      WELSH_CONSTITUENCY_COUNT - WELSH_CONSTITUENCY_POINTS.length
    );
  });

  test('given a disclosure-controlled level with a null list then every absent area is withheld, as before', () => {
    // When
    const hexMap = placeUKHexMap('constituency', WELSH_CONSTITUENCY_POINTS, {
      disclosureControlled: true,
      region: WALES_REGION,
      listedWithheldCodes: null,
    });

    // Then
    expect(hexMap.withheldAreas).toHaveLength(
      WELSH_CONSTITUENCY_COUNT - WELSH_CONSTITUENCY_POINTS.length
    );
    expect(hexMap.noDataAreas).toEqual([]);
  });

  test('given a list on a level that is not disclosure-controlled then it draws neither', () => {
    // When
    const hexMap = placeUKHexMap('constituency', WELSH_CONSTITUENCY_POINTS, {
      disclosureControlled: false,
      region: WALES_REGION,
      listedWithheldCodes: LISTED_WITHHELD_WELSH_CONSTITUENCY_CODES,
    });

    // Then
    expect(hexMap.withheldAreas).toEqual([]);
    expect(hexMap.noDataAreas).toEqual([]);
  });

  test('given a list and an area the layout cannot place then it draws neither, untiled', () => {
    // When
    const hexMap = placeUKHexMap('constituency', [...WELSH_CONSTITUENCY_POINTS, UNCODED_POINT], {
      disclosureControlled: true,
      region: WALES_REGION,
      listedWithheldCodes: LISTED_WITHHELD_WELSH_CONSTITUENCY_CODES,
    });

    // Then
    expect(hexMap.tiled).toBe(false);
    expect(hexMap.withheldAreas).toEqual([]);
    expect(hexMap.noDataAreas).toEqual([]);
  });
});
