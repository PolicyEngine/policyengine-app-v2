import { LOCAL_STORAGE_KEYS } from '@/libs/auth/localImport';
import type { Reform } from '@/types/ingredients/Reform';

export const LOCAL_USER = 'anonymous';

export const LOCAL_IDS = {
  POLICY_US: 'sup-us1',
  POLICY_CA: 'sup-ca1',
  POLICY_INVALID: 'sup-bad1',
  HOUSEHOLD_UK: 'suh-uk1',
  SIMULATION_US: 'sus-us1',
  REPORT_US: 'sur-us1',
  REPORT_UK: 'sur-uk1',
  FLAGSHIP_MERGED: 'lfr-merged1',
  FLAGSHIP_ALONE: 'lfr-alone1',
  REFORM_US: 'rf-us1',
  REFORM_NG: 'rf-ng1',
} as const;

export const V1_IDS = {
  POLICY_US: '95762',
  POLICY_CA: '300',
  HOUSEHOLD_UK: '123',
  SIMULATION_US: '613',
  REPORT_US: '615',
  REPORT_UK: '700',
  REPORT_FLAGSHIP_ALONE: '801',
  MATERIALIZED_REFORM: 95800,
} as const;

export const PROVISION = {
  path: 'gov.irs.credits.ctc.amount.base[0].amount',
  breadcrumb: 'IRS → Credits → CTC → Amount',
  unit: 'currency-USD',
  baselineValue: 2200,
  value: 2500,
};

export const localReformUS: Reform = {
  id: LOCAL_IDS.REFORM_US,
  userId: LOCAL_USER,
  countryId: 'us',
  label: 'CTC to $2,500',
  parameters: [
    {
      name: PROVISION.path,
      values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 2500 }],
    },
  ],
  baseline: 'current-law',
  provenance: { source: 'manual' },
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z',
};

/** Writes a representative browser: US/UK/Canada items, a flagship run, reforms. */
export function seedLocalData(): void {
  const set = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));
  set(LOCAL_STORAGE_KEYS.policies, [
    {
      id: LOCAL_IDS.POLICY_US,
      userId: LOCAL_USER,
      policyId: V1_IDS.POLICY_US,
      countryId: 'us',
      label: 'My policy',
    },
    {
      id: LOCAL_IDS.POLICY_CA,
      userId: LOCAL_USER,
      policyId: V1_IDS.POLICY_CA,
      countryId: 'ca',
      label: 'Canada policy',
    },
    { id: LOCAL_IDS.POLICY_INVALID, userId: LOCAL_USER, policyId: 'current-law', countryId: 'us' },
  ]);
  set(LOCAL_STORAGE_KEYS.households, [
    {
      type: 'household',
      id: LOCAL_IDS.HOUSEHOLD_UK,
      userId: LOCAL_USER,
      householdId: V1_IDS.HOUSEHOLD_UK,
      countryId: 'uk',
      label: 'Family',
    },
  ]);
  set(LOCAL_STORAGE_KEYS.simulations, [
    {
      id: LOCAL_IDS.SIMULATION_US,
      userId: LOCAL_USER,
      simulationId: V1_IDS.SIMULATION_US,
      countryId: 'us',
    },
  ]);
  set(LOCAL_STORAGE_KEYS.reports, [
    {
      id: LOCAL_IDS.REPORT_US,
      userId: LOCAL_USER,
      reportId: V1_IDS.REPORT_US,
      countryId: 'us',
      label: 'CTC to $2,500',
    },
    {
      id: LOCAL_IDS.REPORT_UK,
      userId: LOCAL_USER,
      reportId: V1_IDS.REPORT_UK,
      countryId: 'uk',
      label: 'UK report',
    },
  ]);
  set(LOCAL_STORAGE_KEYS.reforms, [
    localReformUS,
    { ...localReformUS, id: LOCAL_IDS.REFORM_NG, countryId: 'ng' },
  ]);
  set(LOCAL_STORAGE_KEYS.flagshipReports, [
    {
      id: LOCAL_IDS.FLAGSHIP_MERGED,
      userId: LOCAL_USER,
      countryId: 'us',
      apiReportId: V1_IDS.REPORT_US,
      title: 'CTC to $2,500',
      sourceNote: 'Hand-built draft',
      provisions: [PROVISION],
      year: '2026',
      createdAt: '2026-09-02T00:00:00Z',
      reformId: LOCAL_IDS.REFORM_US,
    },
    {
      id: LOCAL_IDS.FLAGSHIP_ALONE,
      userId: LOCAL_USER,
      countryId: 'us',
      apiReportId: V1_IDS.REPORT_FLAGSHIP_ALONE,
      title: 'Bill report',
      sourceNote: 'Utah · Introduced',
      provisions: [],
      year: '2026',
      createdAt: '2026-09-03T00:00:00Z',
      reformId: null,
    },
  ]);
  set(LOCAL_STORAGE_KEYS.reportMeta, {
    [V1_IDS.REPORT_FLAGSHIP_ALONE]: {
      title: 'Bill report',
      sourceNote: 'Utah · Introduced',
      provisions: [PROVISION],
      createdAt: '2026-09-03T00:00:00Z',
    },
  });
}

/** A browser with many saved simulations, for chunking. */
export function seedManySimulations(count: number): void {
  localStorage.setItem(
    LOCAL_STORAGE_KEYS.simulations,
    JSON.stringify(
      Array.from({ length: count }, (_, index) => ({
        id: `sus-${index}`,
        userId: LOCAL_USER,
        simulationId: String(index + 1),
        countryId: 'us',
      }))
    )
  );
}
