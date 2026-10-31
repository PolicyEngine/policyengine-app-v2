import { describe, expect, test } from 'vitest';
import {
  combinedMissingParameters,
  policyMissingParameters,
  reformMissingParameters,
} from '@/libs/flagship/missingParameters';
import {
  REMOVED_UK_PARAMETER,
  REMOVED_US_PARAMETER,
} from '@/tests/fixtures/libs/flagship/missingParametersMocks';

describe('policyMissingParameters', () => {
  test('given the API lists parameters then they are returned', () => {
    expect(policyMissingParameters({ missing_parameters: [REMOVED_US_PARAMETER] })).toEqual([
      REMOVED_US_PARAMETER,
    ]);
  });

  test.each([
    ['an absent field', {}],
    ['null', { missing_parameters: null }],
    ['no policy', undefined],
    ['a value that is not a list', { missing_parameters: 'gov.example' as unknown as string[] }],
  ])('given %s then nothing is missing', (_description, policy) => {
    expect(policyMissingParameters(policy)).toEqual([]);
  });

  test('given entries that are not paths then only the paths are kept', () => {
    const reported = [REMOVED_US_PARAMETER, 7, null] as unknown as string[];

    expect(policyMissingParameters({ missing_parameters: reported })).toEqual([
      REMOVED_US_PARAMETER,
    ]);
  });
});

describe('combinedMissingParameters', () => {
  test('given two policies then each parameter is listed once, in order', () => {
    expect(
      combinedMissingParameters([
        { missing_parameters: [REMOVED_US_PARAMETER, REMOVED_UK_PARAMETER] },
        { missing_parameters: [REMOVED_UK_PARAMETER] },
        undefined,
      ])
    ).toEqual([REMOVED_UK_PARAMETER, REMOVED_US_PARAMETER]);
  });
});

describe('reformMissingParameters', () => {
  test('given a reform without the field then nothing is missing', () => {
    expect(reformMissingParameters({})).toEqual([]);
    expect(reformMissingParameters(undefined)).toEqual([]);
  });
});
