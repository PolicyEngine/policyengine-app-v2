import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, test } from 'vitest';
import {
  findRegionalOutput,
  isDerivedFromNational,
  nationalEconomyKey,
  regionalOutputFrom,
  rememberNationalOutput,
} from '@/libs/flagship/regionalOutput';
import {
  mockNationalOutput,
  mockNationalOutputWithCalifornia,
  mockStateBlock,
  REGIONAL_TEST,
} from '@/tests/fixtures/libs/flagship/regionalOutputMocks';

const REQUEST = {
  countryId: REGIONAL_TEST.COUNTRY,
  reformPolicyId: REGIONAL_TEST.REFORM_ID,
  baselinePolicyId: REGIONAL_TEST.BASELINE_ID,
  region: REGIONAL_TEST.STATE,
  year: REGIONAL_TEST.YEAR,
};

describe('regionalOutputFrom', () => {
  test('given the state block then it is the result, marked as from the nationwide run', () => {
    const derived = regionalOutputFrom(mockNationalOutputWithCalifornia(), REGIONAL_TEST.STATE);

    expect(derived?.budget.budgetary_impact).toBe(-1_000_000);
    expect(isDerivedFromNational(derived)).toBe(true);
    // The block keeps the nationwide run's model and data versions.
    expect(derived).toMatchObject({
      model_version: '1.500.0',
      data_version: '1.90.0',
      dataset: 'enhanced_cps_2024',
    });
  });

  test('given no regions on the result then there is none', () => {
    expect(regionalOutputFrom(mockNationalOutput(), REGIONAL_TEST.STATE)).toBeNull();
  });

  test('given another state only then there is none', () => {
    expect(regionalOutputFrom(mockNationalOutputWithCalifornia(), 'state/ny')).toBeNull();
  });

  test('given an incomplete block then there is none', () => {
    const { decile: _decile, ...noDeciles } = mockStateBlock();
    const { budget: _budget, ...noBudget } = mockStateBlock();

    expect(
      regionalOutputFrom(mockNationalOutput({ 'state/ca': noDeciles }), 'state/ca')
    ).toBeNull();
    expect(regionalOutputFrom(mockNationalOutput({ 'state/ca': noBudget }), 'state/ca')).toBeNull();
  });

  test('given a region that is not a state then there is none', () => {
    const output = mockNationalOutput({
      'congressional_district/CA-01': mockStateBlock(),
      us: mockStateBlock(),
    });

    expect(regionalOutputFrom(output, 'congressional_district/CA-01')).toBeNull();
    expect(regionalOutputFrom(output, 'us')).toBeNull();
    expect(regionalOutputFrom(output, undefined)).toBeNull();
    expect(regionalOutputFrom(null, 'state/ca')).toBeNull();
  });

  test('given a live result then it is not marked as from the nationwide run', () => {
    expect(isDerivedFromNational(mockNationalOutput())).toBe(false);
    expect(isDerivedFromNational(null)).toBe(false);
  });
});

describe('findRegionalOutput', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
  });

  test('given a remembered nationwide result with the state then it is found', () => {
    rememberNationalOutput(queryClient, REQUEST, mockNationalOutputWithCalifornia());

    expect(findRegionalOutput(queryClient, REQUEST)?.budget.budgetary_impact).toBe(-1_000_000);
  });

  test('given a completed nationwide year of a budget window then the state is found', () => {
    queryClient.setQueryData(
      [
        'flagship-report-year',
        'us',
        REGIONAL_TEST.REFORM_ID,
        REGIONAL_TEST.BASELINE_ID,
        'us',
        '2026',
      ],
      {
        status: 'complete',
        result: mockNationalOutputWithCalifornia(),
        metadata: { calcId: 'x', calcType: 'societyWide', targetType: 'report', startedAt: 0 },
      }
    );

    expect(findRegionalOutput(queryClient, REQUEST)).not.toBeNull();
  });

  test('given a pending nationwide year then nothing is found', () => {
    queryClient.setQueryData(
      [
        'flagship-report-year',
        'us',
        REGIONAL_TEST.REFORM_ID,
        REGIONAL_TEST.BASELINE_ID,
        'us',
        '2026',
      ],
      { status: 'pending', metadata: {} }
    );

    expect(findRegionalOutput(queryClient, REQUEST)).toBeNull();
  });

  test('given a nationwide result of another reform, baseline or year then nothing is found', () => {
    rememberNationalOutput(queryClient, REQUEST, mockNationalOutputWithCalifornia());

    expect(findRegionalOutput(queryClient, { ...REQUEST, reformPolicyId: '78' })).toBeNull();
    expect(findRegionalOutput(queryClient, { ...REQUEST, baselinePolicyId: '3' })).toBeNull();
    expect(findRegionalOutput(queryClient, { ...REQUEST, year: '2027' })).toBeNull();
  });

  test('given a nationwide request then nothing is found', () => {
    rememberNationalOutput(queryClient, REQUEST, mockNationalOutputWithCalifornia());

    expect(findRegionalOutput(queryClient, { ...REQUEST, region: 'us' })).toBeNull();
  });

  test('given a nationwide result without regions then it is not remembered', () => {
    rememberNationalOutput(queryClient, REQUEST, mockNationalOutput());

    expect(
      queryClient.getQueryData(
        nationalEconomyKey('us', REGIONAL_TEST.REFORM_ID, REGIONAL_TEST.BASELINE_ID, '2026')
      )
    ).toBeUndefined();
    expect(findRegionalOutput(queryClient, REQUEST)).toBeNull();
  });
});
