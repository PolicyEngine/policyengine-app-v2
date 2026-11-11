import { beforeEach, describe, expect, test, vi } from 'vitest';
import { LocalStorageReformStore, materializeReformPolicy } from '@/api/reformStore';
import { runFlagshipReport } from '@/libs/flagship/runReport';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import type { Parameter } from '@/types/subIngredients/parameter';

const mockCreatePolicy = vi.fn();
const mockCreateSimulation = vi.fn();
const mockCreateReport = vi.fn();

vi.mock('@/api/policy', () => ({
  createPolicy: (...args: any[]) => mockCreatePolicy(...args),
  fetchPolicyById: vi.fn(),
}));
vi.mock('@/api/simulation', () => ({
  createSimulation: (...args: any[]) => mockCreateSimulation(...args),
}));
vi.mock('@/api/report', () => ({
  createReport: (...args: any[]) => mockCreateReport(...args),
}));
vi.mock('@/api/budgetWindow', () => ({
  fetchBudgetWindow: vi.fn().mockResolvedValue({ status: 'computing', result: null }),
}));
vi.mock('@/api/societyWideCalculation', () => ({
  fetchSocietyWideCalculation: vi.fn().mockResolvedValue({ status: 'computing', result: null }),
}));

/** Two UK parameters as the live metadata has them. */
const UK_PARAMETERS = {
  'gov.dwp.ESA.income.capital.limit': {
    type: 'parameter',
    parameter: 'gov.dwp.ESA.income.capital.limit',
    label: 'Income-related ESA capital limit',
    unit: 'GBP',
    values: { '2015-01-01': 16000 },
  },
  'gov.hmrc.income_tax.allowances.personal_allowance.maximum_ANI': {
    type: 'parameter',
    parameter: 'gov.hmrc.income_tax.allowances.personal_allowance.maximum_ANI',
    label: 'Personal allowance phase-out threshold',
    unit: 'currency-GBP',
    values: { '2009-07-21': 100000 },
  },
} as unknown as ParameterMetadataCollection;

/** A UK reform as the editor keeps it: one value typed as text, one with no limit. */
const UK_REFORM: Parameter[] = [
  {
    name: 'gov.dwp.ESA.income.capital.limit',
    values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: '15000' as any }],
  },
  {
    name: 'gov.hmrc.income_tax.allowances.personal_allowance.maximum_ANI',
    values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: Infinity }],
  },
];

const policyJsonSent = (call: number) => mockCreatePolicy.mock.calls[call][1].data;

describe('a saved reform and a run of it', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockCreatePolicy.mockResolvedValue({ result: { policy_id: '77' } });
    mockCreateSimulation
      .mockResolvedValueOnce({ result: { simulation_id: '101' } })
      .mockResolvedValueOnce({ result: { simulation_id: '102' } });
    mockCreateReport.mockResolvedValue({ id: 55, country_id: 'uk', year: '2026' });
  });

  test('given parameter metadata when a UK reform is saved then its values are typed', async () => {
    await materializeReformPolicy('uk', UK_REFORM, UK_PARAMETERS);

    expect(policyJsonSent(0)).toEqual({
      'gov.dwp.ESA.income.capital.limit': { '2026-01-01.2100-12-31': 15000 },
      'gov.hmrc.income_tax.allowances.personal_allowance.maximum_ANI': {
        '2026-01-01.2100-12-31': 'Infinity',
      },
    });
  });

  test('given a UK reform when saved and when run then both send the same policy_json', async () => {
    // Given
    const store = new LocalStorageReformStore({ getParameterMetadata: () => UK_PARAMETERS });

    // When
    await store.create({
      countryId: 'uk',
      label: 'Lower ESA capital limit',
      parameters: UK_REFORM,
      baseline: 'current-law',
      provenance: { source: 'manual' },
    });
    await runFlagshipReport({
      countryId: 'uk',
      title: 'Lower ESA capital limit',
      sourceNote: '',
      provisions: UK_REFORM.map((parameter) => ({
        path: parameter.name,
        breadcrumb: parameter.name,
        unit: UK_PARAMETERS[parameter.name]?.unit ?? null,
        baselineValue: null,
        value: parameter.values[0].value,
        intervals: parameter.values,
      })),
      currentLawId: 1,
      parameters: UK_PARAMETERS,
    });

    // Then
    expect(mockCreatePolicy).toHaveBeenCalledTimes(2);
    expect(policyJsonSent(0)).toEqual(policyJsonSent(1));
    expect(JSON.stringify(policyJsonSent(0))).toBe(JSON.stringify(policyJsonSent(1)));
  });
});
