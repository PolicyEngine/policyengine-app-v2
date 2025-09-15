import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createSimulation } from '@/api/simulation';
import { BASE_URL } from '@/constants';
import {
  TEST_COUNTRIES,
  HTTP_STATUS,
  SIMULATION_IDS,
  mockSimulationPayload,
  mockSimulationPayloadGeography,
  mockSimulationPayloadMinimal,
  mockCreateSimulationSuccessResponse,
  mockCreateSimulationErrorResponse,
  mockSuccessResponse,
  mockErrorResponse,
  mockNonJsonResponse,
  ERROR_MESSAGES,
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
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/${TEST_COUNTRIES.US}/simulation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(mockSimulationPayload),
      }
    );
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
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/${TEST_COUNTRIES.US}/simulation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(mockSimulationPayloadGeography),
      }
    );
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
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/${TEST_COUNTRIES.US}/simulation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(mockSimulationPayloadMinimal),
      }
    );
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
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse(mockCreateSimulationErrorResponse) as any
    );

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