import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createPolicyV2, fetchPolicyByIdV2 } from '@/api/v2/policies';
import { mockFetchSuccess, TEST_IDS, TEST_TIMESTAMP } from '@/tests/fixtures/api/v2/shared';

vi.stubGlobal('fetch', vi.fn());

const mockPolicyV2Response = {
  id: TEST_IDS.POLICY_ID,
  name: 'My reform',
  description: null,
  tax_benefit_model_id: TEST_IDS.MODEL_ID,
  created_at: TEST_TIMESTAMP,
  updated_at: TEST_TIMESTAMP,
  parameter_values: [
    {
      id: 'pv-1',
      parameter_id: TEST_IDS.PARAMETER_ID,
      parameter_name: 'gov.irs.credits.ctc.amount',
      value_json: 2000,
      start_date: '2026-01-01T00:00:00Z',
      end_date: null,
      policy_id: TEST_IDS.POLICY_ID,
      dynamic_id: null,
      created_at: TEST_TIMESTAMP,
    },
  ],
};

describe('policies v2 API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given a policy create payload then POSTs to /policies/', async () => {
    vi.stubGlobal('fetch', mockFetchSuccess(mockPolicyV2Response));

    const result = await createPolicyV2({
      name: 'My reform',
      description: null,
      tax_benefit_model_id: TEST_IDS.MODEL_ID,
      parameter_values: [
        {
          parameter_id: TEST_IDS.PARAMETER_ID,
          value_json: 2000,
          start_date: '2026-01-01T00:00:00Z',
          end_date: null,
        },
      ],
    });

    expect(result).toEqual(mockPolicyV2Response);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/policies/'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining(TEST_IDS.PARAMETER_ID),
      })
    );
  });

  test('given policy ID then fetches /policies/{id}', async () => {
    vi.stubGlobal('fetch', mockFetchSuccess(mockPolicyV2Response));

    const result = await fetchPolicyByIdV2(TEST_IDS.POLICY_ID);

    expect(result.id).toBe(TEST_IDS.POLICY_ID);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/policies/${TEST_IDS.POLICY_ID}`),
      {}
    );
  });
});
