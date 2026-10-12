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
    expect(screen.queryByLabelText('Reform name')).not.toBeInTheDocument();
  });

  test('given a draft then the reform is the page: its header, the add bar, and its table', () => {
    // Given
    seedDeductionMetadata();
    startDraftReform('us', 'manual');
    addDraftProvision('us', CTC);

    // When
    renderPage();

    // Then
    expect(screen.getByLabelText('Reform name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open base amount/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Build a reform' })).not.toBeInTheDocument();
  });

  test('given a draft before metadata loads then one loader stands for the bar and the table', () => {
    // Given — a reload: the draft is stored, metadata is not here yet
    startDraftReform('us', 'manual');
    addDraftProvision('us', CTC);

    // When
    renderPage();

    // Then
    expect(screen.getByLabelText('Reform name')).toBeInTheDocument();
    expect(screen.getAllByText('Loading parameters…')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /open base amount/i })).not.toBeInTheDocument();
  });
});
