import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { addDraftProvision, clearDraftReform, startDraftReform } from '@/libs/draftReform';
import BuildPage from '@/pages/flagship/Build.page';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { seedDeductionMetadata } from '@/tests/fixtures/components/flagship/draftEditorFixtures';

const CTC = {
  path: 'gov.irs.credits.ctc.amount.base',
  breadcrumb: 'IRS → Credits → Child tax credit → Base amount',
  unit: 'currency-USD',
  baselineValue: 2000,
  value: 2000,
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
    clearDraftReform();
  });

  afterEach(() => {
    store.dispatch(clearMetadata());
  });

  test('given no draft then the page is one question: what to add', () => {
    // Given / When — the store starts empty, as it does on a cold load
    renderPage();

    // Then
    expect(screen.getByRole('heading', { name: 'Build a reform' })).toBeInTheDocument();
    expect(screen.getAllByText('Loading parameters…')).toHaveLength(1);
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

  test('given a draft before metadata loads then one loader stands for the bar and the table', () => {
    // Given — a reload: the draft is stored, metadata is not here yet
    startDraftReform('us', 'manual');
    addDraftProvision('us', CTC);

    // When
    renderPage();

    // Then
    expect(screen.getByRole('button', { name: 'Rename the reform' })).toBeInTheDocument();
    expect(screen.getAllByText('Loading parameters…')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /open base amount/i })).not.toBeInTheDocument();
  });
});
