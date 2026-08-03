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

describe('AskPage', () => {
  beforeEach(() => {
    clearDraftReform();
  });

  test('given an empty input then examples show and no suggestions render', () => {
    renderAsk();

    expect(screen.getByText(/try asking/i)).toBeInTheDocument();
    expect(screen.queryByText(/matching parameters/i)).not.toBeInTheDocument();
  });

  test('given typing then matching parameters appear live, without a submit step', async () => {
    const user = userEvent.setup();
    renderAsk();

    await user.type(
      screen.getByRole('textbox', { name: /policy question/i }),
      'child tax credit amount'
    );

    expect(await screen.findByText(/matching parameters/i)).toBeInTheDocument();
    expect(screen.getByText('IRS → Credits → Child tax credit → Amount')).toBeInTheDocument();
  });

  test('given a suggestion is clicked then it joins the draft with the value from the question', async () => {
    const user = userEvent.setup();
    renderAsk();

    await user.type(
      screen.getByRole('textbox', { name: /policy question/i }),
      'raise the child tax credit to $3,600'
    );
    await user.click(await screen.findByText('IRS → Credits → Child tax credit → Amount'));

    const draft = getDraftReform();
    expect(draft?.provisions[0].path).toBe('gov.irs.credits.ctc.amount');
    expect(draft?.provisions[0].value).toBe(3600);
    expect(draft?.source).toBe('chat');
    expect(await screen.findByText(/here's your draft reform/i)).toBeInTheDocument();
  });

  test('given a question without an amount then no value is invented', async () => {
    const user = userEvent.setup();
    renderAsk();

    await user.type(screen.getByRole('textbox', { name: /policy question/i }), 'child tax credit');
    await user.click(await screen.findByText('IRS → Credits → Child tax credit → Amount'));

    const provision = getDraftReform()?.provisions[0];
    expect(provision?.value).toBe(provision?.baselineValue);
  });

  test('given a query with no matches then an honest empty state shows', async () => {
    const user = userEvent.setup();
    renderAsk();

    await user.type(
      screen.getByRole('textbox', { name: /policy question/i }),
      'zzzz quantum entanglement subsidy'
    );

    expect(await screen.findByText(/no parameters matched/i)).toBeInTheDocument();
  });
});
