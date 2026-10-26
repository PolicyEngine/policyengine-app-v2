import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { clearDraftReform, getDraftReform } from '@/libs/draftReform';
import AskPage from '@/pages/flagship/Ask.page';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { catalogParametersResult } from '@/tests/fixtures/api/publicApi/catalogParametersMocks';
import {
  jsonResponse,
  stubPublicApiFetch,
} from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import {
  STANDARD_DEDUCTION_JOINT,
  STANDARD_DEDUCTION_SINGLE,
  US_SEARCH_FILE,
} from '@/tests/fixtures/api/publicApi/searchFileMocks';
import { seedV2ModelCatalog, testQueryClient } from '@/tests/fixtures/hooks/v3MetadataWrapper';

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: () => ({ countryId: 'us' }),
}));

const SEARCH_FILE_PATH = '/v2/parameters/search-file';
const PARAMETERS_PATH = '/v2/model-catalog/parameters';

function renderAsk() {
  return render(
    <QueryClientProvider client={testQueryClient()}>
      <AskPage />
    </QueryClientProvider>
  );
}

async function ask(user: ReturnType<typeof userEvent.setup>, question: string) {
  await user.type(screen.getByRole('textbox', { name: /policy question/i }), question);
  await user.click(screen.getByRole('button', { name: /send/i }));
}

function answerParameters(url: URL) {
  return jsonResponse({
    status: 'ok',
    message: null,
    result: catalogParametersResult(url.searchParams.getAll('name')),
  });
}

describe('AskPage with v3 on the v2 routes', () => {
  beforeEach(() => {
    clearDraftReform();
  });

  afterEach(() => {
    store.dispatch(clearMetadata());
    vi.unstubAllGlobals();
  });

  test('given the search file is still loading then the page says so and a question waits', async () => {
    // Given
    stubPublicApiFetch({ [SEARCH_FILE_PATH]: () => new Promise<Response>(() => {}) });
    await seedV2ModelCatalog();
    const user = userEvent.setup();
    renderAsk();

    // When
    await ask(user, 'standard deduction');

    // Then
    expect(screen.getByRole('status')).toHaveTextContent('Loading the parameters to match against');
    expect(screen.queryByText(/here's what matched/i)).not.toBeInTheDocument();
  });

  test('given the search file then matches come from it and a picked one joins at current law', async () => {
    // Given
    stubPublicApiFetch({
      [SEARCH_FILE_PATH]: () => jsonResponse(US_SEARCH_FILE),
      [PARAMETERS_PATH]: answerParameters,
    });
    await seedV2ModelCatalog();
    const user = userEvent.setup();
    renderAsk();
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    // When
    await ask(user, 'standard deduction');
    expect(screen.getByText(/here's what matched/i)).toBeInTheDocument();
    const match = await screen.findByRole('button', { name: /single/i });
    await user.click(match);

    // Then
    await waitFor(() => expect(getDraftReform()?.provisions).toHaveLength(1));
    const provision = getDraftReform()!.provisions[0];
    expect([STANDARD_DEDUCTION_SINGLE, STANDARD_DEDUCTION_JOINT]).toContain(provision.path);
    expect(provision.baselineValue).toBe(15000);
  });
});
