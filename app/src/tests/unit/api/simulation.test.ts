import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createSimulation,
  fetchSimulationById,
  markSimulationCompleted,
  markSimulationError,
  updateSimulationOutput,
} from '@/api/simulation';
import { BASE_URL } from '@/constants';
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  mockCreateSimulationErrorResponse,
  mockCreateSimulationSuccessResponse,
  mockErrorResponse,
  mockFetchSimulationNotFoundResponse,
  mockFetchSimulationSuccessResponse,
  mockMarkSimulationErrorSuccessResponse,
  mockNonJsonResponse,
  mockSimulationMetadata,
  mockSimulationMetadataError,
  mockSimulationMetadataWithOutput,
  mockSimulationOutput,
  mockSimulationPayload,
  mockSimulationPayloadGeography,
  mockSimulationPayloadMinimal,
  mockSuccessResponse,
  mockUpdateSimulationOutputErrorResponse,
  mockUpdateSimulationOutputSuccessResponse,
  SIMULATION_IDS,
  TEST_COUNTRIES,
} from '@/tests/fixtures/api/simulationMocks';

// Mock fetch globally
global.fetch = vi.fn();

describe('createSimulation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given valid household simulation data then creates simulation successfully', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse(mockCreateSimulationSuccessResponse) as any
    );

    // When
    const result = await createSimulation(TEST_COUNTRIES.US, mockSimulationPayload);

    // Then
    expect(mockFetch).toHaveBeenCalledWith(`${BASE_URL}/${TEST_COUNTRIES.US}/simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(mockSimulationPayload),
    });
    expect(result).toEqual({
      result: {
        simulation_id: String(mockCreateSimulationSuccessResponse.result.id),
      },
    });
  });

  test('given geography simulation data then creates simulation successfully', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    const geographyResponse = {
      ...mockCreateSimulationSuccessResponse,
      result: {
        ...mockCreateSimulationSuccessResponse.result,
        population_id: mockSimulationPayloadGeography.population_id,
        population_type: mockSimulationPayloadGeography.population_type,
      },
    };
    mockFetch.mockResolvedValueOnce(mockSuccessResponse(geographyResponse) as any);

    // When
    const result = await createSimulation(TEST_COUNTRIES.US, mockSimulationPayloadGeography);

    // Then
    expect(mockFetch).toHaveBeenCalledWith(`${BASE_URL}/${TEST_COUNTRIES.US}/simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(mockSimulationPayloadGeography),
    });
    expect(result).toEqual({
      result: {
        simulation_id: String(geographyResponse.result.id),
      },
    });
  });

  test('given minimal simulation data then creates simulation with only required fields', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    const minimalResponse = {
      ...mockCreateSimulationSuccessResponse,
      result: {
        ...mockCreateSimulationSuccessResponse.result,
        population_id: mockSimulationPayloadMinimal.population_id,
        policy_id: null,
      },
    };
    mockFetch.mockResolvedValueOnce(mockSuccessResponse(minimalResponse) as any);

    // When
    const result = await createSimulation(TEST_COUNTRIES.US, mockSimulationPayloadMinimal);

    // Then
    expect(mockFetch).toHaveBeenCalledWith(`${BASE_URL}/${TEST_COUNTRIES.US}/simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(mockSimulationPayloadMinimal),
    });
    expect(result).toEqual({
      result: {
        simulation_id: String(minimalResponse.result.id),
      },
    });
  });

  test('given different country ID then uses correct endpoint', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse(mockCreateSimulationSuccessResponse) as any
    );

    // When
    await createSimulation(TEST_COUNTRIES.UK, mockSimulationPayload);

    // Then
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/${TEST_COUNTRIES.UK}/simulation`,
      expect.any(Object)
    );
  });

  test('given HTTP error response then throws error with status', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      mockErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal Server Error') as any
    );

    // When/Then
    await expect(createSimulation(TEST_COUNTRIES.US, mockSimulationPayload)).rejects.toThrow(
      ERROR_MESSAGES.CREATE_FAILED_WITH_STATUS(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Internal Server Error'
      )
    );
  });

  test('given 400 bad request then throws error with status', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      mockErrorResponse(HTTP_STATUS.BAD_REQUEST, 'Bad Request') as any
    );

    // When/Then
    await expect(createSimulation(TEST_COUNTRIES.US, mockSimulationPayload)).rejects.toThrow(
      ERROR_MESSAGES.CREATE_FAILED_WITH_STATUS(HTTP_STATUS.BAD_REQUEST, 'Bad Request')
    );
  });

  test('given non-JSON response then throws parse error', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(mockNonJsonResponse() as any);

    // When/Then
    await expect(createSimulation(TEST_COUNTRIES.US, mockSimulationPayload)).rejects.toThrow(
      /Failed to parse simulation response/
    );
  });

  test('given API returns error status then throws error with message', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(mockSuccessResponse(mockCreateSimulationErrorResponse) as any);

    // When/Then
    await expect(createSimulation(TEST_COUNTRIES.US, mockSimulationPayload)).rejects.toThrow(
      mockCreateSimulationErrorResponse.message
    );
  });

  test('given API returns error status without message then throws generic error', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    const responseWithoutMessage = {
      status: 'error',
      message: null,
      result: null,
    };
    mockFetch.mockResolvedValueOnce(mockSuccessResponse(responseWithoutMessage) as any);

    // When/Then
    await expect(createSimulation(TEST_COUNTRIES.US, mockSimulationPayload)).rejects.toThrow(
      ERROR_MESSAGES.CREATE_FAILED
    );
  });

  test('given network failure then throws error', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    const networkError = new Error('Network error');
    mockFetch.mockRejectedValueOnce(networkError);

    // When/Then
    await expect(createSimulation(TEST_COUNTRIES.US, mockSimulationPayload)).rejects.toThrow(
      networkError
    );
  });
});

