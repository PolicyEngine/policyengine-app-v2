import { describe, expect, test, vi } from 'vitest';
import { CATALOG_PARAMETER_BATCH, fetchCatalogParameters } from '@/api/publicApi/catalogParameters';
import { createPublicApiClient } from '@/api/publicApi/client';
import {
  catalogParametersResult,
  STANDARD_DEDUCTION_JOINT_ID,
  STANDARD_DEDUCTION_SINGLE_ID,
  UNKNOWN_PARAMETER,
} from '@/tests/fixtures/api/publicApi/catalogParametersMocks';
import { TEST_POLICYENGINE_VERSION } from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import { jsonResponse } from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import {
  STANDARD_DEDUCTION_JOINT,
  STANDARD_DEDUCTION_SINGLE,
} from '@/tests/fixtures/api/publicApi/searchFileMocks';
import { TEST_API_BASE } from '@/tests/fixtures/api/v2UserMocks';

function catalogClient() {
  const fetchMock = vi.fn(async (request: Request) => {
    const names = new URL(request.url).searchParams.getAll('name');
    return jsonResponse({ status: 'ok', message: null, result: catalogParametersResult(names) });
  });
  const client = createPublicApiClient({
    baseUrl: TEST_API_BASE,
    fetchImpl: fetchMock as unknown as typeof fetch,
  });
  return { client, fetchMock };
}

describe('fetchCatalogParameters', () => {
  test('given names then one request asks for all of them at the catalog version', async () => {
    // Given
    const { client, fetchMock } = catalogClient();

    // When
    await fetchCatalogParameters(
      'us',
      TEST_POLICYENGINE_VERSION,
      [STANDARD_DEDUCTION_SINGLE, STANDARD_DEDUCTION_JOINT],
      client
    );

    // Then
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL((fetchMock.mock.calls[0][0] as Request).url);
    expect(url.pathname).toBe('/v2/model-catalog/parameters');
    expect(url.searchParams.get('policyengine_version')).toBe(TEST_POLICYENGINE_VERSION);
    expect(url.searchParams.getAll('name').sort()).toEqual(
      [STANDARD_DEDUCTION_JOINT, STANDARD_DEDUCTION_SINGLE].sort()
    );
  });

  test('given more names than one request takes then they are split into batches', async () => {
    const { client, fetchMock } = catalogClient();
    const names = Array.from(
      { length: CATALOG_PARAMETER_BATCH + 1 },
      (_, index) => `gov.example.parameter_${index}`
    );

    await fetchCatalogParameters('us', TEST_POLICYENGINE_VERSION, names, client);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('given a parameter then its values are dated as v1 dated them', async () => {
    const { client } = catalogClient();

    const loaded = await fetchCatalogParameters(
      'us',
      TEST_POLICYENGINE_VERSION,
      [STANDARD_DEDUCTION_SINGLE],
      client
    );

    expect(loaded.parameters[STANDARD_DEDUCTION_SINGLE]).toMatchObject({
      type: 'parameter',
      parameter: STANDARD_DEDUCTION_SINGLE,
      label: 'SINGLE',
      unit: 'currency-USD',
      economy: true,
      household: true,
      values: { '0000-01-01': 12000, '2025-01-01': 15000 },
    });
  });

  test('given the ancestors labels then breadcrumbs read them, with v1 labels for the unlabelled', async () => {
    const { client } = catalogClient();

    const loaded = await fetchCatalogParameters(
      'us',
      TEST_POLICYENGINE_VERSION,
      [STANDARD_DEDUCTION_SINGLE],
      client
    );

    expect(loaded.parameters['gov.irs.deductions.standard']).toMatchObject({
      type: 'parameterNode',
      label: 'Standard deduction',
    });
    expect(loaded.parameters['gov.irs.deductions'].label).toBe('deductions');
  });

  test('given the result then catalog IDs and missing names are kept', async () => {
    const { client } = catalogClient();

    const loaded = await fetchCatalogParameters(
      'us',
      TEST_POLICYENGINE_VERSION,
      [STANDARD_DEDUCTION_SINGLE, STANDARD_DEDUCTION_JOINT, UNKNOWN_PARAMETER],
      client
    );

    expect(loaded.parameterIds).toEqual({
      [STANDARD_DEDUCTION_SINGLE]: STANDARD_DEDUCTION_SINGLE_ID,
      [STANDARD_DEDUCTION_JOINT]: STANDARD_DEDUCTION_JOINT_ID,
    });
    expect(loaded.missingNames).toEqual([UNKNOWN_PARAMETER]);
  });
});
