import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchHouseholdById } from '@/api/household';
import { fetchPolicyById } from '@/api/policy';
import { fetchSimulationById } from '@/api/simulation';
import { fetchHouseholdByIdV2 } from '@/api/v2/households';
import { fetchPolicyByIdV2 } from '@/api/v2/policies';
import { fetchSimulationByIdV2 } from '@/api/v2/simulations';
import {
  fetchHydratedHousehold,
  fetchHydratedPolicy,
  fetchHydratedSimulation,
} from '@/hooks/utils/simulationReadRouting';
import { mockSimulationMetadata } from '@/tests/fixtures/adapters/SimulationAdapterMocks';
import { createMockHouseholdV2Response, TEST_IDS } from '@/tests/fixtures/api/v2/shared';

vi.mock('@/api/simulation', () => ({
  fetchSimulationById: vi.fn(),
}));

vi.mock('@/api/v2/simulations', () => ({
  fetchSimulationByIdV2: vi.fn(),
}));

vi.mock('@/api/policy', () => ({
  fetchPolicyById: vi.fn(),
}));

vi.mock('@/api/v2/policies', () => ({
  fetchPolicyByIdV2: vi.fn(),
}));

vi.mock('@/api/household', () => ({
  fetchHouseholdById: vi.fn(),
}));

vi.mock('@/api/v2/households', () => ({
  fetchHouseholdByIdV2: vi.fn(),
}));

describe('simulationReadRouting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchHydratedSimulation', () => {
    test('given a v1 simulation id then it fetches through the v1 simulation api', async () => {
      vi.mocked(fetchSimulationById).mockResolvedValue(mockSimulationMetadata());

      const result = await fetchHydratedSimulation('us', '123');

      expect(fetchSimulationById).toHaveBeenCalledWith('us', '123');
      expect(fetchSimulationByIdV2).not.toHaveBeenCalled();
      expect(result.id).toBe('123');
      expect(result.source).toBe('v1_api');
    });

    test('given a uuid simulation id then it fetches through the v2 simulation api', async () => {
      vi.mocked(fetchSimulationByIdV2).mockResolvedValue({
        id: TEST_IDS.SIMULATION_ID,
        simulationType: 'household',
        populationType: 'household',
        populationId: TEST_IDS.HOUSEHOLD_ID,
        policyId: TEST_IDS.POLICY_ID,
        label: null,
        isCreated: true,
        status: 'complete',
        source: 'v2_household_api',
      });

      const result = await fetchHydratedSimulation('us', TEST_IDS.SIMULATION_ID);

      expect(fetchSimulationByIdV2).toHaveBeenCalledWith(TEST_IDS.SIMULATION_ID);
      expect(fetchSimulationById).not.toHaveBeenCalled();
      expect(result.id).toBe(TEST_IDS.SIMULATION_ID);
      expect(result.source).toBe('v2_household_api');
    });
  });

  describe('fetchHydratedPolicy', () => {
    test('given a v1 policy id then it fetches through the v1 policy api', async () => {
      vi.mocked(fetchPolicyById).mockResolvedValue({
        id: '123',
        country_id: 'us',
        api_version: '1.0.0',
        policy_json: {},
        policy_hash: 'hash-123',
        label: 'Policy 123',
      });

      const result = await fetchHydratedPolicy('us', '123');

      expect(fetchPolicyById).toHaveBeenCalledWith('us', '123');
      expect(fetchPolicyByIdV2).not.toHaveBeenCalled();
      expect(result.id).toBe('123');
      expect(result.apiVersion).toBe('1.0.0');
    });

    test('given a uuid policy id then it fetches through the v2 policy api', async () => {
      vi.mocked(fetchPolicyByIdV2).mockResolvedValue({
        id: TEST_IDS.POLICY_ID,
        name: 'V2 Policy',
        description: null,
        tax_benefit_model_id: 'us',
        created_at: '2026-01-15T12:00:00Z',
        updated_at: '2026-01-15T12:00:00Z',
        parameter_values: [],
      });

      const result = await fetchHydratedPolicy('us', TEST_IDS.POLICY_ID);

      expect(fetchPolicyByIdV2).toHaveBeenCalledWith(TEST_IDS.POLICY_ID);
      expect(fetchPolicyById).not.toHaveBeenCalled();
      expect(result.id).toBe(TEST_IDS.POLICY_ID);
      expect(result.apiVersion).toBe('v2');
    });
  });

  describe('fetchHydratedHousehold', () => {
    test('given a v1 household id then it fetches through the v1 household api', async () => {
      vi.mocked(fetchHouseholdById).mockResolvedValue({
        id: '456',
        country_id: 'us',
        api_version: '1.0.0',
        household_json: {
          people: {},
          families: {},
          tax_units: {},
          spm_units: {},
          households: {},
          marital_units: {},
        },
        household_hash: 'hash-456',
        label: 'Household 456',
      });

      const result = await fetchHydratedHousehold('us', '456');

      expect(fetchHouseholdById).toHaveBeenCalledWith('us', '456');
      expect(fetchHouseholdByIdV2).not.toHaveBeenCalled();
      expect(result.id).toBe('456');
    });

    test('given a uuid household id then it fetches through the v2 household api', async () => {
      vi.mocked(fetchHouseholdByIdV2).mockResolvedValue(createMockHouseholdV2Response());

      const result = await fetchHydratedHousehold('us', TEST_IDS.HOUSEHOLD_ID);

      expect(fetchHouseholdByIdV2).toHaveBeenCalledWith(TEST_IDS.HOUSEHOLD_ID);
      expect(fetchHouseholdById).not.toHaveBeenCalled();
      expect(result.id).toBe(TEST_IDS.HOUSEHOLD_ID);
      expect(result.countryId).toBe('us');
    });
  });
});
