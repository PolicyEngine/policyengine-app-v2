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
});
