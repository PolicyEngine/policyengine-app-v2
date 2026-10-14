import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor, within } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ReformNotFoundError } from '@/api/reformStore';
import { BrowserOnlyIdError } from '@/api/v2Associations';
import { V2ApiError } from '@/api/v2UserClient';
import DraftHeader, { DraftRunBar } from '@/components/flagship/reform/DraftHeader';
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
import {
  seedDeductionMetadata,
  US_REGIONS,
} from '@/tests/fixtures/components/flagship/draftEditorFixtures';

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockFindMine = vi.fn();
const mockRun = vi.fn();

vi.mock('@/hooks/useRunFlagshipReport', () => ({
  useRunFlagshipReport: () => ({ run: mockRun, isRunning: false, error: null }),
}));

vi.mock('@/api/reformStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/reformStore')>();
  return {
    ...actual,
    getReformStore: () => ({ create: mockCreate, update: mockUpdate, findMine: mockFindMine }),
  };
});

function HeaderHarness() {
  const draft = useDraftReform();
  return draft ? (
    <>
      <DraftHeader draft={draft} />
      <DraftRunBar draft={draft} />
    </>
  ) : null;
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
    mockFindMine.mockResolvedValue([]);
    mockCreate.mockResolvedValue({ id: 'rf-new' });
    mockUpdate.mockResolvedValue({});
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

  test('given a draft then its name leads, and the bar under it holds the year, the population and the verbs', () => {
    renderHeader();

    const header = screen.getByRole('banner');
    // The name reads as a title until clicked: empty, it asks for one.
    expect(within(header).getByRole('button', { name: 'Rename the reform' })).toHaveTextContent(
      'Name your reform'
    );
    expect(within(header).queryByRole('button', { name: /^Years?:/ })).not.toBeInTheDocument();
    expect(within(header).queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();

    const bar = screen.getByRole('region', { name: 'Reform actions' });
    expect(within(bar).getByRole('button', { name: 'Year: 2026' })).toBeInTheDocument();
    expect(
      within(bar).getByRole('button', { name: /population: nationwide/i })
    ).toBeInTheDocument();
    // Discard and Save sit left of the run.
    const verbs = within(bar)
      .getAllByRole('button')
      .map((button) => button.textContent?.trim())
      .filter(
        (text) =>
          text === 'Discard' || text === 'Save' || /^Save and run 2026 report$/.test(text ?? '')
      );
    expect(verbs).toEqual(['Discard', 'Save', 'Save and run 2026 report']);
    // It stays in view at the bottom of the window while the reform is long.
    expect(bar).toHaveStyle({ position: 'sticky', bottom: '0px' });
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

    await user.click(screen.getByRole('button', { name: 'Year: 2026' }));
    await user.click(await screen.findByRole('combobox', { name: 'Report year' }));
    await user.click(await screen.findByRole('option', { name: '2027' }));

    expect(getDraftReform()?.year).toBe(2027);
    expect(screen.getByRole('button', { name: /run 2027 report/i })).toBeInTheDocument();
  });

  test('given a budget window is chosen then the draft and its run take it', async () => {
    Element.prototype.scrollIntoView ??= vi.fn();
    Element.prototype.hasPointerCapture ??= vi.fn(() => false);
    seedDeductionMetadata();
    const user = userEvent.setup();
    // A change to run.
    addDraftProvision('us', {
      path: 'gov.irs.credits.eitc.max',
      breadcrumb: 'IRS → Credits → EITC → Maximum',
      unit: 'currency-USD',
      baselineValue: 600,
      value: 900,
    });
    renderHeader();

    // One control: the year, and the years of budget from it.
    await user.click(screen.getByRole('button', { name: 'Year: 2026' }));
    await user.click(await screen.findByRole('tab', { name: '10 years' }));
    // With a window, the year is where it starts.
    expect(screen.getByRole('combobox', { name: 'Start year' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Years: 2026–2035' })).toBeInTheDocument();

    expect(getDraftReform()?.windowYears).toBe(10);
    await user.click(screen.getByRole('button', { name: /run 2026 report/i }));
    expect(mockRun.mock.calls[0][5]).toMatchObject({ fromDraft: true, windowYears: 10 });
  });

  describe('given a run', () => {
    const CHANGED = {
      path: 'gov.irs.credits.eitc.max',
      breadcrumb: 'IRS → Credits → EITC → Maximum',
      unit: 'currency-USD',
      baselineValue: 600,
      value: 900,
    };

    test('then the draft is saved to Your reforms and the report links to it', async () => {
      const user = userEvent.setup();
      addDraftProvision('us', CHANGED);
      renderHeader();

      await user.click(screen.getByRole('button', { name: /run 2026 report/i }));

      await waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockRun.mock.calls[0][3]).toBe('rf-new');
    });

    test('then a saved reform with the same values is reused, not copied', async () => {
      const user = userEvent.setup();
      addDraftProvision('us', CHANGED);
      const draft = getDraftReform()!;
      const parameters = draft.provisions.map((provision) => ({
        name: provision.path,
        values: provision.intervals ?? [
          { startDate: '2026-01-01', endDate: '2100-12-31', value: provision.value },
        ],
      }));
      mockFindMine.mockResolvedValue([
        { id: 'rf-saved', countryId: 'us', label: 'Mine', parameters, provenance: {} },
      ]);
      renderHeader();

      await user.click(screen.getByRole('button', { name: /run 2026 report/i }));

      await waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockRun.mock.calls[0][3]).toBe('rf-saved');
    });
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

  test('given the name is clicked then it opens to typing, and Enter closes it', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: 'Rename the reform' }));
    const input = screen.getByLabelText('Reform name');
    expect(input).toHaveFocus();
    await user.type(input, 'Bigger CTC{Enter}');

    expect(screen.queryByLabelText('Reform name')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rename the reform' })).toHaveTextContent(
      'Bigger CTC'
    );
  });

  test('given the name is typed then the draft takes it', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: 'Rename the reform' }));
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
    const [, , , reformId, year, options] = mockRun.mock.calls[0];
    expect({ reformId, year, fromDraft: options.fromDraft }).toEqual({
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
