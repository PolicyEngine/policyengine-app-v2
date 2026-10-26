import { describe, expect, test } from 'vitest';
import { getParameterNamedParts } from '@/utils/householdValues';

const PARTS_PATH = 'gov.household.household_benefits';
const PART_VALUES = { [PARTS_PATH]: { '0000-01-01': ['snap'], '2026-01-01': ['snap', 'ssi'] } };

describe('getParameterNamedParts', () => {
  test('given the day before a change then the earlier list applies', () => {
    expect(getParameterNamedParts(PARTS_PATH, '2025-12-31', {}, PART_VALUES)).toEqual(['snap']);
  });

  test('given the day a change starts then the new list applies', () => {
    expect(getParameterNamedParts(PARTS_PATH, '2026-01-01', {}, PART_VALUES)).toEqual([
      'snap',
      'ssi',
    ]);
  });

  test('given part values and a parameter list then the part values take precedence', () => {
    const parameters = { [PARTS_PATH]: { values: { '0000-01-01': ['wic'] } } };

    expect(getParameterNamedParts(PARTS_PATH, '2025-01-01', parameters, PART_VALUES)).toEqual([
      'snap',
    ]);
  });

  test('given no part values then the parameter list is read, as on v1', () => {
    const parameters = { [PARTS_PATH]: { values: { '0000-01-01': ['wic'] } } };

    expect(getParameterNamedParts(PARTS_PATH, '2025-01-01', parameters)).toEqual(['wic']);
  });

  test('given a parameter with no values or no entry then nothing is listed', () => {
    expect(getParameterNamedParts(PARTS_PATH, '2025-01-01', {}, { [PARTS_PATH]: {} })).toEqual([]);
    expect(getParameterNamedParts('gov.unknown', '2025-01-01', {})).toEqual([]);
  });
});
