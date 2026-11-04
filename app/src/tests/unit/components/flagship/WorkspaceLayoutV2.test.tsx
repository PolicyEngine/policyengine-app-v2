import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import WorkspaceLayout from '@/components/flagship/WorkspaceLayout';
import { clearMetadata, fetchMetadataThunk, metadataRequest } from '@/reducers/metadataReducer';
import { store } from '@/store';
import {
  catalogVariablesEnvelope,
  VARIABLES_PATH,
} from '@/tests/fixtures/api/publicApi/catalogVariablesMocks';
import {
  modelCatalogEnvelope,
  TEST_POLICYENGINE_VERSION,
} from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
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
    fetchStub = stubPublicApiFetch({
      [SEARCH_FILE_PATH]: () => jsonResponse(US_SEARCH_FILE),
      [VARIABLES_PATH]: () => jsonResponse(catalogVariablesEnvelope()),
    });
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

  test('given a page renders then the catalog version variables load behind it, once', async () => {
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
    await waitFor(() => expect(requestsTo(fetchStub, VARIABLES_PATH)).toHaveLength(1));
    expect(requestsTo(fetchStub, VARIABLES_PATH)[0].searchParams.get('policyengine_version')).toBe(
      TEST_POLICYENGINE_VERSION
    );
  });
});

function renderLayout() {
  return render(
    <QueryClientProvider client={testQueryClient()}>
      <WorkspaceLayout>
        <p>Page content</p>
      </WorkspaceLayout>
    </QueryClientProvider>
  );
}

describe('WorkspaceLayout while the model catalog loads, on the v2 routes', () => {
  afterEach(() => {
    store.dispatch(clearMetadata());
    vi.unstubAllGlobals();
  });

  test('given the model catalog is loading then a short loading page stands for the page', () => {
    // Given
    stubPublicApiFetch({ '/v2/model-catalog': () => new Promise<Response>(() => {}) });
    store.dispatch(clearMetadata());
    void store.dispatch(fetchMetadataThunk(metadataRequest('us', 'v2')));

    // When
    renderLayout();

    // Then
    expect(screen.getByRole('status', { name: 'Loading the model' })).toBeInTheDocument();
    expect(screen.queryByText('Page content')).not.toBeInTheDocument();
  });

  test('given the model catalog failed then the page says so and try again asks again', async () => {
    // Given
    const user = userEvent.setup();
    let attempts = 0;
    const fetchStub = stubPublicApiFetch({
      '/v2/model-catalog': () => {
        attempts += 1;
        return attempts === 1
          ? jsonResponse({ status: 'error', message: 'Unavailable' }, 503)
          : jsonResponse(modelCatalogEnvelope());
      },
    });
    store.dispatch(clearMetadata());
    await store.dispatch(fetchMetadataThunk(metadataRequest('us', 'v2')));
    renderLayout();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the model');

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(await screen.findByText('Page content')).toBeInTheDocument();
    expect(requestsTo(fetchStub, '/v2/model-catalog')).toHaveLength(2);
  });
});
