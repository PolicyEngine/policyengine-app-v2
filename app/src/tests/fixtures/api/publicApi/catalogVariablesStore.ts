import { vi } from 'vitest';
import { fetchCatalogVariables } from '@/api/publicApi/catalogVariables';
import { createPublicApiClient } from '@/api/publicApi/client';
import { catalogVariablesLoaded, clearMetadata, selectV2LoadId } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { catalogVariablesEnvelope } from '@/tests/fixtures/api/publicApi/catalogVariablesMocks';
import { TEST_POLICYENGINE_VERSION } from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import {
  jsonResponse,
  stubPublicApiFetch,
} from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import { TEST_API_BASE } from '@/tests/fixtures/api/v2UserMocks';
import { seedV2ModelCatalog } from '@/tests/fixtures/hooks/v3MetadataWrapper';

/**
 * The store as v3 has it after the switch once the background load is in:
 * the small model catalog (default fields, entities) and every variable of
 * the catalog version, loaded through the variables route's conversion.
 */
export async function seedV2CatalogVariables(): Promise<void> {
  stubPublicApiFetch();
  await seedV2ModelCatalog();
  const fetchMock = vi.fn(async () => jsonResponse(catalogVariablesEnvelope()));
  const loaded = await fetchCatalogVariables(
    'us',
    TEST_POLICYENGINE_VERSION,
    createPublicApiClient({
      baseUrl: TEST_API_BASE,
      fetchImpl: fetchMock as unknown as typeof fetch,
    })
  );
  store.dispatch(
    catalogVariablesLoaded({
      countryId: 'us',
      policyengineVersion: TEST_POLICYENGINE_VERSION,
      loadId: selectV2LoadId(store.getState())!,
      ...loaded,
    })
  );
}

export function clearV2CatalogVariables(): void {
  store.dispatch(clearMetadata());
  vi.unstubAllGlobals();
}
