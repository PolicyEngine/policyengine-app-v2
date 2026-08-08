import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { clearDraftReform, getDraftReform } from '@/libs/draftReform';
import { buildParameterSearchEntries, createParameterSearchIndex } from '@/libs/parameterSearch';
import AskPage from '@/pages/flagship/Ask.page';

const FIXTURE_COLLECTION = {
  'gov.irs': { type: 'parameterNode', parameter: 'gov.irs', label: 'IRS' },
  'gov.irs.credits': { type: 'parameterNode', parameter: 'gov.irs.credits', label: 'credits' },
  'gov.irs.credits.ctc': {
    type: 'parameterNode',
    parameter: 'gov.irs.credits.ctc',
    label: 'child tax credit',
  },
  'gov.irs.credits.ctc.amount': {
    type: 'parameter',
    parameter: 'gov.irs.credits.ctc.amount',
    label: 'amount',
    unit: 'currency-USD',
    economy: true,
    household: true,
    values: { '2020-01-01': 2000 },
  },
} as any;

const fixtureIndex = createParameterSearchIndex(buildParameterSearchEntries(FIXTURE_COLLECTION));

vi.mock('@/libs/parameterSearch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/libs/parameterSearch')>();
  return {
    ...actual,
    selectParameterSearchIndex: () => fixtureIndex,
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ countryId: 'us' }),
  };
});

function renderAsk() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AskPage />
    </QueryClientProvider>
  );
}

async function ask(user: ReturnType<typeof userEvent.setup>, question: string) {
  await user.type(screen.getByRole('textbox', { name: /policy question/i }), question);
  await user.click(screen.getByRole('button', { name: /send/i }));
}

describe('AskPage', () => {
  beforeEach(() => {
    clearDraftReform();
  });

  test('given no conversation then the centered prompt and example chips show', () => {
    renderAsk();

    expect(screen.getByText(/what do you want to change/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Raise the child tax credit to $3,600' })
    ).toBeInTheDocument();
  });

  test('given a question is sent then it renders as a bubble with matches as the reply', async () => {
    const user = userEvent.setup();
    renderAsk();

    await ask(user, 'child tax credit amount');

    expect(screen.getByText('child tax credit amount')).toBeInTheDocument();
    expect(screen.getByText(/here's what matched/i)).toBeInTheDocument();
    expect(screen.getByText('IRS → Credits → Child tax credit → Amount')).toBeInTheDocument();
  });

  test('given a match is clicked then it joins the draft with the value from that question', async () => {
    const user = userEvent.setup();
    renderAsk();

    await ask(user, 'raise the child tax credit to $3,600');
    await user.click(screen.getByText('IRS → Credits → Child tax credit → Amount'));

    const draft = getDraftReform();
    expect(draft?.provisions[0].path).toBe('gov.irs.credits.ctc.amount');
    expect(draft?.provisions[0].value).toBe(3600);
    expect(draft?.source).toBe('chat');
  });

  test('given a question without an amount then no value is invented', async () => {
    const user = userEvent.setup();
    renderAsk();

    await ask(user, 'child tax credit');
    await user.click(screen.getByText('IRS → Credits → Child tax credit → Amount'));

    const provision = getDraftReform()?.provisions[0];
    expect(provision?.value).toBe(provision?.baselineValue);
  });

  test('given a question with no matches then an honest empty reply shows', async () => {
    const user = userEvent.setup();
    renderAsk();

    await ask(user, 'zzzz quantum entanglement subsidy');

    expect(screen.getByText(/no parameters matched/i)).toBeInTheDocument();
  });

  test('given an example chip is clicked then it sends as a question immediately', async () => {
    const user = userEvent.setup();
    renderAsk();

    await user.click(screen.getByRole('button', { name: 'Raise the child tax credit to $3,600' }));

    expect(screen.getByText('Raise the child tax credit to $3,600')).toBeInTheDocument();
    expect(screen.getByText(/here's what matched/i)).toBeInTheDocument();
  });

  test('given several questions then earlier turns stay in the transcript', async () => {
    const user = userEvent.setup();
    renderAsk();

    await ask(user, 'child tax credit');
    await ask(user, 'zzzz nothing here');

    expect(screen.getByText('child tax credit')).toBeInTheDocument();
    expect(screen.getByText('zzzz nothing here')).toBeInTheDocument();
    expect(screen.getByText(/no parameters matched/i)).toBeInTheDocument();
  });
});
