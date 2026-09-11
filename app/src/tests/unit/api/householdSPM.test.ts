import { afterEach, describe, expect, test, vi } from 'vitest';
import { createHousehold, fetchHouseholdById } from '@/api/household';
import { fetchHouseholdCalculationWithBundle } from '@/api/householdCalculation';
import { fetchHouseholdVariationWithProvenance } from '@/api/householdVariation';
import { Household } from '@/models/Household';
import { NATIONAL_SPM, SPM_RECEIPT, stateOnlyHousehold } from '@/tests/fixtures/spm/spmMocks';

function mockResponse(body: unknown) {
  const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
  vi.stubGlobal('fetch', mockFetch);
  return mockFetch;
}

afterEach(() => vi.unstubAllGlobals());

describe('SPM request and response plumbing', () => {
  test.each(['SPM_GEOGRAPHY_REQUIRED', 'SPM_GEOGRAPHY_UNAVAILABLE', 'SPM_COMPOSITION_REQUIRED'])(
    'given %s then preserves its structured validation detail',
    async (code) => {
      const message = 'Choose an available SPM geography and classify household adults.';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              status: 'error',
              message,
              result: null,
              errors: [{ code, message }],
            }),
            { status: 400 }
          )
        )
      );
      await expect(
        fetchHouseholdCalculationWithBundle('us', 'saved-household', 'policy')
      ).rejects.toMatchObject({ message, code });
    }
  );

  test('given national selection then create request stores it beside household data', async () => {
    const mockFetch = mockResponse({ result: { household_id: 'saved-household' } });
    await createHousehold(stateOnlyHousehold().withSPM(NATIONAL_SPM).toV1CreationPayload());
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.spm).toEqual(NATIONAL_SPM);
    expect(body.data).not.toHaveProperty('spm');
  });

  test('given a saved selection then metadata hydration preserves it for replay', async () => {
    const payload = stateOnlyHousehold().withSPM(NATIONAL_SPM).toV1CreationPayload();
    mockResponse({
      status: 'ok',
      result: {
        id: 'saved-household',
        country_id: 'us',
        household_json: payload.data,
        spm: payload.spm,
      },
    });
    const metadata = await fetchHouseholdById('us', 'saved-household');
    expect(Household.fromV1Metadata(metadata).toV1CreationPayload().spm).toEqual(NATIONAL_SPM);
  });

  test('given calculation provenance then the stored simulation envelope preserves JSON receipts', async () => {
    mockResponse({
      status: 'ok',
      result: { people: {} },
      spm_config: NATIONAL_SPM,
      spm_provenance: SPM_RECEIPT,
    });
    const result = await fetchHouseholdCalculationWithBundle(
      'us',
      'saved-household',
      'reform-policy'
    );
    expect(JSON.parse(JSON.stringify(result))).toMatchObject({
      spm_config: NATIONAL_SPM,
      spm_provenance: SPM_RECEIPT,
    });
  });

  test('given axes calculation then settings accompany the request and receipt accompanies the result', async () => {
    const mockFetch = mockResponse({
      status: 'ok',
      result: { people: {} },
      spm_config: NATIONAL_SPM,
      spm_provenance: SPM_RECEIPT,
    });
    const household = stateOnlyHousehold().toV1CreationPayload().data;
    const result = await fetchHouseholdVariationWithProvenance('us', household, {}, NATIONAL_SPM);
    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({
      household,
      policy: {},
      spm: NATIONAL_SPM,
    });
    expect(result.spm_provenance).toEqual(SPM_RECEIPT);
  });
});
