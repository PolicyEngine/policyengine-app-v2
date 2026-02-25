import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createEconomySimulation,
  createHouseholdSimulation,
  fromEconomySimulationResponse,
  fromHouseholdSimulationResponse,
  getEconomySimulation,
  getHouseholdSimulation,
  pollEconomySimulation,
  pollHouseholdSimulation,
} from '@/api/v2/simulations';
import {
  mockEconomySimulationRequest,
  mockEconomySimulationResponse,
  mockErrorResponse,
  mockFailedEconomyResponse,
  mockFailedHouseholdResponse,
  mockHouseholdSimulationRequest,
  mockHouseholdSimulationResponse,
  mockNotFoundResponse,
  mockPendingEconomyResponse,
  mockPendingHouseholdResponse,
  mockRegionInfo,
  mockSuccessResponse,
  SIMULATION_ERROR_MESSAGES,
  TEST_DATASET_IDS,
} from '@/tests/fixtures/api/v2/simulationMocks';
import { TEST_SIMULATION_IDS } from '@/tests/fixtures/constants';

vi.mock('@/api/v2/taxBenefitModels', () => ({
  API_V2_BASE_URL: 'https://test-api.example.com',
}));

describe('fromHouseholdSimulationResponse', () => {
  test('given completed response then maps status to complete', () => {
    // Given
    const response = mockHouseholdSimulationResponse({ status: 'completed' });

    // When
    const result = fromHouseholdSimulationResponse(response);

    // Then
    expect(result.status).toBe('complete');
  });

  test('given failed response then maps status to error', () => {
    // Given
    const response = mockHouseholdSimulationResponse({ status: 'failed' });

    // When
    const result = fromHouseholdSimulationResponse(response);

    // Then
    expect(result.status).toBe('error');
  });

  test('given pending response then maps status to pending', () => {
    // Given
    const response = mockHouseholdSimulationResponse({ status: 'pending' });

    // When
    const result = fromHouseholdSimulationResponse(response);

    // Then
    expect(result.status).toBe('pending');
  });

  test('given running response then maps status to pending', () => {
    // Given
    const response = mockHouseholdSimulationResponse({ status: 'running' });

    // When
    const result = fromHouseholdSimulationResponse(response);

    // Then
    expect(result.status).toBe('pending');
  });

  test('given null policy_id then sets policyId to null', () => {
    // Given
    const response = mockHouseholdSimulationResponse({ policy_id: null });

    // When
    const result = fromHouseholdSimulationResponse(response);

    // Then
    expect(result.policyId).toBeNull();
  });

  test('given null household_id then sets populationId to undefined', () => {
    // Given
    const response = mockHouseholdSimulationResponse({ household_id: null });

    // When
    const result = fromHouseholdSimulationResponse(response);

    // Then
    expect(result.populationId).toBeUndefined();
  });
});

describe('fromEconomySimulationResponse', () => {
  test('given region with code then sets populationId from region.code', () => {
    // Given
    const response = mockEconomySimulationResponse({
      region: mockRegionInfo({ code: 'state/ny' }),
    });

    // When
    const result = fromEconomySimulationResponse(response);

    // Then
    expect(result.populationId).toBe('state/ny');
  });

  test('given no region but dataset_id then sets populationId from dataset_id', () => {
    // Given
    const response = mockEconomySimulationResponse({
      region: null,
      dataset_id: TEST_DATASET_IDS.CPS_2024,
    });

    // When
    const result = fromEconomySimulationResponse(response);

    // Then
    expect(result.populationId).toBe(TEST_DATASET_IDS.CPS_2024);
  });

  test('given no region and no dataset_id then sets populationId to undefined', () => {
    // Given
    const response = mockEconomySimulationResponse({
      region: null,
      dataset_id: null,
    });

    // When
    const result = fromEconomySimulationResponse(response);

    // Then
    expect(result.populationId).toBeUndefined();
  });

  test('given completed response then maps status to complete', () => {
    // Given
    const response = mockEconomySimulationResponse({ status: 'completed' });

    // When
    const result = fromEconomySimulationResponse(response);

    // Then
    expect(result.status).toBe('complete');
    expect(result.populationType).toBe('geography');
  });
});

