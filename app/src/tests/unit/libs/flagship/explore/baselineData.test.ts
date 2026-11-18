import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, test } from 'vitest';
import {
  baselineDataUrl,
  districtIdOf,
  isBaselineFile,
  regionLevel,
  regionName,
  regionsAt,
  stateCodeOf,
  statesCombined,
  type BaselineFile,
} from '@/libs/flagship/explore/baselineData';
import { BASELINE_FIXTURE } from '@/tests/fixtures/libs/flagship/explore/baselineFixtures';

const PUBLIC = resolve(__dirname, '../../../../../../public');
const readJson = (path: string) => JSON.parse(readFileSync(resolve(PUBLIC, path), 'utf8'));

describe('baselineData', () => {
  test('given the states then their combined rate weights each by its people', () => {
    // Ohio 10.6% of 11.8M people and California 15.4% of 39M.
    expect(statesCombined(BASELINE_FIXTURE, 'poverty', 'people')).toBeCloseTo(0.1429, 3);
  });

  test('given a weight no state has then there is no combined figure', () => {
    expect(statesCombined(BASELINE_FIXTURE, 'poverty', 'tax_units')).toBeUndefined();
  });

  test('given region names then each reads as its level', () => {
    expect(regionLevel('us')).toBe('nation');
    expect(regionLevel('state/oh')).toBe('state');
    expect(regionLevel('congressional_district/OH-09')).toBe('district');
  });

  test('given a state or district then its state code and district id are found', () => {
    expect(stateCodeOf('state/oh')).toBe('OH');
    expect(stateCodeOf('congressional_district/OH-09')).toBe('OH');
    expect(stateCodeOf('us')).toBeNull();
    expect(districtIdOf('congressional_district/OH-09')).toBe('OH-09');
    expect(districtIdOf('state/oh')).toBeNull();
  });

  test('given a state then only its districts are listed', () => {
    expect(regionsAt(BASELINE_FIXTURE, 'district', 'OH').sort()).toEqual([
      'congressional_district/OH-01',
      'congressional_district/OH-09',
    ]);
    expect(regionsAt(BASELINE_FIXTURE, 'state')).toHaveLength(2);
  });

  test('given the nation then its name reads in a sentence', () => {
    expect(regionName(BASELINE_FIXTURE, 'us')).toBe('the United States');
    expect(regionName(BASELINE_FIXTURE, 'state/oh')).toBe('Ohio');
  });

  test('given a file without the nation then it is not a baseline file', () => {
    expect(isBaselineFile(BASELINE_FIXTURE)).toBe(true);
    expect(isBaselineFile({ ...BASELINE_FIXTURE, regions: {} })).toBe(false);
    expect(isBaselineFile(null)).toBe(false);
  });

  test('given the US 2026 file then it covers the nation, 51 states and 436 districts', () => {
    const file: BaselineFile = readJson(baselineDataUrl('us', 2026).slice(1));

    expect(isBaselineFile(file)).toBe(true);
    expect(regionsAt(file, 'state')).toHaveLength(51);
    expect(regionsAt(file, 'district')).toHaveLength(436);
  });

  test('given the map files then every shape has figures, and every figure has a shape', () => {
    const file: BaselineFile = readJson('data/baseline/us/2026.json');
    const states = readJson('data/geojson/us_states.topo.json');
    const districts = readJson('data/geojson/us_districts.topo.json');
    const ids = (topology: any, object: string) =>
      topology.objects[object].geometries.map((g: any) => g.properties.id).sort();

    expect(ids(states, 'states')).toEqual(
      regionsAt(file, 'state')
        .map((region) => stateCodeOf(region))
        .sort()
    );
    expect(ids(districts, 'districts')).toEqual(
      regionsAt(file, 'district')
        .map((region) => districtIdOf(region))
        .sort()
    );
  });
});
