import { describe, expect, test } from 'vitest';
import {
  UK_CALIBRATION_PROGRAMS,
  ukCalibrationProgramLabel,
  ukProgramsForPaths,
  ukProgramsForTarget,
} from '@/libs/flagship/ukCalibrationPrograms';
import {
  rawGbCarersAllowanceTarget,
  rawLondonPopulationTarget,
  rawUkItlTarget,
  rawWalesIncomeTaxTarget,
  rawWalesTotalIncomeTarget,
  UK_BASIC_RATE_PATH,
  UK_CARERS_EARNINGS_LIMIT_PATH,
  UK_ELASTICITY_PATH,
  UK_RELIEF_AGE_PATH,
} from '@/tests/fixtures/libs/flagship/ukCalibrationMocks';

describe('ukProgramsForPaths', () => {
  test('given the basic rate then Income Tax is the programme it changes', () => {
    expect(ukProgramsForPaths([UK_BASIC_RATE_PATH])).toEqual([
      { program: 'income_tax', via: UK_BASIC_RATE_PATH },
    ]);
  });

  test('given the Carer’s Allowance limit and the relief age then both programmes change', () => {
    expect(ukProgramsForPaths([UK_CARERS_EARNINGS_LIMIT_PATH, UK_RELIEF_AGE_PATH])).toEqual([
      { program: 'income_tax', via: UK_RELIEF_AGE_PATH },
      { program: 'carers_allowance', via: UK_CARERS_EARNINGS_LIMIT_PATH },
    ]);
  });

  test('given a parameter outside every programme then nothing is changed', () => {
    expect(ukProgramsForPaths([UK_ELASTICITY_PATH])).toEqual([]);
  });

  test('given a folder that only starts with a programme’s name then it is not that programme', () => {
    expect(ukProgramsForPaths(['gov.hmrc.income_tax_extra.rate'])).toEqual([]);
  });
});

describe('ukProgramsForTarget', () => {
  test('given Income Tax liabilities then the target measures Income Tax', () => {
    expect(ukProgramsForTarget(rawWalesIncomeTaxTarget.name as string)).toEqual(['income_tax']);
    expect(ukProgramsForTarget(rawUkItlTarget.name as string)).toEqual(['income_tax']);
  });

  test('given the income the tax falls on then it measures no programme', () => {
    expect(ukProgramsForTarget(rawWalesTotalIncomeTarget.name as string)).toEqual([]);
  });

  test('given OBR Carer’s Allowance spending then it measures Carer’s Allowance', () => {
    expect(ukProgramsForTarget(rawGbCarersAllowanceTarget.name as string)).toEqual([
      'carers_allowance',
    ]);
  });

  test('given a population count then it measures no programme', () => {
    expect(ukProgramsForTarget(rawLondonPopulationTarget.name as string)).toEqual([]);
  });
});

describe('UK_CALIBRATION_PROGRAMS', () => {
  test('given the table then every programme key is unique and every programme is labelled', () => {
    const keys = UK_CALIBRATION_PROGRAMS.map((entry) => entry.program);

    expect(new Set(keys).size).toBe(keys.length);
    expect(ukCalibrationProgramLabel('carers_allowance')).toBe("Carer's Allowance");
    expect(ukCalibrationProgramLabel('not_a_programme')).toBeUndefined();
  });
});