describe('createHouseholdSimulation', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  test('given success response then returns parsed response', async () => {
    // Given
    const request = mockHouseholdSimulationRequest();
    const responseData = mockHouseholdSimulationResponse();
    vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(responseData) as unknown as Response);

    // When
    const result = await createHouseholdSimulation(request);

    // Then
    expect(result).toEqual(responseData);
    expect(fetch).toHaveBeenCalledWith('https://test-api.example.com/simulations/household', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
    });
  });

  test('given error response then throws with status and error text', async () => {
    // Given
    const request = mockHouseholdSimulationRequest();
    vi.mocked(fetch).mockResolvedValue(
      mockErrorResponse(500, 'Server error') as unknown as Response
    );

    // When/Then
    await expect(createHouseholdSimulation(request)).rejects.toThrow(
      SIMULATION_ERROR_MESSAGES.CREATE_HOUSEHOLD_FAILED(500, 'Server error')
    );
  });
});

describe('getHouseholdSimulation', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  test('given success response then returns parsed response', async () => {
    // Given
    const simulationId = TEST_SIMULATION_IDS.SIM_DEF;
    const responseData = mockHouseholdSimulationResponse();
    vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(responseData) as unknown as Response);

    // When
    const result = await getHouseholdSimulation(simulationId);

    // Then
    expect(result).toEqual(responseData);
    expect(fetch).toHaveBeenCalledWith(
      `https://test-api.example.com/simulations/household/${simulationId}`,
      { headers: { Accept: 'application/json' } }
    );
  });

  test('given 404 response then throws not found error', async () => {
    // Given
    const simulationId = TEST_SIMULATION_IDS.SIM_DEF;
    vi.mocked(fetch).mockResolvedValue(mockNotFoundResponse() as unknown as Response);

    // When/Then
    await expect(getHouseholdSimulation(simulationId)).rejects.toThrow(
      SIMULATION_ERROR_MESSAGES.GET_HOUSEHOLD_NOT_FOUND(simulationId)
    );
  });

  test('given other error response then throws with status', async () => {
    // Given
    const simulationId = TEST_SIMULATION_IDS.SIM_DEF;
    vi.mocked(fetch).mockResolvedValue(
      mockErrorResponse(500, 'Internal error') as unknown as Response
    );

    // When/Then
    await expect(getHouseholdSimulation(simulationId)).rejects.toThrow(
      SIMULATION_ERROR_MESSAGES.GET_HOUSEHOLD_FAILED(500, 'Internal error')
    );
  });
});

describe('pollHouseholdSimulation', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  test('given completed on first poll then returns immediately', async () => {
    // Given
    const simulationId = TEST_SIMULATION_IDS.SIM_DEF;
    const completedResponse = mockHouseholdSimulationResponse({ status: 'completed' });
    vi.mocked(fetch).mockResolvedValue(
      mockSuccessResponse(completedResponse) as unknown as Response
    );

    // When
    const result = await pollHouseholdSimulation(simulationId, {
      pollIntervalMs: 10,
      timeoutMs: 500,
    });

    // Then
    expect(result).toEqual(completedResponse);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('given failed on first poll then throws error message', async () => {
    // Given
    const simulationId = TEST_SIMULATION_IDS.SIM_DEF;
    const failedResponse = mockFailedHouseholdResponse('Something went wrong');
    vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(failedResponse) as unknown as Response);

    // When/Then
    await expect(
      pollHouseholdSimulation(simulationId, { pollIntervalMs: 10, timeoutMs: 500 })
    ).rejects.toThrow('Something went wrong');
  });

  test('given timeout then throws timeout error', async () => {
    // Given
    const simulationId = TEST_SIMULATION_IDS.SIM_DEF;
    const pendingResponse = mockPendingHouseholdResponse();
    vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(pendingResponse) as unknown as Response);

    // When/Then
    await expect(
      pollHouseholdSimulation(simulationId, { pollIntervalMs: 10, timeoutMs: 50 })
    ).rejects.toThrow(SIMULATION_ERROR_MESSAGES.HOUSEHOLD_TIMED_OUT);
  });
});

