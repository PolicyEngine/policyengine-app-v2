import { describe, expect, test } from 'vitest';
import { isApiReportId } from '@/hooks/useFlagshipReport';
import { provenanceFromPolicy, provisionsFromPolicy } from '@/libs/flagship/reportProvenance';
import { provisionPeriods } from '@/libs/flagship/runReport';
import {
  EXEMPTION_METADATA,
  EXEMPTION_SCHEDULE_PERIODS,
  EXEMPTION_SCHEDULE_POLICY,
  REPORT_YEAR_2028,
} from '@/tests/fixtures/pages/flagship/sharedReportMocks';
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

  test('given dated values then the provision reads the one in the report year', () => {
    expect(provisionsFromPolicy(reformPolicy, metadataParameters, '2025')[0].value).toBe(2200);
    expect(provisionsFromPolicy(reformPolicy, metadataParameters, '2026')[0].value).toBe(2500);
  });

  test('given a later report year then current law is read in that year', () => {
    const [provision] = provisionsFromPolicy(
      EXEMPTION_SCHEDULE_POLICY,
      EXEMPTION_METADATA,
      REPORT_YEAR_2028
    );

    expect(provision.value).toBe(8000);
    expect(provision.baselineValue).toBe(5200);
  });

  test('given dated values then the provision keeps every one, as the report ran them', () => {
    const [provision] = provisionsFromPolicy(
      EXEMPTION_SCHEDULE_POLICY,
      EXEMPTION_METADATA,
      REPORT_YEAR_2028
    );

    expect(provisionPeriods(provision)).toEqual(EXEMPTION_SCHEDULE_PERIODS);
  });

  test('given a year the policy does not reach then current law stands as the value', () => {
    const [provision] = provisionsFromPolicy(reformPolicy, metadataParameters, '2010');

    expect(provision.value).toBe(provision.baselineValue);
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

  test('given the report year then the provisions read that year', () => {
    const meta = provenanceFromPolicy(
      EXEMPTION_SCHEDULE_POLICY,
      EXEMPTION_METADATA,
      null,
      REPORT_YEAR_2028
    );

    expect(meta?.provisions[0].value).toBe(8000);
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
