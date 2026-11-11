import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, userEvent } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  addDraftProvision,
  clearDraftReform,
  setDraftLabel,
  startDraftReform,
} from '@/libs/draftReform';
import BuildPage from '@/pages/flagship/Build.page';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import {
  JOINT_PATH,
  seedDeductionMetadata,
  SINGLE_PATH,
} from '@/tests/fixtures/components/flagship/draftEditorFixtures';
import { seedMetadataError } from '@/tests/fixtures/hooks/useFlagshipMetadataStatusMocks';

const mockFetchMetadata = vi.fn();

vi.mock('@/api/metadata', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/metadata')>()),
  fetchMetadata: (...args: unknown[]) => mockFetchMetadata(...args),
}));

const CTC = {
  path: 'gov.irs.credits.ctc.amount.base',
  breadcrumb: 'IRS → Credits → Child tax credit → Base amount',
  unit: 'currency-USD',
  baselineValue: 2000,
  value: 2000,
};

const PERSONAL_ALLOWANCE = {
  path: 'gov.hmrc.income_tax.allowances.personal_allowance.amount',
  breadcrumb: 'HMRC → Income tax → Personal allowance',
  unit: 'currency-GBP',
  baselineValue: 12570,
  value: 12570,
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BuildPage />
    </QueryClientProvider>
  );
}

describe('BuildPage', () => {
  beforeEach(() => {
    // Every country's draft, the ones set aside too.
    localStorage.clear();
    clearDraftReform();
    mockFetchMetadata.mockReset();
    // A retried fetch stays in flight: the page shows its loading state.
    mockFetchMetadata.mockReturnValue(new Promise(() => {}));
  });

  afterEach(() => {
    store.dispatch(clearMetadata());
  });

  test('given no draft then the page is one question: what to add', () => {
    // Given / When — the store starts empty, as it does on a cold load
    renderPage();

    // Then
    expect(screen.getByRole('heading', { name: 'Build a reform' })).toBeInTheDocument();
    expect(screen.getAllByRole('status', { name: 'Loading parameters' })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Rename the reform' })).not.toBeInTheDocument();
  });

  test('given a draft then the reform is the page: its header, its table, and the add row at its foot', () => {
    // Given
    seedDeductionMetadata();
    startDraftReform('us', 'manual');
    addDraftProvision('us', CTC);

    // When
    renderPage();

    // Then
    expect(screen.getByRole('button', { name: 'Rename the reform' })).toBeInTheDocument();
    const row = screen.getByRole('button', { name: /open base amount/i });
    expect(screen.queryByRole('heading', { name: 'Build a reform' })).not.toBeInTheDocument();
    // One search, after the parameters, asking for another.
    const search = screen.getByRole('combobox', { name: 'Search parameters' });
    expect(search).toHaveAttribute('placeholder', expect.stringMatching(/^Add another parameter/));
    expect(row.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("given a draft set aside for another country's then this country's page brings it back", () => {
    // Given — a US draft, then a UK one started on the UK page
    addDraftProvision('us', CTC);
    setDraftLabel('US plan');
    addDraftProvision('uk', PERSONAL_ALLOWANCE);

    // When
    renderPage();

    // Then
    expect(screen.getByRole('button', { name: 'Rename the reform' })).toHaveTextContent('US plan');
  });

  test('given a draft before metadata loads then one loader stands for the bar and the table', () => {
    // Given — a reload: the draft is stored, metadata is not here yet
    startDraftReform('us', 'manual');
    addDraftProvision('us', CTC);

    // When
    renderPage();

    // Then
    expect(screen.getByRole('button', { name: 'Rename the reform' })).toBeInTheDocument();
    const loading = screen.getAllByRole('status', { name: 'Loading parameters' });
    expect(loading).toHaveLength(1);
    // The placeholder is the table's shape, so the table takes its place without a jump.
    expect(loading[0]).toHaveTextContent('New value');
    expect(screen.queryByRole('button', { name: /open base amount/i })).not.toBeInTheDocument();
  });

  test('given breakdown members before metadata loads then the placeholder has the table rows', () => {
    // Given — two filing statuses of one deduction share a row in the table
    startDraftReform('us', 'manual');
    addDraftProvision('us', CTC);
    for (const path of [SINGLE_PATH, JOINT_PATH]) {
      addDraftProvision('us', { ...CTC, path, breadcrumb: 'IRS → Deductions → Standard' });
    }
    renderPage();
    const placeholder = screen.getByRole('status', { name: 'Loading parameters' });
    // The header, a row per table row, and the add bar at the foot.
    const placeholderRows = placeholder.firstElementChild!.children.length - 2;

    // When
    act(() => seedDeductionMetadata());

    // Then
    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(placeholderRows);
    expect(placeholderRows).toBe(2);
  });

  test('given metadata failed then the page says so instead of loading for good', () => {
    // Given
    seedMetadataError();

    // When
    renderPage();

    // Then
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the parameters');
    expect(screen.queryByRole('status', { name: 'Loading parameters' })).not.toBeInTheDocument();
  });

  test('given metadata failed then try again asks for it again', async () => {
    // Given
    const user = userEvent.setup();
    seedMetadataError();
    renderPage();

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(mockFetchMetadata).toHaveBeenCalledWith('us');
    expect(await screen.findByRole('status', { name: 'Loading parameters' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('given a draft and metadata failed then the error stands in for the table', () => {
    // Given
    startDraftReform('us', 'manual');
    addDraftProvision('us', CTC);
    seedMetadataError();

    // When
    renderPage();

    // Then
    expect(screen.getByRole('button', { name: 'Rename the reform' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the parameters');
  });
});
