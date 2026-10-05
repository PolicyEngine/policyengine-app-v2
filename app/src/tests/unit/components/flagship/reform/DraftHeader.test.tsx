import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import DraftHeader from '@/components/flagship/reform/DraftHeader';
import {
  addDraftProvision,
  clearDraftReform,
  getDraftReform,
  startDraftReform,
  useDraftReform,
} from '@/libs/draftReform';

const mockCreate = vi.fn();

vi.mock('@/api/reformStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/reformStore')>();
  return { ...actual, getReformStore: () => ({ create: mockCreate, update: vi.fn() }) };
});

function HeaderHarness() {
  const draft = useDraftReform();
  return draft ? <DraftHeader draft={draft} /> : null;
}

function renderHeader() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <HeaderHarness />
    </QueryClientProvider>
  );
}

describe('DraftHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearDraftReform();
    startDraftReform('us', 'chat', 'ask-keyword-v0');
    addDraftProvision('us', {
      path: 'gov.irs.credits.ctc.amount.base',
      breadcrumb: 'IRS → Credits → Child tax credit → Base amount',
      unit: 'currency-USD',
      baselineValue: 2000,
      value: 2000,
    });
  });

  test('given a draft then its name and run read at the top', () => {
    renderHeader();

    expect(screen.getByLabelText('Reform name')).toHaveAttribute('placeholder', 'Untitled reform');
    expect(screen.getByRole('button', { name: /run 2026 report/i })).toBeEnabled();
  });

  test('given the name is typed then the draft takes it', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.type(screen.getByLabelText('Reform name'), 'CTC expansion');

    expect(getDraftReform()?.label).toBe('CTC expansion');
  });

  test('given save then the reform is created with its provenance and the draft clears', async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValue({ id: 'rf-1' });
    renderHeader();

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
    expect(mockCreate.mock.calls[0][0].provenance).toEqual({
      source: 'chat',
      ref: 'ask-keyword-v0',
    });
    await waitFor(() => expect(getDraftReform()).toBeNull());
  });

  test('given discard then the draft clears without saving', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: 'Discard' }));

    expect(getDraftReform()).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
