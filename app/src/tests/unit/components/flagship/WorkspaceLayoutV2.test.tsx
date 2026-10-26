import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import WorkspaceLayout from '@/components/flagship/WorkspaceLayout';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { TEST_POLICYENGINE_VERSION } from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import {
  jsonResponse,
  requestsTo,
  stubPublicApiFetch,
} from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import { US_SEARCH_FILE } from '@/tests/fixtures/api/publicApi/searchFileMocks';
import { seedV2ModelCatalog, testQueryClient } from '@/tests/fixtures/hooks/v3MetadataWrapper';

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

const SEARCH_FILE_PATH = '/v2/parameters/search-file';

describe('WorkspaceLayout with v3 on the v2 routes', () => {
  let fetchStub: ReturnType<typeof stubPublicApiFetch>;

  beforeEach(async () => {
    fetchStub = stubPublicApiFetch({ [SEARCH_FILE_PATH]: () => jsonResponse(US_SEARCH_FILE) });
    await seedV2ModelCatalog();
  });

  afterEach(() => {
    store.dispatch(clearMetadata());
    vi.unstubAllGlobals();
  });

  test('given a page renders then the search file downloads behind it, for the catalog version', async () => {
    // When
    render(
      <QueryClientProvider client={testQueryClient()}>
        <WorkspaceLayout>
          <p>Page content</p>
        </WorkspaceLayout>
      </QueryClientProvider>
    );

    // Then
    expect(screen.getByText('Page content')).toBeInTheDocument();
    await waitFor(() => expect(requestsTo(fetchStub, SEARCH_FILE_PATH)).toHaveLength(1));
    expect(
      requestsTo(fetchStub, SEARCH_FILE_PATH)[0].searchParams.get('policyengine_version')
    ).toBe(TEST_POLICYENGINE_VERSION);
  });
});
