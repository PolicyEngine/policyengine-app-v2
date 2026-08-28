import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReformPreviewCard from '@/components/flagship/ReformPreviewCard';
import {
  addDraftProvision,
  clearDraftReform,
  getDraftReform,
  startDraftReform,
  useDraftReform,
} from '@/libs/draftReform';

const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/api/reformStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/reformStore')>();
  return {
    ...actual,
    getReformStore: () => ({ create: mockCreate, update: mockUpdate }),
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ countryId: 'us' }),
  };
});

function seedDraft() {
  startDraftReform('us', 'chat', 'ask-keyword-v0');
  addDraftProvision('us', {
    path: 'gov.irs.credits.ctc.amount.base[0].amount',
    breadcrumb: 'IRS → Credits → Child tax credit → Base amount',
    unit: 'currency-USD',
    baselineValue: 2000,
    value: 2000,
  });
}

/** Mirrors real usage: pages pass the live-subscribed draft as the prop. */
function CardHarness() {
  const draft = useDraftReform();
  return draft ? <ReformPreviewCard draft={draft} /> : null;
}

function renderCard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CardHarness />
    </QueryClientProvider>
  );
}

describe('ReformPreviewCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The panel remembers its fold in sessionStorage; a fold test must
    // not leak a closed panel into the next test.
    sessionStorage.clear();
    clearDraftReform();
    seedDraft();
  });

  test('given a draft then provisions show baseline value and breadcrumb', () => {
    renderCard();

    // Long breadcrumbs display compacted, with the full path on hover
    expect(screen.getByText('… → Credits → Child tax credit → Base amount')).toBeInTheDocument();
    expect(screen.getByTitle('IRS → Credits → Child tax credit → Base amount')).toBeInTheDocument();
    expect(screen.getByText(/\$2,000/)).toBeInTheDocument();
  });

  test('given values equal baseline then the nudge to edit shows', () => {
    renderCard();

    expect(screen.getByText(/values match current law so far/i)).toBeInTheDocument();
  });

  test('given a new value is typed then the draft updates', async () => {
    const user = userEvent.setup();
    renderCard();

    const input = screen.getByLabelText(/new value for gov\.irs/i);
    await user.clear(input);
    await user.type(input, '3600');

    expect(getDraftReform()?.provisions[0].value).toBe(3600);
  });

  test('given save is clicked then the reform is created and the draft clears', async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValue({ id: 'rf-1' });
    renderCard();

    await user.click(screen.getByRole('button', { name: /save to library/i }));

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
    expect(mockCreate.mock.calls[0][0].provenance).toEqual({
      source: 'chat',
      ref: 'ask-keyword-v0',
    });
    await waitFor(() => expect(getDraftReform()).toBeNull());
  });

  test('given the remove button then the provision leaves the draft', async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole('button', { name: /remove IRS/i }));

    expect(getDraftReform()).toBeNull();
  });

  test('given discard then the draft clears without saving', async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole('button', { name: /discard draft/i }));

    expect(getDraftReform()).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('given a draft then the overview shows one section per component', () => {
    renderCard();

    expect(screen.getByText('Reform')).toBeInTheDocument();
    expect(screen.getByText('1 provision')).toBeInTheDocument();
    expect(screen.getByText('Population')).toBeInTheDocument();
    expect(screen.getByText('Simulation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /run report/i })).toBeInTheDocument();
  });

  test('given the population section then nationwide is active and household waits on the run bridge', () => {
    renderCard();

    expect(screen.getByRole('button', { name: 'Nationwide' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'A household' })).toBeDisabled();
    expect(getDraftReform()?.population).toEqual({ scope: 'national' });
  });

  test('given the header is clicked then the draft folds to its heading and count', async () => {
    // Given
    const user = userEvent.setup();
    seedDraft();
    renderCard();

    // When
    await user.click(screen.getByRole('button', { name: /collapse new reform/i }));

    // Then — the folded spine keeps the panel's name; the controls go
    expect(screen.getByRole('button', { name: /open new reform/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /run report/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Reform name')).not.toBeInTheDocument();
  });

  test('given a folded draft then clicking again restores the controls', async () => {
    // Given
    const user = userEvent.setup();
    seedDraft();
    renderCard();
    // When
    await user.click(screen.getByRole('button', { name: /collapse new reform/i }));
    await user.click(screen.getByRole('button', { name: /open new reform/i }));

    // Then
    expect(screen.getByRole('button', { name: /run report/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Reform name')).toBeInTheDocument();
  });

  test('given the default view then the draft is open', () => {
    // Given / When
    seedDraft();
    renderCard();

    // Then — an unseen draft is what this panel exists to prevent
    expect(screen.getByRole('button', { name: /collapse new reform/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  test('given the draft is named then the panel header carries that name', async () => {
    // Given
    const user = userEvent.setup();
    seedDraft();
    renderCard();

    // When
    await user.type(screen.getByLabelText('Reform name'), 'CTC expansion 2026');

    // Then — the title is the reform's identity, like a document title
    expect(
      screen.getByRole('button', { name: /collapse ctc expansion 2026/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });
});
