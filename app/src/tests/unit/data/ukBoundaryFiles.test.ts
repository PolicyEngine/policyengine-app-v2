import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, test } from 'vitest';
import {
  UK_AREA_COUNTS_BY_NATION,
  ukNationFromCode,
} from '@/components/visualization/choropleth/ukAreaBoundaries';
import { UK_HEX_LAYOUTS } from '@/components/visualization/choropleth/ukHexLayout';
import {
  BOUNDARY_FILE_DIRECTORY,
  CONSTITUENCY_BOUNDARY_FILE,
  EXPECTED_CONSTITUENCY_COUNT,
  EXPECTED_LOCAL_AUTHORITY_COUNT,
  LOCAL_AUTHORITY_BOUNDARY_FILE,
  MAX_BOUNDARY_FILE_BYTES,
  PY_CONSTITUENCIES_CSV,
  PY_LOCAL_AUTHORITIES_CSV,
  readPyAreaList,
} from '@/tests/fixtures/data/uk_geography/ukGeographyReference';

type Ring = [number, number][];
interface BoundaryFeature {
  properties: Record<string, string>;
  geometry:
    | { type: 'Polygon'; coordinates: Ring[] }
    | { type: 'MultiPolygon'; coordinates: Ring[][] };
}

function readBoundaries(fileName: string): BoundaryFeature[] {
  const text = fs.readFileSync(path.join(BOUNDARY_FILE_DIRECTORY, fileName), 'utf8');
  return JSON.parse(text).features;
}

/** Twice the ring's signed area in degrees: negative when it runs clockwise. */
function signedArea(ring: Ring): number {
  let total = 0;
  for (let index = 0; index < ring.length - 1; index++) {
    total += ring[index][0] * ring[index + 1][1] - ring[index + 1][0] * ring[index][1];
  }
  return total;
}

const LEVELS = [
  {
    level: 'constituency',
    boundaryLevel: 'constituency' as const,
    boundaryFile: CONSTITUENCY_BOUNDARY_FILE,
    referenceFile: PY_CONSTITUENCIES_CSV,
    codeProperty: 'PCON24CD',
    nameProperty: 'PCON24NM',
    expectedCount: EXPECTED_CONSTITUENCY_COUNT,
  },
  {
    level: 'local authority',
    boundaryLevel: 'local_authority' as const,
    boundaryFile: LOCAL_AUTHORITY_BOUNDARY_FILE,
    referenceFile: PY_LOCAL_AUTHORITIES_CSV,
    codeProperty: 'LAD23CD',
    nameProperty: 'LAD23NM',
    expectedCount: EXPECTED_LOCAL_AUTHORITY_COUNT,
  },
];

describe.each(LEVELS)(
  'UK $level boundary file',
  ({ boundaryLevel, boundaryFile, referenceFile, codeProperty, nameProperty, expectedCount }) => {
    test("given the file's codes then each nation has the area count the withheld notes use", () => {
      // Given
      const counts: Record<string, number> = {};

      // When
      for (const feature of readBoundaries(boundaryFile)) {
        const nation = ukNationFromCode(feature.properties[codeProperty]) ?? 'none';
        counts[nation] = (counts[nation] ?? 0) + 1;
      }

      // Then
      expect(counts).toEqual(UK_AREA_COUNTS_BY_NATION[boundaryLevel]);
    });

    test(`given the hex layout then it places exactly the file's ${expectedCount} codes, each on its own hex`, () => {
      // Given
      const layout = UK_HEX_LAYOUTS[boundaryLevel];
      const boundaryCodes = readBoundaries(boundaryFile).map(
        (feature) => feature.properties[codeProperty]
      );

      // When
      const positions = Object.values(layout).map(([q, r]) => `${q},${r}`);

      // Then
      expect(Object.keys(layout).sort()).toEqual([...boundaryCodes].sort());
      expect(Object.values(layout).every((position) => position.length === 2)).toBe(true);
      expect(new Set(positions).size).toBe(expectedCount);
    });

    test(`given .py 6.10.0's list then the file holds exactly its ${expectedCount} codes, once each`, () => {
      // Given
      const referenceCodes = readPyAreaList(referenceFile).map((area) => area.code);

      // When
      const boundaryCodes = readBoundaries(boundaryFile).map(
        (feature) => feature.properties[codeProperty]
      );

      // Then
      expect(referenceCodes).toHaveLength(expectedCount);
      expect(boundaryCodes).toHaveLength(expectedCount);
      expect(new Set(boundaryCodes).size).toBe(expectedCount);
      expect([...boundaryCodes].sort()).toEqual([...referenceCodes].sort());
    });

    test("given .py 6.10.0's list then each boundary has its area's name", () => {
      // Given
      const referenceNames = new Map(
        readPyAreaList(referenceFile).map((area) => [area.code, area.name])
      );

      // When
      const mismatches = readBoundaries(boundaryFile).filter(
        (feature) =>
          referenceNames.get(feature.properties[codeProperty]) !== feature.properties[nameProperty]
      );

      // Then
      expect(mismatches).toEqual([]);
    });

    test('given the file then it is simplified, under 2 MB', () => {
      // When
      const bytes = fs.statSync(path.join(BOUNDARY_FILE_DIRECTORY, boundaryFile)).size;

      // Then
      expect(bytes).toBeLessThan(MAX_BOUNDARY_FILE_BYTES);
    });

    test('given the file then outlines run clockwise and holes anticlockwise, as d3-geo reads them', () => {
      // When
      const reversed = readBoundaries(boundaryFile).filter((feature) => {
        const polygons =
          feature.geometry.type === 'Polygon'
            ? [feature.geometry.coordinates]
            : feature.geometry.coordinates;
        return polygons.some(
          ([outline, ...holes]) =>
            signedArea(outline) >= 0 || holes.some((hole) => signedArea(hole) <= 0)
        );
      });

      // Then: a reversed outline would fill the whole map.
      expect(reversed.map((feature) => feature.properties[codeProperty])).toEqual([]);
    });
  }
);