describe('fetchSimulationById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given valid simulation ID then fetches simulation successfully', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(mockSuccessResponse(mockFetchSimulationSuccessResponse) as any);

    // When
    const result = await fetchSimulationById(TEST_COUNTRIES.US, SIMULATION_IDS.VALID);

    // Then
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/${TEST_COUNTRIES.US}/simulation/${SIMULATION_IDS.VALID}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );
    expect(result).toEqual(mockSimulationMetadata);
  });

  test('given different country ID then uses correct endpoint', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(mockSuccessResponse(mockFetchSimulationSuccessResponse) as any);

    // When
    await fetchSimulationById(TEST_COUNTRIES.UK, SIMULATION_IDS.VALID);

    // Then
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/${TEST_COUNTRIES.UK}/simulation/${SIMULATION_IDS.VALID}`,
      expect.any(Object)
    );
  });

  test('given non-existent simulation ID then throws not found error', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(mockErrorResponse(HTTP_STATUS.NOT_FOUND, 'Not Found') as any);

    // When/Then
    await expect(
      fetchSimulationById(TEST_COUNTRIES.US, SIMULATION_IDS.NON_EXISTENT)
    ).rejects.toThrow(
      `Failed to fetch simulation ${SIMULATION_IDS.NON_EXISTENT}: ${HTTP_STATUS.NOT_FOUND} Not Found`
    );
  });

  test('given HTTP error response then throws error with status', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      mockErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal Server Error') as any
    );

    // When/Then
    await expect(fetchSimulationById(TEST_COUNTRIES.US, SIMULATION_IDS.VALID)).rejects.toThrow(
      `Failed to fetch simulation ${SIMULATION_IDS.VALID}: ${HTTP_STATUS.INTERNAL_SERVER_ERROR} Internal Server Error`
    );
  });

  test('given non-JSON response then throws parse error', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(mockNonJsonResponse() as any);

    // When/Then
    await expect(fetchSimulationById(TEST_COUNTRIES.US, SIMULATION_IDS.VALID)).rejects.toThrow(
      /Failed to parse simulation response/
    );
  });

  test('given API returns error status then throws error with message', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse(mockFetchSimulationNotFoundResponse) as any
    );

    // When/Then
    await expect(
      fetchSimulationById(TEST_COUNTRIES.US, SIMULATION_IDS.NON_EXISTENT)
    ).rejects.toThrow(mockFetchSimulationNotFoundResponse.message);
  });

  test('given API returns error status without message then throws generic error', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    const responseWithoutMessage = {
      status: 'error',
      message: null,
      result: null,
    };
    mockFetch.mockResolvedValueOnce(mockSuccessResponse(responseWithoutMessage) as any);

    // When/Then
    await expect(fetchSimulationById(TEST_COUNTRIES.US, SIMULATION_IDS.VALID)).rejects.toThrow(
      `Failed to fetch simulation ${SIMULATION_IDS.VALID}`
    );
  });

  test('given network failure then throws error', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    const networkError = new Error('Network error');
    mockFetch.mockRejectedValueOnce(networkError);

    // When/Then
    await expect(fetchSimulationById(TEST_COUNTRIES.US, SIMULATION_IDS.VALID)).rejects.toThrow(
      networkError
    );
  });

  test('given geography type simulation then returns correct metadata', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    const geographyMetadata = {
      ...mockSimulationMetadata,
      population_type: 'geography' as const,
      population_id: 'california',
    };
    const geographyResponse = {
      ...mockFetchSimulationSuccessResponse,
      result: geographyMetadata,
    };
    mockFetch.mockResolvedValueOnce(mockSuccessResponse(geographyResponse) as any);

    // When
    const result = await fetchSimulationById(TEST_COUNTRIES.US, SIMULATION_IDS.VALID);

    // Then
    expect(result).toEqual(geographyMetadata);
    expect(result.population_type).toBe('geography');
  });
});

describe('updateSimulationOutput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given valid output data then updates simulation successfully', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse(mockUpdateSimulationOutputSuccessResponse) as any
    );

    // When
    const result = await updateSimulationOutput(
      TEST_COUNTRIES.US,
      SIMULATION_IDS.VALID,
      mockSimulationOutput
    );

    // Then
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/${TEST_COUNTRIES.US}/simulation`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          id: parseInt(SIMULATION_IDS.VALID, 10),
          output: JSON.stringify(mockSimulationOutput),
          status: 'complete',
        }),
      }
    );
    expect(result).toEqual(mockSimulationMetadataWithOutput);
  });

  test('given different country ID then uses correct endpoint', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse(mockUpdateSimulationOutputSuccessResponse) as any
    );

    // When
    await updateSimulationOutput(TEST_COUNTRIES.UK, SIMULATION_IDS.VALID, mockSimulationOutput);

    // Then
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/${TEST_COUNTRIES.UK}/simulation`,
      expect.any(Object)
    );
  });

  test('given HTTP error response then throws error with status', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      mockErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal Server Error') as any
    );

    // When/Then
    await expect(
      updateSimulationOutput(TEST_COUNTRIES.US, SIMULATION_IDS.VALID, mockSimulationOutput)
    ).rejects.toThrow(
      ERROR_MESSAGES.UPDATE_FAILED_WITH_STATUS(
        SIMULATION_IDS.VALID,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Internal Server Error'
      )
    );
  });

  test('given API returns error status then throws error with message', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse(mockUpdateSimulationOutputErrorResponse) as any
    );

    // When/Then
    await expect(
      updateSimulationOutput(TEST_COUNTRIES.US, SIMULATION_IDS.VALID, mockSimulationOutput)
    ).rejects.toThrow(mockUpdateSimulationOutputErrorResponse.message);
  });

  test('given API returns error status without message then throws generic error', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    const responseWithoutMessage = {
      status: 'error',
      message: null,
      result: null,
    };
    mockFetch.mockResolvedValueOnce(mockSuccessResponse(responseWithoutMessage) as any);

    // When/Then
    await expect(
      updateSimulationOutput(TEST_COUNTRIES.US, SIMULATION_IDS.VALID, mockSimulationOutput)
    ).rejects.toThrow(ERROR_MESSAGES.UPDATE_FAILED(SIMULATION_IDS.VALID));
  });

  test('given network failure then throws error', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    const networkError = new Error('Network error');
    mockFetch.mockRejectedValueOnce(networkError);

    // When/Then
    await expect(
      updateSimulationOutput(TEST_COUNTRIES.US, SIMULATION_IDS.VALID, mockSimulationOutput)
    ).rejects.toThrow(networkError);
  });
});

describe('markSimulationCompleted', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given simulation output then marks simulation as completed', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse(mockUpdateSimulationOutputSuccessResponse) as any
    );

    // When
    const result = await markSimulationCompleted(
      TEST_COUNTRIES.US,
      SIMULATION_IDS.VALID,
      mockSimulationOutput
    );

    // Then
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/${TEST_COUNTRIES.US}/simulation`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          id: parseInt(SIMULATION_IDS.VALID, 10),
          output: JSON.stringify(mockSimulationOutput),
          status: 'complete',
        }),
      }
    );
    expect(result).toEqual(mockSimulationMetadataWithOutput);
  });
});

