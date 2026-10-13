import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import DraftHeader from '@/components/flagship/reform/DraftHeader';
import {
  addDraftProvision,
  clearDraftReform,
  getDraftReform,
  startDraftReform,
  useDraftReform,
} from '@/libs/draftReform';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import {
  seedDeductionMetadata,
  US_REGIONS,
} from '@/tests/fixtures/components/flagship/draftEditorFixtures';

const mockCreate = vi.fn();
const mockRun = vi.fn();

vi.mock('@/hooks/useRunFlagshipReport', () => ({
  useRunFlagshipReport: () => ({ run: mockRun, isRunning: false, error: null }),
}));

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

  afterEach(() => {
    store.dispatch(clearMetadata());
  });

  test('given a draft then its name and run read at the top', () => {
    renderHeader();

    expect(screen.getByLabelText('Reform name')).toHaveAttribute('placeholder', 'Untitled reform');
    expect(screen.getByRole('button', { name: /run 2026 report/i })).toBeInTheDocument();
  });

  test('given nothing changed yet then the run waits for a change', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: /run 2026 report/i })).toBeDisabled();
    expect(screen.getByText(/adjust at least one value to run the report/i)).toBeInTheDocument();
  });

  test('given some parameters left unchanged then the run leaves them out', async () => {
    const user = userEvent.setup();
    addDraftProvision('us', {
      path: 'gov.irs.credits.eitc.max',
      breadcrumb: 'IRS → Credits → EITC → Maximum',
      unit: 'currency-USD',
      baselineValue: 600,
      value: 900,
    });
    renderHeader();

    // The run leaves the unchanged one out without saying so.
    expect(screen.queryByText(/left out of the report/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /run 2026 report/i }));

    const provisions = mockRun.mock.calls[0][2];
    expect(provisions.map((provision: { path: string }) => provision.path)).toEqual([
      'gov.irs.credits.eitc.max',
    ]);
    // The draft keeps the unchanged one, to change later.
    expect(getDraftReform()?.provisions).toHaveLength(2);
  });

  test('given a year is chosen then the draft and its run take it', async () => {
    // Radix Select scrolls its options and captures the pointer, which jsdom lacks.
    Element.prototype.scrollIntoView ??= vi.fn();
    Element.prototype.hasPointerCapture ??= vi.fn(() => false);
    seedDeductionMetadata();
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('combobox', { name: 'Year' }));
    await user.click(await screen.findByRole('option', { name: '2027' }));

    expect(getDraftReform()?.year).toBe(2027);
    expect(screen.getByRole('button', { name: /run 2027 report/i })).toBeInTheDocument();
  });

  test('given the population picker then a household shows, but waits', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: 'Population: Nationwide' }));

    expect(await screen.findByRole('option', { name: /a household/i })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  test('given a state is chosen then the draft and its run take it', async () => {
    const user = userEvent.setup();
    seedDeductionMetadata({ regions: US_REGIONS });
    addDraftProvision('us', {
      path: 'gov.irs.credits.eitc.max',
      breadcrumb: 'IRS → Credits → EITC → Maximum',
      unit: 'currency-USD',
      baselineValue: 600,
      value: 900,
    });
    renderHeader();

    await user.click(screen.getByRole('button', { name: 'Population: Nationwide' }));
    await user.click(await screen.findByRole('option', { name: /California/ }));

    expect(getDraftReform()?.population).toEqual({ scope: 'national', region: 'state/ca' });
    expect(screen.getByRole('button', { name: 'Population: California' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /run 2026 report/i }));
    expect(mockRun.mock.calls[0][5]).toEqual({ fromDraft: true, region: 'state/ca' });
  });

  test('given a search then congressional districts join the list', async () => {
    const user = userEvent.setup();
    seedDeductionMetadata({ regions: US_REGIONS });
    renderHeader();

    await user.click(screen.getByRole('button', { name: 'Population: Nationwide' }));
    // 436 districts would swamp the list; none show until something is typed.
    expect(screen.queryByRole('option', { name: /California's 1st/ })).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Find a state or district…'), 'CA-01');
    await user.click(await screen.findByRole('option', { name: /California's 1st/ }));

    expect(getDraftReform()?.population?.region).toBe('congressional_district/CA-01');
    expect(
      screen.getByRole('button', { name: "Population: California's 1st" })
    ).toBeInTheDocument();
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
