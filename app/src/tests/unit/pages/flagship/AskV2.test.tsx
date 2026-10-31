import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor, within } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { AskChatHandlers } from '@/api/askChat';
import { clearDraftReform, getDraftReform } from '@/libs/draftReform';
import AskPage from '@/pages/flagship/Ask.page';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { catalogParametersResult } from '@/tests/fixtures/api/publicApi/catalogParametersMocks';
import {
  jsonResponse,
  requestsTo,
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

const mockStreamAskChatTurn = vi.fn();
vi.mock('@/api/askChat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/askChat')>();
  return {
    ...actual,
    streamAskChatTurn: (...args: Parameters<typeof actual.streamAskChatTurn>) =>
      mockStreamAskChatTurn(...args),
  };
});

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

function failParameters() {
  return jsonResponse({ status: 'error', message: 'Unavailable' }, 503);
}

/** The search file answers; the parameters fail as many times as given, then answer. */
async function stubParametersFailing(failures: number) {
  let attempts = 0;
  const fetchStub = stubPublicApiFetch({
    [SEARCH_FILE_PATH]: () => jsonResponse(US_SEARCH_FILE),
    [PARAMETERS_PATH]: (url) => {
      attempts += 1;
      return attempts <= failures ? failParameters() : answerParameters(url);
    },
  });
  await seedV2ModelCatalog();
  return fetchStub;
}

async function renderAskWithSearchFile() {
  renderAsk();
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
}

function singleMatch() {
  return screen.getByRole('button', { name: /single/i });
}

describe('AskPage with v3 on the v2 routes', () => {
  beforeEach(() => {
    clearDraftReform();
  });

  afterEach(() => {
    store.dispatch(clearMetadata());
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
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

  test('given matches then each waits for its current law, then shows it', async () => {
    // Given
    let releaseParameters: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      releaseParameters = resolve;
    });
    stubPublicApiFetch({
      [SEARCH_FILE_PATH]: () => jsonResponse(US_SEARCH_FILE),
      [PARAMETERS_PATH]: async (url) => {
        await held;
        return answerParameters(url);
      },
    });
    await seedV2ModelCatalog();
    const user = userEvent.setup();
    await renderAskWithSearchFile();

    // When
    await ask(user, 'standard deduction');

    // Then
    expect(await within(singleMatch()).findByText('current: loading…')).toBeInTheDocument();
    releaseParameters();
    expect(await within(singleMatch()).findByText('current: $15,000')).toBeInTheDocument();
  });

  test('given matches whose current law fails to load then the page says so and try again loads it', async () => {
    // Given
    const fetchStub = await stubParametersFailing(1);
    const user = userEvent.setup();
    await renderAskWithSearchFile();
    await ask(user, 'standard deduction');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load current law for these matches'
    );
    expect(within(singleMatch()).getByText('current: could not load')).toBeInTheDocument();

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(await within(singleMatch()).findByText('current: $15,000')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(requestsTo(fetchStub, PARAMETERS_PATH)).toHaveLength(2);
  });

  test('given a picked match whose current law fails to load then it stays out of the draft and the page says so', async () => {
    // Given
    await stubParametersFailing(Infinity);
    const user = userEvent.setup();
    await renderAskWithSearchFile();
    await ask(user, 'standard deduction');

    // When
    await user.click(singleMatch());

    // Then
    expect(
      await screen.findByText('Could not load that parameter. Try picking it again.')
    ).toBeInTheDocument();
    expect(getDraftReform()?.provisions ?? []).toHaveLength(0);
  });

  test("given the chat's reform whose current law fails to load then no draft step shows and try again brings it", async () => {
    // Given
    vi.stubEnv('NEXT_PUBLIC_US_ASK', 'on');
    mockStreamAskChatTurn.mockImplementation(async (_request, handlers: AskChatHandlers) => {
      handlers.onToolUse?.({
        toolName: 'run_society_simulation',
        toolId: 't1',
        toolInput: { reform: { [STANDARD_DEDUCTION_SINGLE]: 20000 }, year: 2026 },
      });
      handlers.onDone?.({ content: 'Done.', sessionId: 's1' });
    });
    await stubParametersFailing(1);
    const user = userEvent.setup();
    await renderAskWithSearchFile();

    // When
    await ask(user, 'Raise the standard deduction for single filers to $20,000');

    // Then
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load current law for this reform'
    );
    expect(screen.queryByRole('button', { name: /add to draft/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('button', { name: /add to draft/i })).toBeInTheDocument();
    expect(screen.getByText(/\$15,000 → \$20,000/)).toBeInTheDocument();
  });

  test('given the search file fails to load then the page says so and try again loads it', async () => {
    // Given
    let attempts = 0;
    const fetchStub = stubPublicApiFetch({
      [SEARCH_FILE_PATH]: () => {
        attempts += 1;
        return attempts === 1 ? failParameters() : jsonResponse(US_SEARCH_FILE);
      },
    });
    await seedV2ModelCatalog();
    const user = userEvent.setup();
    renderAsk();
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the parameters');

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(requestsTo(fetchStub, SEARCH_FILE_PATH)).toHaveLength(2);
  });

  test("given a new question while the chat's reform loads then the reform's draft step joins its own answer", async () => {
    // Given: the first answer's reform waits for its parameters.
    vi.stubEnv('NEXT_PUBLIC_US_ASK', 'on');
    mockStreamAskChatTurn
      .mockImplementationOnce(async (_request, handlers: AskChatHandlers) => {
        handlers.onToolUse?.({
          toolName: 'run_society_simulation',
          toolId: 't1',
          toolInput: { reform: { [STANDARD_DEDUCTION_SINGLE]: 20000 }, year: 2026 },
        });
        handlers.onDone?.({ content: 'First answer.', sessionId: 's1' });
      })
      .mockImplementationOnce(async (_request, handlers: AskChatHandlers) => {
        handlers.onDone?.({ content: 'Second answer.', sessionId: 's1' });
      });
    let releaseParameters: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      releaseParameters = resolve;
    });
    stubPublicApiFetch({
      [SEARCH_FILE_PATH]: () => jsonResponse(US_SEARCH_FILE),
      [PARAMETERS_PATH]: async (url) => {
        await held;
        return answerParameters(url);
      },
    });
    await seedV2ModelCatalog();
    const user = userEvent.setup();
    await renderAskWithSearchFile();
    await ask(user, 'Raise the standard deduction for single filers to $20,000');
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Loading current law for this reform'
    );

    // When
    await ask(user, 'What else could I change?');
    await screen.findByText('Second answer.');
    releaseParameters();

    // Then: the first turn's step is in, and nothing is left loading.
    expect(await screen.findByRole('button', { name: /add to draft/i })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    const [firstAnswer, secondAnswer] = [
      screen.getByText('First answer.'),
      screen.getByText('Second answer.'),
    ];
    const step = screen.getByText('Reform validated by the model');
    // In document order: first answer, its step, then the second answer.
    expect(
      firstAnswer.compareDocumentPosition(step) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      step.compareDocumentPosition(secondAnswer) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
