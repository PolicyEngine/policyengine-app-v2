import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { UkChatHandlers } from '@/api/ukChat';
import { clearDraftReform, getDraftReform } from '@/libs/draftReform';
import { buildParameterSearchEntries, createParameterSearchIndex } from '@/libs/parameterSearch';
import AskPage from '@/pages/flagship/Ask.page';

const PERSONAL_ALLOWANCE_PATH = 'gov.hmrc.income_tax.allowances.personal_allowance.amount';

const FIXTURE_COLLECTION = {
  'gov.hmrc': { type: 'parameterNode', parameter: 'gov.hmrc', label: 'HMRC' },
  'gov.hmrc.income_tax': {
    type: 'parameterNode',
    parameter: 'gov.hmrc.income_tax',
    label: 'income tax',
  },
  'gov.hmrc.income_tax.allowances': {
    type: 'parameterNode',
    parameter: 'gov.hmrc.income_tax.allowances',
    label: 'allowances',
  },
  'gov.hmrc.income_tax.allowances.personal_allowance': {
    type: 'parameterNode',
    parameter: 'gov.hmrc.income_tax.allowances.personal_allowance',
    label: 'personal allowance',
  },
  [PERSONAL_ALLOWANCE_PATH]: {
    type: 'parameter',
    parameter: PERSONAL_ALLOWANCE_PATH,
    label: 'amount',
    unit: 'currency-GBP',
    economy: true,
    household: true,
    values: { '2020-01-01': 12570 },
  },
} as any;

const fixtureIndex = createParameterSearchIndex(buildParameterSearchEntries(FIXTURE_COLLECTION));

const mockStreamUkChatTurn = vi.fn();

vi.mock('@/api/ukChat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/ukChat')>();
  return {
    ...actual,
    streamUkChatTurn: (...args: Parameters<typeof actual.streamUkChatTurn>) =>
      mockStreamUkChatTurn(...args),
  };
});

vi.mock('@/libs/parameterSearch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/libs/parameterSearch')>();
  return {
    ...actual,
    selectParameterSearchIndex: () => fixtureIndex,
  };
});

function renderAsk() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AskPage />
    </QueryClientProvider>,
    'uk'
  );
}

async function ask(user: ReturnType<typeof userEvent.setup>, question: string) {
  await user.type(screen.getByRole('textbox', { name: /policy question/i }), question);
  await user.click(screen.getByRole('button', { name: /send/i }));
}

/** Resolves the mocked stream after synchronously replaying the given events. */
function streamReplying(replay: (handlers: UkChatHandlers) => void) {
  mockStreamUkChatTurn.mockImplementation(async (_request, handlers: UkChatHandlers) => {
    replay(handlers);
  });
}

describe('AskPage UK chat mode', () => {
  beforeEach(() => {
    clearDraftReform();
    mockStreamUkChatTurn.mockReset();
  });

  test('given a question then the streamed answer renders as markdown prose', async () => {
    // Given
    const user = userEvent.setup();
    streamReplying((handlers) => {
      handlers.onToolStart?.({ toolName: 'run_society_simulation', toolId: 't1' });
      handlers.onChunk?.('Raising the personal allowance costs ');
      handlers.onChunk?.('**£10 billion**.');
      handlers.onDone?.({
        content: 'Raising the personal allowance costs **£10 billion**.',
        sessionId: 's1',
      });
    });
    renderAsk();

    // When
    await ask(user, 'Raise the personal allowance to £15,000');

    // Then
    expect(screen.getByText('Raise the personal allowance to £15,000')).toBeInTheDocument();
    expect(screen.getByText('£10 billion')).toBeInTheDocument();
    expect(mockStreamUkChatTurn).toHaveBeenCalledTimes(1);
  });

  test('given the model validates a reform then add to draft stores its provisions', async () => {
    // Given
    const user = userEvent.setup();
    streamReplying((handlers) => {
      handlers.onToolUse?.({
        toolName: 'run_society_simulation',
        toolId: 't1',
        toolInput: { reform: { [PERSONAL_ALLOWANCE_PATH]: 15000 }, year: 2026 },
      });
      handlers.onChunk?.('Done.');
      handlers.onDone?.({ content: 'Done.', sessionId: 's1' });
    });
    renderAsk();
    await ask(user, 'Raise the personal allowance to £15,000');

    // When
    await user.click(screen.getByRole('button', { name: /add to draft/i }));

    // Then
    const draft = getDraftReform();
    expect(draft?.provisions[0].path).toBe(PERSONAL_ALLOWANCE_PATH);
    expect(draft?.provisions[0].value).toBe(15000);
    expect(draft?.source).toBe('chat');
    expect(screen.getByRole('button', { name: /in draft/i })).toBeDisabled();
  });

  test('given follow-up suggestions then clicking one sends another turn', async () => {
    // Given
    const user = userEvent.setup();
    streamReplying((handlers) => {
      handlers.onChunk?.('Answer.');
      handlers.onSuggestions?.(['What about poverty?']);
      handlers.onDone?.({ content: 'Answer.', sessionId: 's1' });
    });
    renderAsk();
    await ask(user, 'Raise the personal allowance to £15,000');

    // When
    await user.click(screen.getByRole('button', { name: 'What about poverty?' }));

    // Then
    expect(mockStreamUkChatTurn).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText('What about poverty?').length).toBeGreaterThan(0);
  });

  test('given the service is unreachable then the turn falls back to keyword matches', async () => {
    // Given
    const user = userEvent.setup();
    mockStreamUkChatTurn.mockRejectedValue(new Error('UK chat service responded 502'));
    renderAsk();

    // When
    await ask(user, 'personal allowance amount');

    // Then
    await waitFor(() => {
      expect(screen.getByText(/chat service is unreachable/i)).toBeInTheDocument();
    });
    expect(
      screen.getByText('HMRC → Income tax → Allowances → Personal allowance → Amount')
    ).toBeInTheDocument();
  });
});
