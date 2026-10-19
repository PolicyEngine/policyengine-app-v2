import { describe, expect, test } from 'vitest';
import dependencyMap from '@/data/flagship/parameterDependencies.json';
import { relevantCalibrationMatches, summarizeMatches } from '@/libs/flagship/calibrationMatching';
import {
  normalizeCalibrationTarget,
  targetsForGeography,
  targetsForVariables,
} from '@/libs/flagship/calibrationTargets';
import {
  readersOfPath,
  variablesReachedByPaths,
  type ParameterDependencyMap,
} from '@/libs/flagship/parameterDependencies';
import {
  DC_CTC_AMOUNT_PATH,
  DC_REGION,
  mockCalibrationRows,
  mockDcFederalCtcRow,
  mockDcFitRows,
  mockDcIncomeTaxRow,
  rawDcIncomeTaxTarget,
  rawDcPopulationTarget,
} from '@/tests/fixtures/libs/flagship/calibrationMatchingMocks';

const map = dependencyMap as unknown as ParameterDependencyMap;

describe('normalizeCalibrationTarget', () => {
  test('given listed model variables then they are the join key', () => {
    expect(normalizeCalibrationTarget(rawDcIncomeTaxTarget)).toEqual(mockDcIncomeTaxRow);
  });

  test('given no listed model variable then nothing joins, whatever the role', () => {
    const row = normalizeCalibrationTarget({
      ...rawDcIncomeTaxTarget,
      policyengine_variables: [],
    })!;

    expect(row.policyengineVariables).toEqual([]);
    expect(row.targetRole).toBe('state_income_tax');
    expect(normalizeCalibrationTarget(rawDcPopulationTarget)!.policyengineVariables).toEqual([]);
  });

  test('given no name then no row', () => {
    expect(normalizeCalibrationTarget({ target_role: 'state_income_tax' })).toBeNull();
  });
});

describe('targetsForVariables', () => {
  test('given variables then only that geography’s targets of them come back, worst first', () => {
    const rows = targetsForVariables(
      [...mockCalibrationRows, mockDcIncomeTaxRow, mockDcFederalCtcRow],
      ['state_income_tax', 'ctc'],
      'DC',
      500
    );

    expect(rows).toEqual([mockDcFederalCtcRow, mockDcIncomeTaxRow]);
  });

  test('given a dense variable then it is capped and its worst rows survive', () => {
    const rows = targetsForVariables(mockCalibrationRows, ['refundable_ctc'], 'US', 1);

    expect(rows).toEqual([mockCalibrationRows[1]]);
  });
});

describe('targetsForGeography', () => {
  test('given a state then every target there comes back, whatever it measures', () => {
    const rows = targetsForGeography([...mockCalibrationRows, ...mockDcFitRows], 'DC');

    expect(rows.map((row) => row.name)).toEqual(mockDcFitRows.map((row) => row.name));
  });

  test('given targets without a fit then they are left out', () => {
    expect(targetsForGeography([{ ...mockDcIncomeTaxRow, relativeError: null }], 'DC')).toEqual([]);
  });
});

describe('report 4592: a DC CTC change in a DC report', () => {
  const reached = variablesReachedByPaths([DC_CTC_AMOUNT_PATH], map);
  const reform = {
    countryId: 'us',
    paths: [DC_CTC_AMOUNT_PATH],
    readers: { [DC_CTC_AMOUNT_PATH]: readersOfPath(DC_CTC_AMOUNT_PATH, map) },
    region: DC_REGION,
  };

  test('the change reaches the state income tax within the default depth', () => {
    expect(reached.map((entry) => entry.variable)).toEqual(
      expect.arrayContaining(['dc_ctc', 'dc_income_tax', 'state_income_tax'])
    );
  });

  test('the DC income tax collections target measures the program the reform changes', () => {
    const all = summarizeMatches(reached, [mockDcIncomeTaxRow, mockDcFederalCtcRow]);
    const relevant = relevantCalibrationMatches(all, reform);

    expect(relevant.map((match) => match.variable)).toEqual(['state_income_tax']);
    expect(relevant[0].worst).toBe(mockDcIncomeTaxRow);
  });

  test('without listed model variables the target would not match', () => {
    const all = summarizeMatches(reached, [{ ...mockDcIncomeTaxRow, policyengineVariables: [] }]);

    expect(all).toEqual([]);
  });
});
