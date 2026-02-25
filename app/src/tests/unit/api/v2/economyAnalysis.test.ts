import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createEconomyAnalysis,
  createEconomyCustomAnalysis,
  fromEconomicImpactResponse,
  getEconomyAnalysis,
  getEconomyCustomAnalysis,
  pollEconomyAnalysis,
} from '@/api/v2/economyAnalysis';
import {
  ECONOMY_ANALYSIS_ERROR_MESSAGES,
  mockEconomicImpactRequest,
  mockEconomicImpactResponse,
  mockEconomyCustomRequest,
  mockErrorResponse,
  mockFailedEconomicImpactResponse,
  mockPendingEconomicImpactResponse,
  mockSuccessResponse,
  TEST_BASELINE_SIM_ID,
  TEST_REFORM_SIM_ID,
} from '@/tests/fixtures/api/v2/economyAnalysisMocks';
import { TEST_REPORT_IDS } from '@/tests/fixtures/constants';

vi.mock('@/api/v2/taxBenefitModels', () => ({
  API_V2_BASE_URL: 'https://test-api.example.com',
}));

describe('fromEconomicImpactResponse', () => {
  test('given completed response then maps to Report with status complete', () => {
    // Given
    const response = mockEconomicImpactResponse({ status: 'completed' });

    // When
    const result = fromEconomicImpactResponse(response);

    // Then
    expect(result.status).toBe('complete');
    expect(result.id).toBe(response.report_id);
  });

  test('given failed response then maps status to error', () => {
    // Given
    const response = mockEconomicImpactResponse({ status: 'failed' });

    // When
    const result = fromEconomicImpactResponse(response);

    // Then
    expect(result.status).toBe('error');
  });

  test('given pending response then maps status to pending', () => {
    // Given
    const response = mockEconomicImpactResponse({ status: 'pending' });

    // When
    const result = fromEconomicImpactResponse(response);

    // Then
    expect(result.status).toBe('pending');
  });

  test('given response then sets apiVersion to v2 and outputType to economy', () => {
    // Given
    const response = mockEconomicImpactResponse();

    // When
    const result = fromEconomicImpactResponse(response);

    // Then
    expect(result.apiVersion).toBe('v2');
    expect(result.outputType).toBe('economy');
  });

  test('given response then sets simulationIds from both simulations', () => {
    // Given
    const response = mockEconomicImpactResponse();

    // When
    const result = fromEconomicImpactResponse(response);

    // Then
    expect(result.simulationIds).toEqual([TEST_BASELINE_SIM_ID, TEST_REFORM_SIM_ID]);
  });
});

describe('createEconomyAnalysis', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  test('given success response then returns parsed response', async () => {
    // Given
    const request = mockEconomicImpactRequest();
    const responseData = mockEconomicImpactResponse();
    vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(responseData) as unknown as Response);

    // When
    const result = await createEconomyAnalysis(request);

    // Then
    expect(result).toEqual(responseData);
    expect(fetch).toHaveBeenCalledWith('https://test-api.example.com/analysis/economic-impact', {
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
    const request = mockEconomicImpactRequest();
    vi.mocked(fetch).mockResolvedValue(
      mockErrorResponse(500, 'Server error') as unknown as Response
    );

    // When/Then
    await expect(createEconomyAnalysis(request)).rejects.toThrow(
      ECONOMY_ANALYSIS_ERROR_MESSAGES.CREATE_FAILED(500, 'Server error')
    );
  });
});

describe('getEconomyAnalysis', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  test('given success response then returns parsed response', async () => {
    // Given
    const reportId = TEST_REPORT_IDS.REPORT_JKL;
    const responseData = mockEconomicImpactResponse();
    vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(responseData) as unknown as Response);

    // When
    const result = await getEconomyAnalysis(reportId);

    // Then
    expect(result).toEqual(responseData);
    expect(fetch).toHaveBeenCalledWith(
      `https://test-api.example.com/analysis/economic-impact/${reportId}`,
      { headers: { Accept: 'application/json' } }
    );
  });

  test('given 404 then throws not found', async () => {
    // Given
    const reportId = TEST_REPORT_IDS.REPORT_JKL;
    vi.mocked(fetch).mockResolvedValue(mockErrorResponse(404, 'Not found') as unknown as Response);

    // When/Then
    await expect(getEconomyAnalysis(reportId)).rejects.toThrow(
      ECONOMY_ANALYSIS_ERROR_MESSAGES.GET_NOT_FOUND(reportId)
    );
  });

  test('given other error then throws', async () => {
    // Given
    const reportId = TEST_REPORT_IDS.REPORT_JKL;
    vi.mocked(fetch).mockResolvedValue(
      mockErrorResponse(500, 'Internal error') as unknown as Response
    );

    // When/Then
    await expect(getEconomyAnalysis(reportId)).rejects.toThrow(
      ECONOMY_ANALYSIS_ERROR_MESSAGES.GET_FAILED(500, 'Internal error')
    );
  });
});

