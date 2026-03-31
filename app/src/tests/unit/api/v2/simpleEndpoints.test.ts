import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchAnalysisOptions } from '@/api/v2/analysisOptions';
import { fetchDatasets } from '@/api/v2/datasets';
import { fetchRegionByCode, fetchRegions } from '@/api/v2/regions';
import { fetchReportFull } from '@/api/v2/reportFull';
import { fetchVariables } from '@/api/v2/variables';
import {
  createMockAnalysisOption,
  createMockRegionResponse,
  createMockReportFullResponse,
  mockFetch404,
  mockFetchError,
  mockFetchSuccess,
  TEST_IDS,
} from '@/tests/fixtures/api/v2/shared';

vi.stubGlobal('fetch', vi.fn());

describe('fetchVariables', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  test('given a successful response then it returns the variables array', async () => {
    // Given
    const mockVariables = [
      { id: 'var-1', name: 'employment_income', label: 'Employment income' },
      { id: 'var-2', name: 'net_income', label: 'Net income' },
    ];
    vi.stubGlobal('fetch', mockFetchSuccess(mockVariables));

    // When
    const result = await fetchVariables('us');

    // Then
    expect(result).toEqual(mockVariables);
    expect(fetch).toHaveBeenCalledOnce();
  });

  test('given an error response then it throws with the country in the message', async () => {
    // Given
    vi.stubGlobal('fetch', mockFetchError(500, 'Server error'));

    // When / Then
    await expect(fetchVariables('uk')).rejects.toThrow('fetchVariables(uk): 500 Server error');
  });
});

describe('fetchDatasets', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  test('given a successful response then it returns the datasets array', async () => {
    // Given
    const mockDatasets = [{ id: TEST_IDS.DATASET_ID, name: 'cps_2024', label: 'CPS 2024' }];
    vi.stubGlobal('fetch', mockFetchSuccess(mockDatasets));

    // When
    const result = await fetchDatasets('us');

    // Then
    expect(result).toEqual(mockDatasets);
    expect(fetch).toHaveBeenCalledOnce();
  });

  test('given an error response then it throws with the country in the message', async () => {
    // Given
    vi.stubGlobal('fetch', mockFetchError(500, 'Server error'));

    // When / Then
    await expect(fetchDatasets('us')).rejects.toThrow('fetchDatasets(us): 500 Server error');
  });
});

describe('fetchRegions', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  test('given a successful response without regionType then it returns regions', async () => {
    // Given
    const mockRegions = [createMockRegionResponse()];
    vi.stubGlobal('fetch', mockFetchSuccess(mockRegions));

    // When
    const result = await fetchRegions('us');

    // Then
    expect(result).toEqual(mockRegions);
    expect(fetch).toHaveBeenCalledOnce();
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain('country_id=us');
    expect(calledUrl).not.toContain('region_type');
  });

  test('given a successful response with regionType filter then it includes the filter in the URL', async () => {
    // Given
    const mockRegions = [createMockRegionResponse()];
    vi.stubGlobal('fetch', mockFetchSuccess(mockRegions));

    // When
    const result = await fetchRegions('us', 'state');

    // Then
    expect(result).toEqual(mockRegions);
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain('country_id=us');
    expect(calledUrl).toContain('region_type=state');
  });

  test('given an error response then it throws with the country in the message', async () => {
    // Given
    vi.stubGlobal('fetch', mockFetchError(500, 'Server error'));

    // When / Then
    await expect(fetchRegions('us')).rejects.toThrow('fetchRegions(us): 500 Server error');
  });
});

describe('fetchRegionByCode', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  test('given a successful response then it returns the region', async () => {
    // Given
    const mockRegion = createMockRegionResponse();
    vi.stubGlobal('fetch', mockFetchSuccess(mockRegion));

    // When
    const result = await fetchRegionByCode('us', 'state/ca');

    // Then
    expect(result).toEqual(mockRegion);
    expect(fetch).toHaveBeenCalledOnce();
  });

  test('given a 404 response then it throws a region not found error', async () => {
    // Given
    vi.stubGlobal('fetch', mockFetch404());

    // When / Then
    await expect(fetchRegionByCode('us', 'state/zz')).rejects.toThrow('Region not found: state/zz');
  });

  test('given a non-404 error response then it throws a generic fetch error', async () => {
    // Given
    vi.stubGlobal('fetch', mockFetchError(500, 'Server error'));

    // When / Then
    await expect(fetchRegionByCode('us', 'state/ca')).rejects.toThrow(
      'Failed to fetch region state/ca for us'
    );
  });
});

describe('fetchAnalysisOptions', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  test('given a successful response with country then it returns analysis options', async () => {
    // Given
    const mockOptions = [createMockAnalysisOption()];
    vi.stubGlobal('fetch', mockFetchSuccess(mockOptions));

    // When
    const result = await fetchAnalysisOptions('us');

    // Then
    expect(result).toEqual(mockOptions);
    expect(fetch).toHaveBeenCalledOnce();
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain('country=us');
  });

  test('given a successful response without country then it fetches without query param', async () => {
    // Given
    const mockOptions = [createMockAnalysisOption()];
    vi.stubGlobal('fetch', mockFetchSuccess(mockOptions));

    // When
    const result = await fetchAnalysisOptions();

    // Then
    expect(result).toEqual(mockOptions);
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('country=');
  });

  test('given an error response then it throws with status in the message', async () => {
    // Given
    vi.stubGlobal('fetch', mockFetchError(500, 'Server error'));

    // When / Then
    await expect(fetchAnalysisOptions('us')).rejects.toThrow(
      'fetchAnalysisOptions: 500 Server error'
    );
  });
});

describe('fetchReportFull', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  test('given a successful response then it returns the full report data', async () => {
    // Given
    const mockReport = createMockReportFullResponse();
    vi.stubGlobal('fetch', mockFetchSuccess(mockReport));

    // When
    const result = await fetchReportFull(TEST_IDS.REPORT_ID);

    // Then
    expect(result).toEqual(mockReport);
    expect(result.report.id).toBe(TEST_IDS.REPORT_ID);
    expect(result.report.status).toBe('completed');
    expect(fetch).toHaveBeenCalledOnce();
  });

  test('given an error response then it throws with the report id and status', async () => {
    // Given
    vi.stubGlobal('fetch', mockFetchError(500, 'Server error'));

    // When / Then
    await expect(fetchReportFull(TEST_IDS.REPORT_ID)).rejects.toThrow(
      `fetchReportFull(${TEST_IDS.REPORT_ID}): 500 Server error`
    );
  });
});
