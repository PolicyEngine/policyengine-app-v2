import { describe, expect, test } from 'vitest';
import {
  UK_NATION_NAMES,
  ukNationFromCode,
  ukNationFromRegion,
} from '@/components/visualization/choropleth/ukAreaBoundaries';
import { NORTHERN_IRELAND_REGION_CODE } from '@/tests/fixtures/models/regionMocks';

describe('ukNationFromRegion', () => {
  test.each([
    ['country/england', 'england'],
    ['country/scotland', 'scotland'],
    ['country/wales', 'wales'],
    [NORTHERN_IRELAND_REGION_CODE, 'northern_ireland'],
  ])("given the report's region %s then the map shows %s", (region, nation) => {
    expect(ukNationFromRegion(region)).toBe(nation);
  });

  test.each([undefined, null, '', 'uk', 'constituency/Belfast East'])(
    "given the report's region %s then the map shows the whole UK",
    (region) => {
      expect(ukNationFromRegion(region)).toBeNull();
    }
  );

  test("given a Northern Ireland report then its areas' ONS codes are the same nation", () => {
    const nation = ukNationFromRegion(NORTHERN_IRELAND_REGION_CODE);

    expect(ukNationFromCode('N06000001')).toBe(nation);
    expect(nation && UK_NATION_NAMES[nation]).toBe('Northern Ireland');
  });
});
