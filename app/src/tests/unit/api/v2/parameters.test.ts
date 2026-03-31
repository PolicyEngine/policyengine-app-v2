import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchParameters } from '@/api/v2/parameters';
import { fetchParameterChildren, fetchParametersByName } from '@/api/v2/parameterTree';
import { BASELINE_POLICY_ID, fetchParameterValues } from '@/api/v2/parameterValues';
import {
  createMockParameterChildNode,
  mockFetchError,
  mockFetchSuccess,
  TEST_IDS,
} from '@/tests/fixtures/api/v2/shared';

vi.stubGlobal('fetch', vi.fn());

describe('parameters API', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  describe('fetchParameters', () => {
    test('given a successful response then it returns an array of parameters', async () => {
      // Given
      const mockParams = [
        { id: TEST_IDS.PARAMETER_ID, name: 'gov.irs.credits.ctc.amount', label: 'CTC amount' },
      ];
      vi.stubGlobal('fetch', mockFetchSuccess(mockParams));

      // When
      const result = await fetchParameters('us');

      // Then
      expect(result).toEqual(mockParams);
      expect(fetch).toHaveBeenCalledOnce();
    });

    test('given an error response then it throws with the country in the message', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetchError(500, 'Server error'));

      // When / Then
      await expect(fetchParameters('us')).rejects.toThrow('Failed to fetch parameters for us');
    });
  });
});

describe('parameterValues API', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  describe('fetchParameterValues', () => {
    test('given a baseline policy then it omits policy_id from the query params', async () => {
      // Given
      const mockValues = [{ id: 'val-1', value: 2000, start_date: '2026-01-01' }];
      vi.stubGlobal('fetch', mockFetchSuccess(mockValues));

      // When
      await fetchParameterValues(TEST_IDS.PARAMETER_ID, BASELINE_POLICY_ID);

      // Then
      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain(`parameter_id=${TEST_IDS.PARAMETER_ID}`);
      expect(calledUrl).not.toContain('policy_id');
    });

    test('given a non-baseline policy then it includes policy_id in the query params', async () => {
      // Given
      const mockValues = [{ id: 'val-1', value: 3000, start_date: '2026-01-01' }];
      vi.stubGlobal('fetch', mockFetchSuccess(mockValues));

      // When
      await fetchParameterValues(TEST_IDS.PARAMETER_ID, TEST_IDS.POLICY_ID);

      // Then
      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain(`parameter_id=${TEST_IDS.PARAMETER_ID}`);
      expect(calledUrl).toContain(`policy_id=${TEST_IDS.POLICY_ID}`);
    });

    test('given an error response then it throws', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetchError(500, 'Server error'));

      // When / Then
      await expect(fetchParameterValues(TEST_IDS.PARAMETER_ID, TEST_IDS.POLICY_ID)).rejects.toThrow(
        `Failed to fetch parameter values for parameter ${TEST_IDS.PARAMETER_ID} with policy ${TEST_IDS.POLICY_ID}`
      );
    });
  });
});

describe('parameterTree API', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  describe('fetchParameterChildren', () => {
    test('given a successful response then it returns the children response', async () => {
      // Given
      const mockResponse = {
        parent_path: 'gov',
        children: [createMockParameterChildNode()],
      };
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await fetchParameterChildren('gov', 'us');

      // Then
      expect(result).toEqual(mockResponse);
      expect(result.children).toHaveLength(1);
      expect(result.children[0].path).toBe('gov.irs');
    });

    test('given an error response then it throws with the parent path', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetchError(500, 'Server error'));

      // When / Then
      await expect(fetchParameterChildren('gov.irs', 'us')).rejects.toThrow(
        'Failed to fetch parameter children for path "gov.irs"'
      );
    });
  });

  describe('fetchParametersByName', () => {
    test('given an empty array then it returns an empty array without fetching', async () => {
      // Given
      const names: string[] = [];

      // When
      const result = await fetchParametersByName(names, 'us');

      // Then
      expect(result).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
    });

    test('given parameter names and a successful response then it returns parameter data', async () => {
      // Given
      const mockParams = [
        {
          id: TEST_IDS.PARAMETER_ID,
          name: 'gov.irs.credits.ctc.amount',
          label: 'CTC amount',
          description: 'Child Tax Credit amount',
          data_type: 'float',
          unit: 'currency-USD',
          tax_benefit_model_version_id: TEST_IDS.MODEL_VERSION_ID,
          created_at: '2026-01-15T12:00:00Z',
        },
      ];
      vi.stubGlobal('fetch', mockFetchSuccess(mockParams));

      // When
      const result = await fetchParametersByName(['gov.irs.credits.ctc.amount'], 'us');

      // Then
      expect(result).toEqual(mockParams);
      expect(fetch).toHaveBeenCalledOnce();
      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain('/parameters/by-name');
    });

    test('given an error response then it throws', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetchError(500, 'Server error'));

      // When / Then
      await expect(fetchParametersByName(['gov.irs.credits.ctc.amount'], 'us')).rejects.toThrow(
        'Failed to fetch parameters by name'
      );
    });
  });
});
