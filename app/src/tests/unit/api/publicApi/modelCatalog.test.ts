import { describe, expect, test, vi } from 'vitest';
import { createPublicApiClient } from '@/api/publicApi/client';
import { fetchV2ModelCatalogMetadata } from '@/api/publicApi/modelCatalog';
import {
  modelCatalogEnvelope,
  TEST_CURRENT_LAW_ID,
  TEST_POLICYENGINE_VERSION,
  TEST_TAX_BENEFIT_MODEL_ID,
  US_MODEL_CATALOG_RESULT,
  US_SPM_AVAILABILITY,
} from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import { errorResponse, okResponse, TEST_API_BASE } from '@/tests/fixtures/api/v2UserMocks';

function clientReturning(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  const client = createPublicApiClient({
    baseUrl: TEST_API_BASE,
    fetchImpl: fetchMock as unknown as typeof fetch,
  });
  return { client, fetchMock };
}

describe('fetchV2ModelCatalogMetadata', () => {
  test('given a country then it reads only the small model catalog for it', async () => {
    // Given
    const { client, fetchMock } = clientReturning(okResponse(modelCatalogEnvelope().result));

    // When
    await fetchV2ModelCatalogMetadata('us', client);

    // Then
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.url).toBe(`${TEST_API_BASE}/v2/model-catalog?country_id=us`);
  });

  test('given the catalog then the metadata names its version and the v2 catalog it came from', async () => {
    const { client } = clientReturning(okResponse(modelCatalogEnvelope().result));

    const payload = await fetchV2ModelCatalogMetadata('us', client);

    expect(payload.status).toBe('ok');
    expect(payload.result.version).toBe(TEST_POLICYENGINE_VERSION);
    expect(payload.result.current_law_id).toBe(TEST_CURRENT_LAW_ID);
    expect(payload.result.v2Catalog).toEqual({
      policyengineVersion: TEST_POLICYENGINE_VERSION,
      taxBenefitModelId: TEST_TAX_BENEFIT_MODEL_ID,
    });
  });

  test('given the catalog then parameters and variables are left to load on demand', async () => {
    const { client } = clientReturning(okResponse(modelCatalogEnvelope().result));

    const payload = await fetchV2ModelCatalogMetadata('us', client);

    expect(payload.result.parameters).toEqual({});
    expect(payload.result.variables).toEqual({});
  });

  test('given the catalog then entities and basic inputs take the shape v3 reads', async () => {
    const { client } = clientReturning(okResponse(modelCatalogEnvelope().result));

    const payload = await fetchV2ModelCatalogMetadata('us', client);

    expect(payload.result.basicInputs).toEqual(['age', 'employment_income']);
    expect(payload.result.entities).toEqual({
      person: { key: 'person', plural: 'people', is_person: true },
      household: { key: 'household', plural: 'households', is_person: false },
    });
  });

  test('given the catalog then regions, years and datasets take the shape v1 gave', async () => {
    const { client } = clientReturning(okResponse(modelCatalogEnvelope().result));

    const payload = await fetchV2ModelCatalogMetadata('us', client);

    expect(payload.result.economy_options.region).toEqual([
      { name: 'us', label: 'United States', type: 'national' },
      { name: 'state/ca', label: 'California', type: 'state' },
      {
        name: 'congressional_district/CA-01',
        label: "California's 1st congressional district",
        type: 'congressional_district',
        state_abbreviation: 'CA',
        state_name: 'California',
      },
    ]);
    expect(payload.result.economy_options.time_period).toEqual([
      { name: 2025, label: '2025' },
      { name: 2026, label: '2026' },
    ]);
    expect(payload.result.economy_options.datasets).toEqual([
      { name: 'populace_us_2024', label: 'Microcosm', title: 'Microcosm', default: true },
    ]);
  });

  test('given a US catalog version with SPM settings then the metadata offers them, as v1 gave them', async () => {
    const { client } = clientReturning(okResponse(modelCatalogEnvelope().result));

    const payload = await fetchV2ModelCatalogMetadata('us', client);

    expect(payload.result.spm).toEqual({
      available: true,
      settings_schema: US_SPM_AVAILABILITY.settings_schema,
      defaults: US_SPM_AVAILABILITY.defaults,
    });
  });

  test('given a catalog version without SPM settings then the metadata says none are available', async () => {
    const { client } = clientReturning(
      okResponse(
        modelCatalogEnvelope({
          ...US_MODEL_CATALOG_RESULT,
          spm: { available: false, settings_schema: null, defaults: null },
        }).result
      )
    );

    const payload = await fetchV2ModelCatalogMetadata('us', client);

    expect(payload.result.spm).toEqual({ available: false });
  });

  test('given a failed request then it rejects with the API status', async () => {
    const { client } = clientReturning(errorResponse(503, 'The catalog is not published'));

    await expect(fetchV2ModelCatalogMetadata('us', client)).rejects.toMatchObject({
      status: 503,
    });
  });
});