describe('pollEconomyAnalysis', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  test('given completed on first poll then returns', async () => {
    // Given
    const reportId = TEST_REPORT_IDS.REPORT_JKL;
    const completedResponse = mockEconomicImpactResponse({ status: 'completed' });
    vi.mocked(fetch).mockResolvedValue(
      mockSuccessResponse(completedResponse) as unknown as Response
    );

    // When
    const result = await pollEconomyAnalysis(reportId, {
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
    const failedResponse = mockFailedEconomicImpactResponse('Analysis calculation error');
    vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(failedResponse) as unknown as Response);

    // When/Then
    await expect(
      pollEconomyAnalysis(reportId, { pollIntervalMs: 10, timeoutMs: 500 })
    ).rejects.toThrow('Analysis calculation error');
  });

  test('given timeout then throws', async () => {
    // Given
    const reportId = TEST_REPORT_IDS.REPORT_JKL;
    const pendingResponse = mockPendingEconomicImpactResponse();
    vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(pendingResponse) as unknown as Response);

    // When/Then
    await expect(
      pollEconomyAnalysis(reportId, { pollIntervalMs: 10, timeoutMs: 50 })
    ).rejects.toThrow(ECONOMY_ANALYSIS_ERROR_MESSAGES.ANALYSIS_TIMED_OUT);
  });
});

describe('createEconomyCustomAnalysis', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  test('given success response then returns parsed response', async () => {
    // Given
    const request = mockEconomyCustomRequest();
    const responseData = mockEconomicImpactResponse();
    vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(responseData) as unknown as Response);

    // When
    const result = await createEconomyCustomAnalysis(request);

    // Then
    expect(result).toEqual(responseData);
    expect(fetch).toHaveBeenCalledWith('https://test-api.example.com/analysis/economy-custom', {
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
    const request = mockEconomyCustomRequest();
    vi.mocked(fetch).mockResolvedValue(
      mockErrorResponse(500, 'Server error') as unknown as Response
    );

    // When/Then
    await expect(createEconomyCustomAnalysis(request)).rejects.toThrow(
      ECONOMY_ANALYSIS_ERROR_MESSAGES.CREATE_CUSTOM_FAILED(500, 'Server error')
    );
  });
});

describe('getEconomyCustomAnalysis', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  test('given success response then returns parsed response', async () => {
    // Given
    const reportId = TEST_REPORT_IDS.REPORT_JKL;
    const modules = ['decile_impacts', 'poverty'];
    const responseData = mockEconomicImpactResponse();
    vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(responseData) as unknown as Response);

    // When
    const result = await getEconomyCustomAnalysis(reportId, modules);

    // Then
    expect(result).toEqual(responseData);
    expect(fetch).toHaveBeenCalledWith(
      `https://test-api.example.com/analysis/economy-custom/${reportId}?modules=decile_impacts%2Cpoverty`,
      { headers: { Accept: 'application/json' } }
    );
  });

  test('given 404 then throws not found', async () => {
    // Given
    const reportId = TEST_REPORT_IDS.REPORT_JKL;
    vi.mocked(fetch).mockResolvedValue(mockErrorResponse(404, 'Not found') as unknown as Response);

    // When/Then
    await expect(getEconomyCustomAnalysis(reportId, ['decile_impacts'])).rejects.toThrow(
      ECONOMY_ANALYSIS_ERROR_MESSAGES.GET_CUSTOM_NOT_FOUND(reportId)
    );
  });

  test('given other error then throws', async () => {
    // Given
    const reportId = TEST_REPORT_IDS.REPORT_JKL;
    vi.mocked(fetch).mockResolvedValue(
      mockErrorResponse(500, 'Internal error') as unknown as Response
    );

    // When/Then
    await expect(getEconomyCustomAnalysis(reportId, ['decile_impacts'])).rejects.toThrow(
      ECONOMY_ANALYSIS_ERROR_MESSAGES.GET_CUSTOM_FAILED(500, 'Internal error')
    );
  });
});
