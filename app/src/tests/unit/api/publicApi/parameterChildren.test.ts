import { describe, expect, test, vi } from 'vitest';
import { createPublicApiClient } from '@/api/publicApi/client';
import { fetchParameterChildren } from '@/api/publicApi/parameterChildren';
import { TEST_POLICYENGINE_VERSION } from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import { childrenPage } from '@/tests/fixtures/api/publicApi/parameterChildrenMocks';
import { jsonResponse } from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import { TEST_API_BASE } from '@/tests/fixtures/api/v2UserMocks';

function childrenClient(pageSize?: number) {
  const fetchMock = vi.fn(async (request: Request) => {
    const url = new URL(request.url);
    return jsonResponse(
      childrenPage(
        url.searchParams.get('parent_path') ?? '',
        Number(url.searchParams.get('offset') ?? 0),
        pageSize ?? Number(url.searchParams.get('limit') ?? 500)
      )
    );
  });
  const client = createPublicApiClient({
    baseUrl: TEST_API_BASE,
    fetchImpl: fetchMock as unknown as typeof fetch,
  });
  return { client, fetchMock };
}

describe('fetchParameterChildren', () => {
  test('given a node then it asks for what a reform can change under it, at the version', async () => {
    // Given
    const { client, fetchMock } = childrenClient();

    // When
    const children = await fetchParameterChildren(
      'us',
      TEST_POLICYENGINE_VERSION,
      'gov.irs',
      client
    );

    // Then
    const url = new URL((fetchMock.mock.calls[0][0] as Request).url);
    expect(url.pathname).toBe('/v2/parameters/children');
    expect(url.searchParams.get('parent_path')).toBe('gov.irs');
    expect(url.searchParams.get('reform_changeable')).toBe('true');
    expect(url.searchParams.get('policyengine_version')).toBe(TEST_POLICYENGINE_VERSION);
    expect(children.map((child) => child.path)).toEqual(['gov.irs.credits', 'gov.irs.deductions']);
  });

  test('given more children than a page holds then every page is read', async () => {
    const { client, fetchMock } = childrenClient(1);

    const children = await fetchParameterChildren(
      'us',
      TEST_POLICYENGINE_VERSION,
      'gov.irs',
      client
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(children).toHaveLength(2);
  });
});
