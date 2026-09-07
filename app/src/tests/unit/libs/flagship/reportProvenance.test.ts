import { describe, expect, test } from 'vitest';
import { isApiReportId } from '@/hooks/useFlagshipReport';
import {
  provenanceFromPolicy,
  provisionsFromPolicy,
  valueForYear,
} from '@/libs/flagship/reportProvenance';
import type { Policy } from '@/types/ingredients/Policy';

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

describe('valueForYear', () => {
  test('given dated intervals then the one covering the year wins', () => {
    expect(valueForYear(reformPolicy.parameters![0], '2026')).toBe(2500);
    expect(valueForYear(reformPolicy.parameters![0], '2025')).toBe(2200);
  });

  test('given no covering interval then the first stands in', () => {
    expect(valueForYear(reformPolicy.parameters![0], '2010')).toBe(2200);
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