describe('createEconomySimulation', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  test('given success response then returns parsed response', async () => {
    // Given
    const request = mockEconomySimulationRequest();
    const responseData = mockEconomySimulationResponse();
    vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(responseData) as unknown as Response);

    // When
    const result = await createEconomySimulation(request);

    // Then
    expect(result).toEqual(responseData);
    expect(fetch).toHaveBeenCalledWith('https://test-api.example.com/simulations/economy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
    });
  });

  test('given error response then throws', async () => {
    // Given
    const request = mockEconomySimulationRequest();
    vi.mocked(fetch).mockResolvedValue(
      mockErrorResponse(500, 'Server error') as unknown as Response
    );

    // When/Then
    await expect(createEconomySimulation(request)).rejects.toThrow(
      SIMULATION_ERROR_MESSAGES.CREATE_ECONOMY_FAILED(500, 'Server error')
    );
  });
});

describe('getEconomySimulation', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  test('given success response then returns parsed response', async () => {
    // Given
    const simulationId = TEST_SIMULATION_IDS.SIM_GHI;
    const responseData = mockEconomySimulationResponse();
    vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(responseData) as unknown as Response);

    // When
    const result = await getEconomySimulation(simulationId);

    // Then
    expect(result).toEqual(responseData);
    expect(fetch).toHaveBeenCalledWith(
      `https://test-api.example.com/simulations/economy/${simulationId}`,
      { headers: { Accept: 'application/json' } }
    );
  });

  test('given 404 then throws not found error', async () => {
    // Given
    const simulationId = TEST_SIMULATION_IDS.SIM_GHI;
    vi.mocked(fetch).mockResolvedValue(mockNotFoundResponse() as unknown as Response);

    // When/Then
    await expect(getEconomySimulation(simulationId)).rejects.toThrow(
      SIMULATION_ERROR_MESSAGES.GET_ECONOMY_NOT_FOUND(simulationId)
    );
  });

  test('given other error response then throws with status', async () => {
    // Given
    const simulationId = TEST_SIMULATION_IDS.SIM_GHI;
    vi.mocked(fetch).mockResolvedValue(
      mockErrorResponse(500, 'Internal error') as unknown as Response
    );

    // When/Then
    await expect(getEconomySimulation(simulationId)).rejects.toThrow(
      SIMULATION_ERROR_MESSAGES.GET_ECONOMY_FAILED(500, 'Internal error')
    );
  });
});

describe('pollEconomySimulation', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  test('given completed on first poll then returns immediately', async () => {
    // Given
    const simulationId = TEST_SIMULATION_IDS.SIM_GHI;
    const completedResponse = mockEconomySimulationResponse({ status: 'completed' });
    vi.mocked(fetch).mockResolvedValue(
      mockSuccessResponse(completedResponse) as unknown as Response
    );

    // When
    const result = await pollEconomySimulation(simulationId, {
      pollIntervalMs: 10,
      timeoutMs: 500,
    });

    // Then
    expect(result).toEqual(completedResponse);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('given failed then throws', async () => {
    // Given
    const simulationId = TEST_SIMULATION_IDS.SIM_GHI;
    const failedResponse = mockFailedEconomyResponse('Economy calc failed');
    vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(failedResponse) as unknown as Response);

    // When/Then
    await expect(
      pollEconomySimulation(simulationId, { pollIntervalMs: 10, timeoutMs: 500 })
    ).rejects.toThrow('Economy calc failed');
  });

  test('given timeout then throws timeout error', async () => {
    // Given
    const simulationId = TEST_SIMULATION_IDS.SIM_GHI;
    const pendingResponse = mockPendingEconomyResponse();
    vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(pendingResponse) as unknown as Response);

    // When/Then
    await expect(
      pollEconomySimulation(simulationId, { pollIntervalMs: 10, timeoutMs: 50 })
    ).rejects.toThrow(SIMULATION_ERROR_MESSAGES.ECONOMY_TIMED_OUT);
  });
});
