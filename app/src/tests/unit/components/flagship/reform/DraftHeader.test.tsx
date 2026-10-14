import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor, within } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import DraftHeader, { DraftRunBar } from '@/components/flagship/reform/DraftHeader';
import {
  addDraftProvision,
  clearDraftReform,
  getDraftReform,
  loadReformIntoDraft,
  setDraftBaseline,
  startDraftReform,
  updateDraftProvisionValue,
  useDraftReform,
} from '@/libs/draftReform';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import {
  seedDeductionMetadata,
  US_REGIONS,
} from '@/tests/fixtures/components/flagship/draftEditorFixtures';
import type { Reform } from '@/types/ingredients/Reform';

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
        (text) => text === 'Discard' || text === 'Save' || /^Run 2026 report$/.test(text ?? '')
      );
    expect(verbs).toEqual(['Discard', 'Save', 'Run 2026 report']);
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

    test('then a failed save still runs the report, unlinked', async () => {
      const user = userEvent.setup();
      mockCreate.mockRejectedValue(new Error('store down'));
      addDraftProvision('us', CHANGED);
      renderHeader();

      await user.click(screen.getByRole('button', { name: /run 2026 report/i }));

      await waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));
      expect(mockRun.mock.calls[0][3]).toBeUndefined();
    });
  });

  describe('given what the report is compared with', () => {
    const CHANGED = {
      path: 'gov.irs.credits.eitc.max',
      breadcrumb: 'IRS → Credits → EITC → Maximum',
      unit: 'currency-USD',
      baselineValue: 600,
      value: 900,
    };
    const PLAN_B = {
      id: 'rf-plan-b',
      countryId: 'us',
      label: 'Plan B',
      parameters: [
        {
          name: 'gov.irs.credits.ctc.amount.base',
          values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3000 }],
        },
      ],
      baseline: 'current-law',
      provenance: { source: 'manual' },
    };

    test('then it reads current law until a saved reform is chosen', async () => {
      const user = userEvent.setup();
      mockFindMine.mockResolvedValue([PLAN_B]);
      renderHeader();

      const bar = screen.getByRole('region', { name: 'Reform actions' });
      await user.click(within(bar).getByRole('button', { name: 'Compared with: Current law' }));

      // Current law first, then the reforms Your reforms lists.
      const options = (await screen.findAllByRole('option')).map((option) =>
        option.textContent?.trim()
      );
      expect(options).toEqual(['Current law', 'Plan B']);
    });

    test('then a chosen saved reform is the draft’s and the run’s', async () => {
      const user = userEvent.setup();
      mockFindMine.mockResolvedValue([PLAN_B]);
      addDraftProvision('us', CHANGED);
      renderHeader();

      await user.click(screen.getByRole('button', { name: 'Compared with: Current law' }));
      await user.click(await screen.findByRole('option', { name: 'Plan B' }));

      expect(getDraftReform()?.baselineReformId).toBe('rf-plan-b');
      expect(screen.getByRole('button', { name: 'Compared with: Plan B' })).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /run 2026 report/i }));

      await waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));
      expect(mockRun.mock.calls[0][5].baseline).toEqual({
        reformId: 'rf-plan-b',
        label: 'Plan B',
        parameters: PLAN_B.parameters,
      });
      // The reform itself is still saved as its own, not as Plan B.
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockRun.mock.calls[0][3]).toBe('rf-new');
    });

    test('then choosing current law again runs with no baseline', async () => {
      const user = userEvent.setup();
      mockFindMine.mockResolvedValue([PLAN_B]);
      addDraftProvision('us', CHANGED);
      setDraftBaseline('rf-plan-b');
      renderHeader();

      await user.click(await screen.findByRole('button', { name: 'Compared with: Plan B' }));
      await user.click(await screen.findByRole('option', { name: 'Current law' }));
      await user.click(screen.getByRole('button', { name: /run 2026 report/i }));

      await waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));
      expect(getDraftReform()?.baselineReformId).toBeUndefined();
      expect(mockRun.mock.calls[0][5].baseline).toBeUndefined();
    });

    test('then the saved reform the draft edits is not offered against itself', async () => {
      const user = userEvent.setup();
      mockFindMine.mockResolvedValue([PLAN_B, { ...PLAN_B, id: 'rf-mine', label: 'Mine' }]);
      loadReformIntoDraft({ ...PLAN_B, id: 'rf-mine', label: 'Mine' } as Reform, (path) => ({
        breadcrumb: path,
        unit: 'currency-USD',
        baselineValue: 2000,
      }));
      renderHeader();

      await user.click(screen.getByRole('button', { name: 'Compared with: Current law' }));

      expect(await screen.findByRole('option', { name: 'Plan B' })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'Mine' })).not.toBeInTheDocument();
    });

    test('then a draft that sets just what its comparison sets waits for a change', async () => {
      mockFindMine.mockResolvedValue([PLAN_B]);
      updateDraftProvisionValue('gov.irs.credits.ctc.amount.base', 3000);
      setDraftBaseline('rf-plan-b');
      renderHeader();

      expect(
        await screen.findByText(/this reform matches plan b\. change a value/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /run 2026 report/i })).toBeDisabled();
    });

    test('then a draft that differs from its comparison only in unchanged values waits for a change', async () => {
      // Each side also sets a value at current law, which the run leaves out.
      seedDeductionMetadata();
      const atCurrentLaw = {
        name: 'gov.irs.credits.eitc.phase_in_rate[1].amount',
        values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 0.34 }],
      };
      mockFindMine.mockResolvedValue([
        { ...PLAN_B, parameters: [...PLAN_B.parameters, atCurrentLaw] },
      ]);
      updateDraftProvisionValue('gov.irs.credits.ctc.amount.base', 3000);
      addDraftProvision('us', { ...CHANGED, value: CHANGED.baselineValue });
      setDraftBaseline('rf-plan-b');
      renderHeader();

      expect(
        await screen.findByText(/this reform matches plan b\. change a value/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /run 2026 report/i })).toBeDisabled();
    });

    test('then a saved reform that sets nothing is not offered', async () => {
      const user = userEvent.setup();
      mockFindMine.mockResolvedValue([
        PLAN_B,
        { ...PLAN_B, id: 'rf-empty', label: 'Empty', parameters: [] },
      ]);
      renderHeader();

      await user.click(screen.getByRole('button', { name: 'Compared with: Current law' }));

      expect(await screen.findByRole('option', { name: 'Plan B' })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'Empty' })).not.toBeInTheDocument();
    });

    test('then a chosen comparison holds the run until the saved reforms load', async () => {
      mockFindMine.mockReturnValue(new Promise(() => {}));
      addDraftProvision('us', CHANGED);
      setDraftBaseline('rf-plan-b');
      renderHeader();

      expect(screen.getByRole('button', { name: /run 2026 report/i })).toBeDisabled();
    });

    test('then current law runs while the saved reforms load', async () => {
      mockFindMine.mockReturnValue(new Promise(() => {}));
      addDraftProvision('us', CHANGED);
      renderHeader();

      expect(screen.getByRole('button', { name: /run 2026 report/i })).toBeEnabled();
    });

    test('then a comparison no longer saved reads, and runs, as current law', async () => {
      const user = userEvent.setup();
      mockFindMine.mockResolvedValue([]);
      addDraftProvision('us', CHANGED);
      setDraftBaseline('rf-deleted');
      renderHeader();

      expect(
        await screen.findByRole('button', { name: 'Compared with: Current law' })
      ).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /run 2026 report/i }));

      await waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));
      expect(mockRun.mock.calls[0][5].baseline).toBeUndefined();
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

  test('given discard then the draft clears without saving', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: 'Discard' }));

    expect(getDraftReform()).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