describe('markSimulationError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given simulation ID then marks simulation as errored', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse(mockMarkSimulationErrorSuccessResponse) as any
    );

    // When
    const result = await markSimulationError(TEST_COUNTRIES.US, SIMULATION_IDS.VALID);

    // Then
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/${TEST_COUNTRIES.US}/simulation`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          id: parseInt(SIMULATION_IDS.VALID, 10),
          output: null,
          status: 'error',
        }),
      }
    );
    expect(result).toEqual(mockSimulationMetadataError);
  });

  test('given different country ID then uses correct endpoint', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse(mockMarkSimulationErrorSuccessResponse) as any
    );

    // When
    await markSimulationError(TEST_COUNTRIES.UK, SIMULATION_IDS.VALID);

    // Then
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/${TEST_COUNTRIES.UK}/simulation`,
      expect.any(Object)
    );
  });

  test('given HTTP error response then throws error with status', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      mockErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal Server Error') as any
    );

    // When/Then
    await expect(markSimulationError(TEST_COUNTRIES.US, SIMULATION_IDS.VALID)).rejects.toThrow(
      ERROR_MESSAGES.MARK_ERROR_FAILED_WITH_STATUS(
        SIMULATION_IDS.VALID,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Internal Server Error'
      )
    );
  });

  test('given API returns error status then throws error with message', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    const errorResponse = {
      status: 'error',
      message: 'Failed to mark as error',
      result: null,
    };
    mockFetch.mockResolvedValueOnce(mockSuccessResponse(errorResponse) as any);

    // When/Then
    await expect(markSimulationError(TEST_COUNTRIES.US, SIMULATION_IDS.VALID)).rejects.toThrow(
      errorResponse.message
    );
  });

  test('given API returns error status without message then throws generic error', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    const responseWithoutMessage = {
      status: 'error',
      message: null,
      result: null,
    };
    mockFetch.mockResolvedValueOnce(mockSuccessResponse(responseWithoutMessage) as any);

    // When/Then
    await expect(markSimulationError(TEST_COUNTRIES.US, SIMULATION_IDS.VALID)).rejects.toThrow(
      ERROR_MESSAGES.MARK_ERROR_FAILED(SIMULATION_IDS.VALID)
    );
  });

  test('given network failure then throws error', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    const networkError = new Error('Network error');
    mockFetch.mockRejectedValueOnce(networkError);

    // When/Then
    await expect(markSimulationError(TEST_COUNTRIES.US, SIMULATION_IDS.VALID)).rejects.toThrow(
      networkError
    );
  });
});
