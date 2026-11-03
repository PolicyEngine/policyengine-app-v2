import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { readV1Policy, reportMissingParameters } from '@/libs/flagship/policyChecks';
import {
  REMOVED_UK_PARAMETER,
  REMOVED_US_PARAMETER,
  v1PolicyContent,
} from '@/tests/fixtures/libs/flagship/missingParametersMocks';

const mockFetchPolicyById = vi.fn();
const mockFetchReportById = vi.fn();
const mockFetchSimulationById = vi.fn();

vi.mock('@/api/policy', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/policy')>()),
  fetchPolicyById: (...args: unknown[]) => mockFetchPolicyById(...args),
}));

vi.mock('@/api/report', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/report')>()),
  fetchReportById: (...args: unknown[]) => mockFetchReportById(...args),
}));

vi.mock('@/api/simulation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/simulation')>()),
  fetchSimulationById: (...args: unknown[]) => mockFetchSimulationById(...args),
}));

/** The report's baseline (policy 2) and reform (policy 98557) simulations. */
const BASELINE_SIMULATION_ID = '501';
const REFORM_SIMULATION_ID = '502';
const POLICY_IDS: Record<string, string> = {
  [BASELINE_SIMULATION_ID]: '2',
  [REFORM_SIMULATION_ID]: '98557',
};

describe('readV1Policy', () => {
  beforeEach(() => vi.clearAllMocks());

  test('given the same policy read twice then it is asked for once', async () => {
    // Given
    const queryClient = new QueryClient();
    mockFetchPolicyById.mockResolvedValue(v1PolicyContent({}, []));

    // When
    await readV1Policy(queryClient, 'us', '98557');
    await readV1Policy(queryClient, 'us', '98557');

    // Then
    expect(mockFetchPolicyById).toHaveBeenCalledTimes(1);
  });

  test('given a policy that stores no parameter map then it reads as an empty one', async () => {
    mockFetchPolicyById.mockResolvedValue({ id: '1', policy_json: null });

    const policy = await readV1Policy(new QueryClient(), 'us', '1');

    expect(policy.policy_json).toEqual({});
  });
});

describe('reportMissingParameters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchReportById.mockResolvedValue({
      simulation_1_id: BASELINE_SIMULATION_ID,
      simulation_2_id: REFORM_SIMULATION_ID,
    });
    mockFetchSimulationById.mockImplementation(async (_country: string, id: string) => ({
      policy_id: POLICY_IDS[id],
    }));
  });

  const readPolicy = (_country: string, policyId: string) =>
    mockFetchPolicyById('us', policyId) as Promise<ReturnType<typeof v1PolicyContent>>;

  test('given both policies set removed parameters then each is named once', async () => {
    mockFetchPolicyById.mockImplementation(async (_country: string, policyId: string) =>
      v1PolicyContent({}, policyId === '2' ? [REMOVED_UK_PARAMETER] : [REMOVED_US_PARAMETER])
    );

    expect(await reportMissingParameters('us', '901', readPolicy)).toEqual([
      REMOVED_UK_PARAMETER,
      REMOVED_US_PARAMETER,
    ]);
  });

  test('given one policy cannot be read then the other one still counts', async () => {
    // Given: the reform policy fails; the baseline policy sets a removed parameter
    mockFetchPolicyById.mockImplementation(async (_country: string, policyId: string) => {
      if (policyId === '98557') {
        throw new Error('Failed to fetch policy 98557');
      }
      return v1PolicyContent({}, [REMOVED_US_PARAMETER]);
    });

    // When / Then
    expect(await reportMissingParameters('us', '901', readPolicy)).toEqual([REMOVED_US_PARAMETER]);
  });
});
