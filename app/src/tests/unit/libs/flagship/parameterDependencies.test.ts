import { describe, expect, test } from 'vitest';
import {
  normalizeParameterPath,
  ParameterDependencyMap,
  readersOfPath,
  variablesReachedByPaths,
} from '@/libs/flagship/parameterDependencies';
import {
  CTC_AMOUNT_FOLDER_PATH,
  CTC_BASE_AMOUNT_PATH,
  CTC_FULLY_REFUNDABLE_PATH,
  mockParameterDependencyMap as map,
  SNAP_STANDARD_DEDUCTION_PATH,
  STANDARD_DEDUCTION_PATH,
  UNTRACED_BRACKET_PATH,
} from '@/tests/fixtures/libs/flagship/parameterDependenciesMocks';

describe('normalizeParameterPath', () => {
  test('given a bracket path then it cuts at the first index', () => {
    expect(normalizeParameterPath(CTC_BASE_AMOUNT_PATH)).toBe('gov.irs.credits.ctc.amount.base');
  });

  test('given a plain path then it is unchanged', () => {
    expect(normalizeParameterPath(SNAP_STANDARD_DEDUCTION_PATH)).toBe(SNAP_STANDARD_DEDUCTION_PATH);
  });
});

describe('readersOfPath', () => {
  test('given a bracket leaf then the scale node readers return', () => {
    expect(readersOfPath(CTC_BASE_AMOUNT_PATH, map)).toEqual(['ctc_child_individual_maximum']);
  });

  test('given a folder path then readers of every descendant return', () => {
    expect(readersOfPath(CTC_AMOUNT_FOLDER_PATH, map)).toEqual([
      'ctc_adult_individual_maximum',
      'ctc_child_individual_maximum',
    ]);
  });

  test('given the most specific ancestor then it wins over shorter ones', () => {
    const nested: ParameterDependencyMap = {
      ...map,
      readers: { 'gov.a': ['broad'], 'gov.a.b': ['narrow'] },
    };
    expect(readersOfPath('gov.a.b.c', nested)).toEqual(['narrow']);
  });

  test('given an unknown path then nothing returns', () => {
    expect(readersOfPath(UNTRACED_BRACKET_PATH, map)).toEqual([]);
  });
});

describe('variablesReachedByPaths', () => {
  test('given a CTC amount path then the walk reaches ctc and refundable_ctc with depths', () => {
    const reached = variablesReachedByPaths([CTC_BASE_AMOUNT_PATH], map);
    expect(reached).toEqual([
      { variable: 'ctc_child_individual_maximum', depth: 0, via: CTC_BASE_AMOUNT_PATH },
      { variable: 'ctc_individual_maximum', depth: 1, via: 'ctc_child_individual_maximum' },
      { variable: 'ctc_maximum', depth: 2, via: 'ctc_individual_maximum' },
      { variable: 'ctc', depth: 3, via: 'ctc_maximum' },
      { variable: 'refundable_ctc', depth: 3, via: 'ctc_maximum' },
      { variable: 'income_tax', depth: 4, via: 'ctc' },
      { variable: 'household_net_income', depth: 5, via: 'income_tax' },
    ]);
  });

  test('given a max depth then deeper variables are cut', () => {
    const reached = variablesReachedByPaths([CTC_BASE_AMOUNT_PATH], map, 2);
    expect(reached.map((r) => r.variable)).toEqual([
      'ctc_child_individual_maximum',
      'ctc_individual_maximum',
      'ctc_maximum',
    ]);
  });

  test('given two paths reaching the same variable then it keeps the shortest depth', () => {
    const reached = variablesReachedByPaths([CTC_BASE_AMOUNT_PATH, CTC_FULLY_REFUNDABLE_PATH], map);
    expect(reached.find((r) => r.variable === 'refundable_ctc')).toEqual({
      variable: 'refundable_ctc',
      depth: 0,
      via: CTC_FULLY_REFUNDABLE_PATH,
    });
  });

  test('given unrelated paths then nothing is reached', () => {
    expect(variablesReachedByPaths([STANDARD_DEDUCTION_PATH], map)).toEqual([]);
  });
});
