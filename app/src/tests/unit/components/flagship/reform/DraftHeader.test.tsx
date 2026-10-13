import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ReformNotFoundError } from '@/api/reformStore';
import { BrowserOnlyIdError } from '@/api/v2Associations';
import { V2ApiError } from '@/api/v2UserClient';
import DraftHeader from '@/components/flagship/reform/DraftHeader';
import {
  addDraftProvision,
  clearDraftReform,
  getDraftReform,
  loadReformIntoDraft,
  startDraftReform,
  useDraftReform,
} from '@/libs/draftReform';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { seedDeductionMetadata } from '@/tests/fixtures/components/flagship/draftEditorFixtures';

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockRun = vi.fn();

vi.mock('@/hooks/useRunFlagshipReport', () => ({
  useRunFlagshipReport: () => ({ run: mockRun, isRunning: false, error: null }),
}));

vi.mock('@/api/reformStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/reformStore')>();
  return { ...actual, getReformStore: () => ({ create: mockCreate, update: mockUpdate }) };
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
    expect(screen.getByRole('button', { name: 'Save and run 2026 report' })).toBeInTheDocument();
  });

  test('given nothing changed yet then the run waits for a change', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: /run 2026 report/i })).toBeDisabled();
    expect(screen.getByText(/change a value to run the report/i)).toBeInTheDocument();
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
    mockCreate.mockResolvedValue({ id: 'rf-1' });
    renderHeader();

    // The run leaves the unchanged one out without saying so.
    expect(screen.queryByText(/left out of the report/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /run 2026 report/i }));

    await waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));
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

  test('given a household population then it shows, but waits', async () => {
    Element.prototype.scrollIntoView ??= vi.fn();
    Element.prototype.hasPointerCapture ??= vi.fn(() => false);
    const user = userEvent.setup();
    renderHeader();

    expect(screen.getByRole('combobox', { name: 'Population' })).toHaveTextContent('Nationwide');
    await user.click(screen.getByRole('combobox', { name: 'Population' }));

    expect(await screen.findByRole('option', { name: /a household/i })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
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

  test.each([
    ['saved in the other sign-in state', () => new BrowserOnlyIdError()],
    ['deleted from this browser', () => new ReformNotFoundError()],
    ['deleted from the account', () => new V2ApiError(404, 'Reform not found.')],
  ])(
    'given the reform the draft edits was %s then saving saves it as a new reform',
    async (_, missingError) => {
      // Given
      const user = userEvent.setup();
      mockUpdate.mockRejectedValue(missingError());
      mockCreate.mockResolvedValue({ id: 'rf-new' });
      loadReformIntoDraft(
        {
          id: 'rf-gone',
          userId: 'anonymous',
          countryId: 'us',
          label: 'Saved elsewhere',
          parameters: [
            {
              name: 'gov.irs.credits.ctc.amount.base',
              values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 2500 }],
            },
          ],
          baseline: 'current-law',
          provenance: { source: 'manual' },
        },
        () => ({ breadcrumb: 'CTC', unit: 'currency-USD', baselineValue: 2000 })
      );
      renderHeader();

      // When
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      // Then
      await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
      expect(mockUpdate).toHaveBeenCalledWith('rf-gone', expect.anything());
      expect(mockCreate.mock.calls[0][0]).toMatchObject({ label: 'Saved elsewhere' });
      await waitFor(() => expect(getDraftReform()).toBeNull());
    }
  );

  test('given another failure then saving reports it and keeps the draft', async () => {
    // Given
    const user = userEvent.setup();
    mockUpdate.mockRejectedValue(new V2ApiError(503, 'Saved work is temporarily unavailable.'));
    loadReformIntoDraft(
      {
        id: 'rf-saved',
        userId: 'anonymous',
        countryId: 'us',
        label: 'Saved',
        parameters: [
          {
            name: 'gov.irs.credits.ctc.amount.base',
            values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 2500 }],
          },
        ],
        baseline: 'current-law',
        provenance: { source: 'manual' },
      },
      () => ({ breadcrumb: 'CTC', unit: 'currency-USD', baselineValue: 2000 })
    );
    renderHeader();

    // When
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    // Then
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not save the reform. Try again.'
    );
    expect(mockCreate).not.toHaveBeenCalled();
    expect(getDraftReform()?.editingReformId).toBe('rf-saved');
  });

  test('given a save is pending then save and run waits, so the reform is not saved twice', async () => {
    // Given
    const user = userEvent.setup();
    addDraftProvision('us', {
      path: 'gov.irs.credits.eitc.max',
      breadcrumb: 'IRS → Credits → EITC → Maximum',
      unit: 'currency-USD',
      baselineValue: 600,
      value: 900,
    });
    mockCreate.mockReturnValue(new Promise(() => {}));
    renderHeader();

    // When
    await user.click(screen.getByRole('button', { name: 'Save' }));

    // Then
    expect(screen.getByRole('button', { name: 'Save and run 2026 report' })).toBeDisabled();
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test('given save and run then the reform is saved first and the report is linked to it', async () => {
    // Given
    const user = userEvent.setup();
    addDraftProvision('us', {
      path: 'gov.irs.credits.eitc.max',
      breadcrumb: 'IRS → Credits → EITC → Maximum',
      unit: 'currency-USD',
      baselineValue: 600,
      value: 900,
    });
    mockCreate.mockResolvedValue({ id: 'rf-1' });
    renderHeader();

    // When
    await user.click(screen.getByRole('button', { name: 'Save and run 2026 report' }));

    // Then
    await waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate.mock.invocationCallOrder[0]).toBeLessThan(
      mockRun.mock.invocationCallOrder[0]
    );
    const [, , , reformId, year, fromDraft] = mockRun.mock.calls[0];
    expect({ reformId, year, fromDraft }).toEqual({
      reformId: 'rf-1',
      year: 2026,
      fromDraft: true,
    });
    // A second try changes this reform rather than saving another.
    expect(getDraftReform()?.editingReformId).toBe('rf-1');
  });

  test('given the draft came from a saved reform then save and run changes that reform', async () => {
    // Given
    const user = userEvent.setup();
    mockUpdate.mockResolvedValue({ id: 'rf-saved' });
    loadReformIntoDraft(
      {
        id: 'rf-saved',
        userId: 'anonymous',
        countryId: 'us',
        label: 'CTC to $3,000',
        parameters: [
          {
            name: 'gov.irs.credits.ctc.amount.base',
            values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3000 }],
          },
        ],
        baseline: 'current-law',
        provenance: { source: 'manual' },
      },
      () => ({ breadcrumb: 'CTC', unit: 'currency-USD', baselineValue: 2000 })
    );
    renderHeader();

    // When
    await user.click(screen.getByRole('button', { name: 'Save and run 2026 report' }));

    // Then
    await waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));
    expect(mockUpdate).toHaveBeenCalledWith('rf-saved', expect.anything());
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockRun.mock.calls[0][3]).toBe('rf-saved');
  });

  test('given the save fails then no report runs and the error shows', async () => {
    // Given
    const user = userEvent.setup();
    addDraftProvision('us', {
      path: 'gov.irs.credits.eitc.max',
      breadcrumb: 'IRS → Credits → EITC → Maximum',
      unit: 'currency-USD',
      baselineValue: 600,
      value: 900,
    });
    mockCreate.mockRejectedValue(new Error('Failed to create policy'));
    renderHeader();

    // When
    await user.click(screen.getByRole('button', { name: 'Save and run 2026 report' }));

    // Then
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not save the reform. Try again.'
    );
    expect(mockRun).not.toHaveBeenCalled();
  });

  test('given discard then the draft clears without saving', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: 'Discard' }));

    expect(getDraftReform()).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
