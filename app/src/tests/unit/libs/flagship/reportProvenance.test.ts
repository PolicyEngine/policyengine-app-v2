import { describe, expect, test } from 'vitest';
import { isApiReportId } from '@/hooks/useFlagshipReport';
import { provenanceFromPolicy, provisionsFromPolicy } from '@/libs/flagship/reportProvenance';
import type { Policy } from '@/types/ingredients/Policy';
import { allSimulationsLoaded } from '@/utils/reportSimulations';

const CTC_BASE_PATH = 'gov.irs.credits.ctc.amount.base[0].amount';

const reformPolicy: Policy = {
  id: '9001',
  countryId: 'us',
  label: 'CTC to $2,500',
  parameters: [
    {
      name: CTC_BASE_PATH,
      values: [
        { startDate: '2024-01-01', endDate: '2025-12-31', value: 2200 },
        { startDate: '2026-01-01', endDate: '2100-12-31', value: 2500 },
      ],
    },
  ],
};

const metadataParameters = {
  [CTC_BASE_PATH]: {
    parameter: CTC_BASE_PATH,
    label: 'Amount',
    unit: 'currency-USD',
    values: { '2025-01-01': 2000, '2026-01-01': 2200 },
  },
};

describe('isApiReportId', () => {
  test('given a numeric id then it is the durable API form', () => {
    expect(isApiReportId('3721')).toBe(true);
  });

  test('given a local association id then it is not', () => {
    expect(isApiReportId('sur-mtqcsp78hwc7')).toBe(false);
  });
});

describe('the reform value in the report year', () => {
  test('given dated intervals then the one covering the year wins', () => {
    expect(provisionsFromPolicy(reformPolicy, metadataParameters, '2026')[0].value).toBe(2500);
    expect(provisionsFromPolicy(reformPolicy, metadataParameters, '2025')[0].value).toBe(2200);
  });

  test('given no covering interval then the value is current law, not the first interval', () => {
    // Given: current law is $2,000 in 2025, before the reform's first value.
    const [provision] = provisionsFromPolicy(
      {
        ...reformPolicy,
        parameters: [
          {
            name: CTC_BASE_PATH,
            values: [{ startDate: '2027-01-01', endDate: '2100-12-31', value: 2500 }],
          },
        ],
      },
      metadataParameters,
      '2025'
    );

    // Then
    expect(provision).toMatchObject({ baselineValue: 2000, value: 2000 });
  });
});

describe('provisionsFromPolicy', () => {
  test('given a policy and metadata then provisions carry path, value, baseline, and unit', () => {
    const [provision] = provisionsFromPolicy(reformPolicy, metadataParameters, '2026');

    expect(provision).toMatchObject({
      path: CTC_BASE_PATH,
      value: 2500,
      unit: 'currency-USD',
    });
    expect(provision.baselineValue).toBe(2200);
    expect(provision.breadcrumb).not.toBe(CTC_BASE_PATH);
  });

  test('given a path missing from metadata then the path itself is the breadcrumb', () => {
    const [provision] = provisionsFromPolicy(reformPolicy, {}, '2026');

    expect(provision.breadcrumb).toBe(CTC_BASE_PATH);
    expect(provision.unit).toBeNull();
    expect(provision.baselineValue).toBeUndefined();
  });
});

describe('provisionsFromPolicy for the report year', () => {
  const MD_CTC_PATH = 'gov.states.md.tax.income.credits.ctc.amount';
  // A reform that starts in 2027 and rises over time, like policy 98731.
  const datedReform: Policy = {
    id: '98731',
    countryId: 'us',
    label: 'MD CTC Increase',
    parameters: [
      {
        name: MD_CTC_PATH,
        values: [
          { startDate: '2030-01-01', endDate: '2100-12-31', value: 643 },
          { startDate: '2027-01-01', endDate: '2027-12-31', value: 600 },
          { startDate: '2028-01-01', endDate: '2029-12-31', value: 614 },
        ],
      },
    ],
  };
  const mdMetadata = {
    [MD_CTC_PATH]: {
      parameter: MD_CTC_PATH,
      label: 'Amount',
      unit: 'currency-USD',
      values: { '2023-01-01': 500, '2030-01-01': 550 },
    },
  };

  test('given a 2031 report then current law and the reform read as they stand in 2031', () => {
    // When
    const [provision] = provisionsFromPolicy(datedReform, mdMetadata, '2031');

    // Then
    expect({ before: provision.baselineValue, after: provision.value }).toEqual({
      before: 550,
      after: 643,
    });
  });

  test('given a year before the reform starts then the value is current law then', () => {
    // When
    const [provision] = provisionsFromPolicy(datedReform, mdMetadata, '2026');

    // Then
    expect({ before: provision.baselineValue, after: provision.value }).toEqual({
      before: 500,
      after: 500,
    });
  });

  test('given dated values then the provision carries them in date order', () => {
    // When
    const [provision] = provisionsFromPolicy(datedReform, mdMetadata, '2027');

    // Then
    expect(provision.intervals?.map((interval) => interval.startDate)).toEqual([
      '2027-01-01',
      '2028-01-01',
      '2030-01-01',
    ]);
    expect(provision.value).toBe(600);
  });

  test('given a report year then the provenance describes that year', () => {
    // When
    const meta = provenanceFromPolicy(datedReform, mdMetadata, 'MD CTC', '2028');

    // Then
    expect(meta?.provisions[0]).toMatchObject({ baselineValue: 500, value: 614 });
  });
});

describe('provenanceFromPolicy', () => {
  test('given a policy then the report label leads and the policy label backs it', () => {
    expect(provenanceFromPolicy(reformPolicy, metadataParameters, 'Shared CTC run')?.title).toBe(
      'Shared CTC run'
    );
    expect(provenanceFromPolicy(reformPolicy, metadataParameters, null)?.title).toBe(
      'CTC to $2,500'
    );
  });

  test('given no policy yet then there is no provenance', () => {
    expect(provenanceFromPolicy(undefined, metadataParameters, 'x')).toBeNull();
  });
});

describe('allSimulationsLoaded', () => {
  const report = { id: '3723', simulationIds: ['71', '2307'] } as any;
  const baseline = { id: '71', policyId: '2' } as any;
  const reform = { id: '2307', policyId: '98370' } as any;

  test('given only the baseline simulation so far then the run must wait', () => {
    expect(allSimulationsLoaded(report, [baseline])).toBe(false);
  });

  test('given both simulations then the run may start', () => {
    expect(allSimulationsLoaded(report, [reform, baseline])).toBe(true);
  });

  test('given no report or no simulation ids then it never starts', () => {
    expect(allSimulationsLoaded(undefined, [baseline])).toBe(false);
    expect(allSimulationsLoaded({ id: 'x', simulationIds: [] } as any, [])).toBe(false);
  });
});
