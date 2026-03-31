import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createEconomySimulation,
  createHouseholdSimulation,
  fetchSimulationByIdV2,
  fromEconomySimulationResponse,
  fromHouseholdSimulationResponse,
  getEconomySimulation,
  getHouseholdSimulation,
} from '@/api/v2/simulations';
import {
  createMockEconomySimulationResponse,
  createMockHouseholdSimulationResponse,
  mockFetch404,
  mockFetchError,
  mockFetchSuccess,
  TEST_COUNTRY_ID,
  TEST_IDS,
} from '@/tests/fixtures/api/v2/shared';

vi.stubGlobal('fetch', vi.fn());

describe('simulations v2 API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // fromHouseholdSimulationResponse
  // ==========================================================================

  describe('fromHouseholdSimulationResponse', () => {
    test('given completed status then maps to complete', () => {
      // Given
      const response = createMockHouseholdSimulationResponse({ status: 'completed' });

      // When
      const sim = fromHouseholdSimulationResponse(response as any);

      // Then
      expect(sim.status).toBe('complete');
    });

    test('given failed status then maps to error', () => {
      // Given
      const response = createMockHouseholdSimulationResponse({ status: 'failed' });

      // When
      const sim = fromHouseholdSimulationResponse(response as any);

      // Then
      expect(sim.status).toBe('error');
    });

    test('given pending status then maps to pending', () => {
      // Given
      const response = createMockHouseholdSimulationResponse({ status: 'pending' });

      // When
      const sim = fromHouseholdSimulationResponse(response as any);

      // Then
      expect(sim.status).toBe('pending');
    });

    test('given running status then maps to pending', () => {
      // Given
      const response = createMockHouseholdSimulationResponse({ status: 'running' });

      // When
      const sim = fromHouseholdSimulationResponse(response as any);

      // Then
      expect(sim.status).toBe('pending');
    });

    test('given response then maps all fields correctly', () => {
      // Given
      const response = createMockHouseholdSimulationResponse();

      // When
      const sim = fromHouseholdSimulationResponse(response as any);

      // Then
      expect(sim.id).toBe(TEST_IDS.SIMULATION_ID);
      expect(sim.policyId).toBe(TEST_IDS.POLICY_ID);
      expect(sim.populationId).toBe(TEST_IDS.HOUSEHOLD_ID);
      expect(sim.populationType).toBe('household');
      expect(sim.label).toBeNull();
      expect(sim.isCreated).toBe(true);
      expect(sim.output).toEqual({ net_income: 45000 });
    });

    test('given null policy_id then maps to undefined policyId', () => {
      // Given
      const response = createMockHouseholdSimulationResponse({ policy_id: null });

      // When
      const sim = fromHouseholdSimulationResponse(response as any);

      // Then
      expect(sim.policyId).toBeUndefined();
    });
  });

  // ==========================================================================
  // fromEconomySimulationResponse
  // ==========================================================================

  describe('fromEconomySimulationResponse', () => {
    test('given response with region then maps region.code to populationId', () => {
      // Given
      const response = createMockEconomySimulationResponse();

      // When
      const sim = fromEconomySimulationResponse(response as any);

      // Then
      expect(sim.populationId).toBe('state/ca');
    });

    test('given response without region then falls back to dataset_id', () => {
      // Given
      const response = { ...createMockEconomySimulationResponse(), region: null };

      // When
      const sim = fromEconomySimulationResponse(response as any);

      // Then
      expect(sim.populationId).toBe(TEST_IDS.DATASET_ID);
    });

    test('given null policy_id then maps to undefined', () => {
      // Given
      const response = createMockEconomySimulationResponse({ policy_id: null });

      // When
      const sim = fromEconomySimulationResponse(response as any);

      // Then
      expect(sim.policyId).toBeUndefined();
    });

    test('given response then sets populationType to geography', () => {
      // Given
      const response = createMockEconomySimulationResponse();

      // When
      const sim = fromEconomySimulationResponse(response as any);

      // Then
      expect(sim.populationType).toBe('geography');
    });

    test('given response then maps status and common fields correctly', () => {
      // Given
      const response = createMockEconomySimulationResponse();

      // When
      const sim = fromEconomySimulationResponse(response as any);

      // Then
      expect(sim.id).toBe(TEST_IDS.SIMULATION_ID);
      expect(sim.status).toBe('complete');
      expect(sim.label).toBeNull();
      expect(sim.isCreated).toBe(true);
    });
  });

  // ==========================================================================
  // createHouseholdSimulation
  // ==========================================================================

  describe('createHouseholdSimulation', () => {
    test('given valid request then POST succeeds with correct URL and body', async () => {
      // Given
      const request = {
        household_id: TEST_IDS.HOUSEHOLD_ID,
        policy_id: TEST_IDS.POLICY_ID,
      };
      const apiResponse = createMockHouseholdSimulationResponse();
      vi.stubGlobal('fetch', mockFetchSuccess(apiResponse));

      // When
      const result = await createHouseholdSimulation(request);

      // Then
      expect(fetch).toHaveBeenCalledOnce();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/simulations/household'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(request),
        })
      );
      expect(result.id).toBe(TEST_IDS.SIMULATION_ID);
      expect(result.status).toBe('completed');
    });

    test('given API returns error then throws with status and message', async () => {
      // Given
      const request = { household_id: TEST_IDS.HOUSEHOLD_ID };
      vi.stubGlobal('fetch', mockFetchError(500, 'Internal Server Error'));

      // When / Then
      await expect(createHouseholdSimulation(request)).rejects.toThrow(
        'Failed to create household simulation: 500'
      );
    });
  });

  // ==========================================================================
  // getHouseholdSimulation
  // ==========================================================================

  describe('getHouseholdSimulation', () => {
    test('given valid simulation ID then returns simulation response', async () => {
      // Given
      const apiResponse = createMockHouseholdSimulationResponse();
      vi.stubGlobal('fetch', mockFetchSuccess(apiResponse));

      // When
      const result = await getHouseholdSimulation(TEST_IDS.SIMULATION_ID);

      // Then
      expect(fetch).toHaveBeenCalledOnce();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/simulations/household/${TEST_IDS.SIMULATION_ID}`),
        expect.objectContaining({
          headers: { Accept: 'application/json' },
        })
      );
      expect(result.id).toBe(TEST_IDS.SIMULATION_ID);
    });

    test('given 404 response then throws not found error', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetch404());

      // When / Then
      await expect(getHouseholdSimulation(TEST_IDS.SIMULATION_ID)).rejects.toThrow(
        `Household simulation ${TEST_IDS.SIMULATION_ID} not found`
      );
    });
  });

  // ==========================================================================
  // createEconomySimulation
  // ==========================================================================

  describe('createEconomySimulation', () => {
    test('given valid request then POST succeeds with correct URL and body', async () => {
      // Given
      const request = {
        country_id: TEST_COUNTRY_ID,
        region: 'state/ca',
        policy_id: TEST_IDS.POLICY_ID,
      };
      const apiResponse = createMockEconomySimulationResponse();
      vi.stubGlobal('fetch', mockFetchSuccess(apiResponse));

      // When
      const result = await createEconomySimulation(request);

      // Then
      expect(fetch).toHaveBeenCalledOnce();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/simulations/economy'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(request),
        })
      );
      expect(result.id).toBe(TEST_IDS.SIMULATION_ID);
    });

    test('given API returns error then throws with status and message', async () => {
      // Given
      const request = { country_id: TEST_COUNTRY_ID };
      vi.stubGlobal('fetch', mockFetchError(400, 'Bad Request'));

      // When / Then
      await expect(createEconomySimulation(request)).rejects.toThrow(
        'Failed to create economy simulation: 400'
      );
    });
  });

  // ==========================================================================
  // getEconomySimulation
  // ==========================================================================

  describe('getEconomySimulation', () => {
    test('given valid simulation ID then returns simulation response', async () => {
      // Given
      const apiResponse = createMockEconomySimulationResponse();
      vi.stubGlobal('fetch', mockFetchSuccess(apiResponse));

      // When
      const result = await getEconomySimulation(TEST_IDS.SIMULATION_ID);

      // Then
      expect(fetch).toHaveBeenCalledOnce();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/simulations/economy/${TEST_IDS.SIMULATION_ID}`),
        expect.objectContaining({
          headers: { Accept: 'application/json' },
        })
      );
      expect(result.id).toBe(TEST_IDS.SIMULATION_ID);
    });

    test('given 404 response then throws not found error', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetch404());

      // When / Then
      await expect(getEconomySimulation(TEST_IDS.SIMULATION_ID)).rejects.toThrow(
        `Economy simulation ${TEST_IDS.SIMULATION_ID} not found`
      );
    });
  });

  // ==========================================================================
  // fetchSimulationByIdV2
  // ==========================================================================

  describe('fetchSimulationByIdV2', () => {
    test('given household type response then routes through household conversion', async () => {
      // Given
      const genericResponse = {
        id: TEST_IDS.SIMULATION_ID,
        simulation_type: 'household',
        status: 'completed',
        dataset_id: null,
        household_id: TEST_IDS.HOUSEHOLD_ID,
        policy_id: TEST_IDS.POLICY_ID,
        output_dataset_id: null,
        filter_field: null,
        filter_value: null,
        household_result: { net_income: 45000 },
        error_message: null,
      };
      vi.stubGlobal('fetch', mockFetchSuccess(genericResponse));

      // When
      const result = await fetchSimulationByIdV2(TEST_IDS.SIMULATION_ID);

      // Then
      expect(result.populationType).toBe('household');
      expect(result.populationId).toBe(TEST_IDS.HOUSEHOLD_ID);
      expect(result.policyId).toBe(TEST_IDS.POLICY_ID);
      expect(result.status).toBe('complete');
      expect(result.output).toEqual({ net_income: 45000 });
    });

    test('given economy type response then routes through economy conversion', async () => {
      // Given
      const genericResponse = {
        id: TEST_IDS.SIMULATION_ID,
        simulation_type: 'economy',
        status: 'completed',
        dataset_id: TEST_IDS.DATASET_ID,
        household_id: null,
        policy_id: TEST_IDS.POLICY_ID,
        output_dataset_id: null,
        filter_field: null,
        filter_value: null,
        household_result: null,
        error_message: null,
      };
      vi.stubGlobal('fetch', mockFetchSuccess(genericResponse));

      // When
      const result = await fetchSimulationByIdV2(TEST_IDS.SIMULATION_ID);

      // Then
      expect(result.populationType).toBe('geography');
      expect(result.populationId).toBe(TEST_IDS.DATASET_ID);
      expect(result.policyId).toBe(TEST_IDS.POLICY_ID);
      expect(result.status).toBe('complete');
    });
  });
});
