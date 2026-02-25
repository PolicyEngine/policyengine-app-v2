import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createHouseholdAnalysis,
  fromHouseholdImpactResponse,
  getHouseholdAnalysis,
  pollHouseholdAnalysis,
} from '@/api/v2/householdAnalysis';
import {
  HOUSEHOLD_ANALYSIS_ERROR_MESSAGES,
  mockErrorResponse,
  mockFailedHouseholdImpactResponse,
  mockHouseholdImpactRequest,
  mockHouseholdImpactResponse,
  mockHouseholdSimulationInfo,
  mockPendingHouseholdImpactResponse,
  mockSuccessResponse,
  TEST_HH_SIM_IDS,
} from '@/tests/fixtures/api/v2/householdAnalysisMocks';
import { TEST_REPORT_IDS } from '@/tests/fixtures/constants';

vi.mock('@/api/v2/taxBenefitModels', () => ({
  API_V2_BASE_URL: 'https://test-api.example.com',
}));

describe('fromHouseholdImpactResponse', () => {
  test('given both simulations then sets both simulationIds', () => {
    // Given
    const response = mockHouseholdImpactResponse({
      baseline_simulation: mockHouseholdSimulationInfo({ id: TEST_HH_SIM_IDS.BASELINE }),
      reform_simulation: mockHouseholdSimulationInfo({ id: TEST_HH_SIM_IDS.REFORM }),
    });

    // When
    const result = fromHouseholdImpactResponse(response);

    // Then
    expect(result.simulationIds).toEqual([TEST_HH_SIM_IDS.BASELINE, TEST_HH_SIM_IDS.REFORM]);
  });

  test('given null baseline_simulation then excludes from simulationIds', () => {
    // Given
    const response = mockHouseholdImpactResponse({
      baseline_simulation: null,
      reform_simulation: mockHouseholdSimulationInfo({ id: TEST_HH_SIM_IDS.REFORM }),
    });

    // When
    const result = fromHouseholdImpactResponse(response);

    // Then
    expect(result.simulationIds).toEqual([TEST_HH_SIM_IDS.REFORM]);
  });

  test('given null reform_simulation then excludes from simulationIds', () => {
    // Given
    const response = mockHouseholdImpactResponse({
      baseline_simulation: mockHouseholdSimulationInfo({ id: TEST_HH_SIM_IDS.BASELINE }),
      reform_simulation: null,
    });

    // When
    const result = fromHouseholdImpactResponse(response);

    // Then
    expect(result.simulationIds).toEqual([TEST_HH_SIM_IDS.BASELINE]);
  });

  test('given completed status then maps to complete', () => {
    // Given
    const response = mockHouseholdImpactResponse({ status: 'completed' });

    // When
    const result = fromHouseholdImpactResponse(response);

    // Then
    expect(result.status).toBe('complete');
    expect(result.outputType).toBe('household');
    expect(result.apiVersion).toBe('v2');
  });

  test('given failed status then maps to error', () => {
    // Given
    const response = mockHouseholdImpactResponse({ status: 'failed' });

    // When
    const result = fromHouseholdImpactResponse(response);

    // Then
    expect(result.status).toBe('error');
  });
});

describe('createHouseholdAnalysis', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  test('given success response then returns parsed response', async () => {
    // Given
    const request = mockHouseholdImpactRequest();
    const responseData = mockHouseholdImpactResponse();
    vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(responseData) as unknown as Response);

    // When
    const result = await createHouseholdAnalysis(request);

    // Then
    expect(result).toEqual(responseData);
    expect(fetch).toHaveBeenCalledWith('https://test-api.example.com/analysis/household-impact', {
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
    const request = mockHouseholdImpactRequest();
    vi.mocked(fetch).mockResolvedValue(
      mockErrorResponse(500, 'Server error') as unknown as Response
    );

    // When/Then
    await expect(createHouseholdAnalysis(request)).rejects.toThrow(
      HOUSEHOLD_ANALYSIS_ERROR_MESSAGES.CREATE_FAILED(500, 'Server error')
    );
  });
});

describe('getHouseholdAnalysis', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  test('given success response then returns parsed response', async () => {
    // Given
    const reportId = TEST_REPORT_IDS.REPORT_JKL;
    const responseData = mockHouseholdImpactResponse();
    vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(responseData) as unknown as Response);

    // When
    const result = await getHouseholdAnalysis(reportId);

    // Then
    expect(result).toEqual(responseData);
    expect(fetch).toHaveBeenCalledWith(
      `https://test-api.example.com/analysis/household-impact/${reportId}`,
      { headers: { Accept: 'application/json' } }
    );
  });

  test('given 404 then throws not found', async () => {
    // Given
    const reportId = TEST_REPORT_IDS.REPORT_JKL;
    vi.mocked(fetch).mockResolvedValue(mockErrorResponse(404, 'Not found') as unknown as Response);

    // When/Then
    await expect(getHouseholdAnalysis(reportId)).rejects.toThrow(
      HOUSEHOLD_ANALYSIS_ERROR_MESSAGES.GET_NOT_FOUND(reportId)
    );
  });

  test('given other error then throws', async () => {
    // Given
    const reportId = TEST_REPORT_IDS.REPORT_JKL;
    vi.mocked(fetch).mockResolvedValue(
      mockErrorResponse(500, 'Internal error') as unknown as Response
    );

    // When/Then
    await expect(getHouseholdAnalysis(reportId)).rejects.toThrow(
      HOUSEHOLD_ANALYSIS_ERROR_MESSAGES.GET_FAILED(500, 'Internal error')
    );
  });
});

describe('pollHouseholdAnalysis', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  test('given completed then returns', async () => {
    // Given
    const reportId = TEST_REPORT_IDS.REPORT_JKL;
    const completedResponse = mockHouseholdImpactResponse({ status: 'completed' });
    vi.mocked(fetch).mockResolvedValue(
      mockSuccessResponse(completedResponse) as unknown as Response
    );

    // When
    const result = await pollHouseholdAnalysis(reportId, {
      pollIntervalMs: 10,
      timeoutMs: 500,
    });

    // Then
    expect(result).toEqual(completedResponse);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('given failed then throws', async () => {
    // Given
    const reportId = TEST_REPORT_IDS.REPORT_JKL;
    const failedResponse = mockFailedHouseholdImpactResponse('Household calc error');
    vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(failedResponse) as unknown as Response);

    // When/Then
    await expect(
      pollHouseholdAnalysis(reportId, { pollIntervalMs: 10, timeoutMs: 500 })
    ).rejects.toThrow('Household calc error');
  });

  test('given timeout then throws', async () => {
    // Given
    const reportId = TEST_REPORT_IDS.REPORT_JKL;
    const pendingResponse = mockPendingHouseholdImpactResponse();
    vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(pendingResponse) as unknown as Response);

    // When/Then
    await expect(
      pollHouseholdAnalysis(reportId, { pollIntervalMs: 10, timeoutMs: 50 })
    ).rejects.toThrow(HOUSEHOLD_ANALYSIS_ERROR_MESSAGES.ANALYSIS_TIMED_OUT);
  });
});
