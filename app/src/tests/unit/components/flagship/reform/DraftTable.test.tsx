import { act, fireEvent, render, screen, userEvent, within } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import DraftTable from '@/components/flagship/reform/DraftTable';
import { FOREVER } from '@/constants';
import {
  addDraftProvision,
  clearDraftReform,
  getDraftReform,
  startDraftReform,
  useDraftReform,
} from '@/libs/draftReform';
import { clearProvisionFocus, focusProvision } from '@/libs/flagship/draftEditorFocus';
import { selectParameterSearchEntries } from '@/libs/parameterSearch';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import {
  CTC_PATH,
  EXEMPTION_PATH,
  JOINT_PATH,
  LIST_PATH,
  PHASE_IN_RATE_PATH,
  seedDeductionMetadata,
  SINGLE_PATH,
} from '@/tests/fixtures/components/flagship/draftEditorFixtures';

const CTC = {
  path: CTC_PATH,
  breadcrumb: 'IRS → Credits → Child tax credit → Base amount',
  unit: 'currency-USD',
  baselineValue: 2200,
  value: 2200,
};
const SINGLE = {
  path: SINGLE_PATH,
  breadcrumb: 'IRS → Deductions → Standard → Amount → SINGLE',
  unit: 'currency-USD',
  baselineValue: 16100,
  value: 16100,
};

/** Mirrors real usage: the page passes the live-subscribed draft. */
function TableHarness() {
  const draft = useDraftReform();
  return draft ? <DraftTable draft={draft} /> : null;
}

const provision = (path: string) => getDraftReform()!.provisions.find((p) => p.path === path);
const cell = (label: string) =>
  within(screen.getByLabelText(label)).getByRole('spinbutton') as HTMLInputElement;
const rowValue = (path: string) =>
  document.querySelector(`[data-path="${path}"] input`) as HTMLInputElement;

describe('DraftTable', () => {
  beforeEach(() => {
    seedDeductionMetadata();
    clearProvisionFocus();
    clearDraftReform();
    startDraftReform('us', 'manual');
    addDraftProvision('us', CTC);
    addDraftProvision('us', SINGLE);
  });

  afterEach(() => {
    store.dispatch(clearMetadata());
  });

  test('given a lone parameter then its row edits the value in place, from the report year on', () => {
    render(<TableHarness />);

    fireEvent.change(rowValue(CTC_PATH), { target: { value: '3000' } });

    expect(provision(CTC_PATH)?.intervals).toEqual([
      { startDate: '2026-01-01', endDate: FOREVER, value: 3000 },
    ]);
    expect(screen.getByText('from 2026')).toBeInTheDocument();
  });

  test('given a breakdown member then the row stands for the whole breakdown', () => {
    render(<TableHarness />);

    const open = screen.getByRole('button', { name: 'Open Standard deduction amount' });
    expect(open).toHaveTextContent(/^Standard deduction amount$/);
    expect(screen.getByRole('button', { name: 'No values changed yet' })).toBeInTheDocument();
  });

  test('given a breakdown is opened then every member is in its grid and editing one adds it', async () => {
    const user = userEvent.setup();
    render(<TableHarness />);

    await user.click(screen.getByRole('button', { name: 'Open Standard deduction amount' }));
    fireEvent.change(cell('Joint, 2026'), { target: { value: '35000' } });

    expect(screen.getAllByRole('rowheader').map((row) => row.textContent)).toEqual([
      'Single',
      'Joint',
      'Head of household',
      'Indexing',
    ]);
    expect(provision(JOINT_PATH)?.intervals).toEqual([
      { startDate: '2026-01-01', endDate: FOREVER, value: 35000 },
    ]);
    expect(screen.getByText('was $32,200')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close Standard deduction amount' }));
    // Closed, the row names what changed and when.
    expect(screen.getByRole('button', { name: 'Joint $35,000' })).toBeInTheDocument();
    expect(screen.getByText('from 2026')).toBeInTheDocument();
  });

  test('given by year then one year changes alone and the row says so', async () => {
    const user = userEvent.setup();
    render(<TableHarness />);
    await user.click(screen.getByRole('button', { name: 'Open Standard deduction amount' }));

    await user.click(screen.getByRole('tab', { name: 'By year' }));
    expect(cell('Single, 2027').value).toBe('16500');
    fireEvent.change(cell('Single, 2027'), { target: { value: '17000' } });

    expect(provision(SINGLE_PATH)?.intervals).toEqual([
      { startDate: '2027-01-01', endDate: '2027-12-31', value: 17000 },
    ]);
    await user.click(screen.getByRole('button', { name: 'Close Standard deduction amount' }));
    expect(screen.getByRole('button', { name: 'Single $17,000' })).toBeInTheDocument();
    expect(screen.getByText('2027 only')).toBeInTheDocument();
  });

  test('given a lone parameter is opened then its value shows once, under current law', async () => {
    const user = userEvent.setup();
    render(<TableHarness />);

    await user.click(screen.getByRole('button', { name: 'Open Base amount' }));

    // The row's own input gives way to the editor: one input, not two.
    expect(document.querySelectorAll(`[data-path="${CTC_PATH}"] input`)).toHaveLength(1);
    expect(screen.getAllByRole('rowheader').map((row) => row.textContent)).toEqual([
      'Current law',
      'Your reform',
      'Indexing',
    ]);
    expect(screen.getByRole('tab', { name: 'One value' })).toHaveAttribute('data-state', 'active');
  });

  test('given custom dates then every member is set over the same range together', async () => {
    const user = userEvent.setup();
    render(<TableHarness />);
    await user.click(screen.getByRole('button', { name: 'Open Standard deduction amount' }));

    await user.click(screen.getByRole('tab', { name: 'Custom dates' }));
    expect(
      screen.getByRole('columnheader', { name: 'Jan 1, 2026 – Dec 31, 2026' })
    ).toBeInTheDocument();
    fireEvent.change(cell('Single, 2026'), { target: { value: '18000' } });
    fireEvent.change(cell('Joint, 2026'), { target: { value: '36000' } });
    await user.click(screen.getByRole('button', { name: 'Add change to 2 values' }));

    const range = { startDate: '2026-01-01', endDate: '2026-12-31' };
    expect(provision(SINGLE_PATH)?.intervals).toEqual([{ ...range, value: 18000 }]);
    expect(provision(JOINT_PATH)?.intervals).toEqual([{ ...range, value: 36000 }]);
    expect(screen.getByText('Joint: 2026 only')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add change' })).toBeDisabled();
  });

  test('given custom dates then a mid-year start with no end is two picks', async () => {
    const user = userEvent.setup();
    render(<TableHarness />);
    await user.click(screen.getByRole('button', { name: 'Open Base amount' }));
    await user.click(screen.getByRole('tab', { name: 'Custom dates' }));

    await user.click(screen.getByRole('button', { name: 'From: Jan 1, 2026' }));
    await user.click(screen.getByRole('button', { name: 'Jul 1, 2026' }));
    await user.click(screen.getByRole('button', { name: 'To: Dec 31, 2026' }));
    await user.click(screen.getByRole('button', { name: 'No end date' }));
    expect(screen.getByRole('columnheader', { name: 'Jul 1, 2026 onward' })).toBeInTheDocument();
    fireEvent.change(cell('Child tax credit base amount, 2026'), { target: { value: '2500' } });
    await user.click(screen.getByRole('button', { name: 'Add change' }));

    expect(provision(CTC_PATH)?.intervals).toEqual([
      { startDate: '2026-07-01', endDate: FOREVER, value: 2500 },
    ]);
    expect(screen.getByText('from Jul 1, 2026')).toBeInTheDocument();
  });

  test('given the editor then what the parameter is and its past values come after it', async () => {
    const user = userEvent.setup();
    render(<TableHarness />);
    await user.click(screen.getByRole('button', { name: 'Open Base amount' }));

    const regions = screen
      .getAllByRole('region')
      .map((region) => region.getAttribute('aria-label'));
    expect(regions).toEqual(['New value', 'About this parameter']);
    const history = screen.getByRole('button', { name: /show past values/i });
    await user.click(history);
    expect(history).toHaveAttribute('aria-expanded', 'true');
  });

  test('given a breakdown then its past values can be shown for any member', async () => {
    const user = userEvent.setup();
    render(<TableHarness />);
    await user.click(screen.getByRole('button', { name: 'Open Standard deduction amount' }));

    await user.click(screen.getByRole('button', { name: /show past values/i }));
    const members = within(screen.getByRole('group', { name: 'Past values of' }));
    expect(members.getAllByRole('button').map((chip) => chip.textContent)).toEqual([
      'Single',
      'Joint',
      'Head of household',
    ]);
    await user.click(members.getByRole('button', { name: 'Joint' }));

    expect(members.getByRole('button', { name: 'Joint' })).toHaveAttribute('aria-pressed', 'true');
  });

  describe('given a schedule of brackets', () => {
    const PHASE_IN = {
      path: PHASE_IN_RATE_PATH,
      breadcrumb: 'IRS → Credits → EITC → Phase-in rate → Bracket 2 → Amount',
      unit: '/1',
      baselineValue: 0.34,
      value: 0.34,
    };
    const openSchedule = async (user: ReturnType<typeof userEvent.setup>) => {
      addDraftProvision('us', PHASE_IN);
      render(<TableHarness />);
      await user.click(
        screen.getByRole('button', { name: 'Open EITC phase-in rate by number of children' })
      );
    };

    test('then it opens as a table, a bracket per row, each threshold beside its rate', async () => {
      const user = userEvent.setup();
      await openSchedule(user);

      expect(screen.getAllByRole('rowheader').map((row) => row.textContent)).toEqual([
        'Bracket 1',
        'Bracket 2',
      ]);
      expect(screen.getAllByRole('columnheader').map((col) => col.textContent)).toEqual([
        '',
        'Threshold (children)',
        'Rate',
      ]);
      fireEvent.change(cell('Bracket 2 · rate, 2026'), { target: { value: '36' } });

      expect(provision(PHASE_IN_RATE_PATH)?.intervals).toEqual([
        { startDate: '2026-01-01', endDate: FOREVER, value: 0.36 },
      ]);
      expect(screen.getByText('was 34%')).toBeInTheDocument();
    });

    test('then by year shows one year at a time, and a year changes alone', async () => {
      const user = userEvent.setup();
      await openSchedule(user);

      await user.click(screen.getByRole('tab', { name: 'By year' }));
      await user.click(screen.getByRole('tab', { name: '2028' }));
      fireEvent.change(cell('Bracket 2 · rate, 2028'), { target: { value: '40' } });

      expect(provision(PHASE_IN_RATE_PATH)?.intervals).toEqual([
        { startDate: '2028-01-01', endDate: '2028-12-31', value: 0.4 },
      ]);
    });

    test('then custom dates set the schedule over one range', async () => {
      const user = userEvent.setup();
      await openSchedule(user);

      await user.click(screen.getByRole('tab', { name: 'Custom dates' }));
      fireEvent.change(cell('Bracket 2 · rate, Jan 1, 2026 – Dec 31, 2026'), {
        target: { value: '38' },
      });
      await user.click(screen.getByRole('button', { name: 'Add change' }));

      expect(provision(PHASE_IN_RATE_PATH)?.intervals).toEqual([
        { startDate: '2026-01-01', endDate: '2026-12-31', value: 0.38 },
      ]);
    });
  });

  describe('given a value set from one year on', () => {
    beforeEach(() => {
      // Radix Select scrolls its options and captures the pointer, which jsdom lacks.
      Element.prototype.scrollIntoView ??= vi.fn();
      Element.prototype.hasPointerCapture ??= vi.fn(() => false);
    });

    test('then an unindexed amount holds by default, and can grow with an index', async () => {
      const user = userEvent.setup();
      render(<TableHarness />);
      await user.click(screen.getByRole('button', { name: 'Open Base amount' }));

      const after = screen.getByRole('combobox', { name: 'Indexing' });
      expect(after).toHaveTextContent('None');
      await user.click(after);
      await user.click(await screen.findByRole('option', { name: 'CPI-U' }));
      fireEvent.change(cell('Child tax credit base amount, 2026'), { target: { value: '3000' } });

      expect(provision(CTC_PATH)?.intervals).toEqual([
        { startDate: '2026-01-01', endDate: '2026-12-31', value: 3000 },
        { startDate: '2027-01-01', endDate: FOREVER, value: 3090 },
      ]);
      await user.click(screen.getByRole('button', { name: 'Close Base amount' }));
      expect(screen.getByText('from 2026 · CPI-U')).toHaveAttribute(
        'title',
        'from 2026, indexed to CPI-U'
      );
    });

    test("then an amount current law indexes is indexed at current law's rate by default", async () => {
      const user = userEvent.setup();
      addDraftProvision('us', {
        path: EXEMPTION_PATH,
        breadcrumb: 'IRS → Income → Exemption → Amount',
        unit: 'currency-USD',
        baselineValue: 5000,
        value: 5000,
      });
      render(<TableHarness />);
      await user.click(screen.getByRole('button', { name: 'Open Amount' }));

      expect(screen.getByRole('combobox', { name: 'Indexing' })).toHaveTextContent(
        "Current law's rate"
      );
      fireEvent.change(cell('Personal exemption amount, 2026'), { target: { value: '6000' } });

      // 6,000 grows as 5,000 → 5,100 does (2%) to 6,120, then rounds down
      // to $100, the step current law's projected values all land on.
      expect(provision(EXEMPTION_PATH)?.intervals).toEqual([
        { startDate: '2026-01-01', endDate: '2026-12-31', value: 6000 },
        { startDate: '2027-01-01', endDate: FOREVER, value: 6100 },
      ]);
      expect(screen.getByRole('combobox', { name: 'Rounding' })).toHaveTextContent('down to');
      expect(screen.getByRole('combobox', { name: 'Rounding step' })).toHaveTextContent('$100');
    });

    test('then a value set before indexing existed shows none, as it runs', async () => {
      const user = userEvent.setup();
      addDraftProvision('us', {
        path: EXEMPTION_PATH,
        breadcrumb: 'IRS → Income → Exemption → Amount',
        unit: 'currency-USD',
        baselineValue: 5000,
        value: 6000,
      });
      render(<TableHarness />);
      await user.click(screen.getByRole('button', { name: 'Open Amount' }));

      expect(screen.getByRole('combobox', { name: 'Indexing' })).toHaveTextContent('None');
    });

    test('then the years after preview what the growth makes of it', async () => {
      const user = userEvent.setup();
      render(<TableHarness />);
      await user.click(screen.getByRole('button', { name: 'Open Base amount' }));
      await user.click(screen.getByRole('combobox', { name: 'Indexing' }));
      await user.click(await screen.findByRole('option', { name: 'CPI-U' }));

      fireEvent.change(cell('Child tax credit base amount, 2026'), { target: { value: '3000' } });

      // CPI-U goes 100 → 103 from 2026 to 2027, the model's last year here.
      expect(screen.getByLabelText('Child tax credit base amount, 2027')).toHaveTextContent(
        '$3,090'
      );
      expect(
        screen.getByText('From 2027: $3,000 × CPI-U that year ÷ CPI-U in 2026.')
      ).toBeInTheDocument();
    });

    test('then a later start holds the value until it, measured from the base year', async () => {
      const user = userEvent.setup();
      addDraftProvision('us', {
        path: EXEMPTION_PATH,
        breadcrumb: 'IRS → Income → Exemption → Amount',
        unit: 'currency-USD',
        baselineValue: 5000,
        value: 5000,
      });
      render(<TableHarness />);
      await user.click(screen.getByRole('button', { name: 'Open Amount' }));
      await user.click(screen.getByRole('combobox', { name: 'Indexing' }));
      await user.click(await screen.findByRole('option', { name: "Current law's rate" }));
      fireEvent.change(cell('Personal exemption amount, 2026'), { target: { value: '6000' } });

      // The model runs to 2027 here, so 2027 is the only later start.
      expect(screen.getByRole('combobox', { name: 'Indexing starts' })).toHaveTextContent('2027');
      expect(screen.getByRole('combobox', { name: 'Base year' })).toHaveTextContent('2026');
      expect(provision(EXEMPTION_PATH)).toMatchObject({ growthStart: 2027, growthBase: 2026 });
    });

    test('then the rounding can change, and the values follow', async () => {
      const user = userEvent.setup();
      render(<TableHarness />);
      await user.click(screen.getByRole('button', { name: 'Open Base amount' }));
      await user.click(screen.getByRole('combobox', { name: 'Indexing' }));
      await user.click(await screen.findByRole('option', { name: 'CPI-U' }));
      fireEvent.change(cell('Child tax credit base amount, 2026'), { target: { value: '3000' } });

      await user.click(screen.getByRole('combobox', { name: 'Rounding step' }));
      await user.click(await screen.findByRole('option', { name: '$50' }));
      await user.click(screen.getByRole('combobox', { name: 'Rounding' }));
      await user.click(await screen.findByRole('option', { name: 'down to' }));

      // 3,000 × 1.03 = 3,090, down to a multiple of $50.
      expect(provision(CTC_PATH)?.intervals?.[1]).toMatchObject({ value: 3050 });
      expect(provision(CTC_PATH)).toMatchObject({ growthRoundTo: 50, growthRound: 'down' });
      expect(
        screen.getByText(
          'From 2027: $3,000 × CPI-U that year ÷ CPI-U in 2026, rounded down to a multiple of $50.'
        )
      ).toBeInTheDocument();
    });

    test('then a rate has no growth to offer', async () => {
      const user = userEvent.setup();
      addDraftProvision('us', {
        path: PHASE_IN_RATE_PATH,
        breadcrumb: 'IRS → Credits → EITC → Phase-in rate → Bracket 2 → Amount',
        unit: '/1',
        baselineValue: 0.34,
        value: 0.34,
      });
      render(<TableHarness />);
      await user.click(
        screen.getByRole('button', { name: 'Open EITC phase-in rate by number of children' })
      );

      expect(screen.queryByRole('combobox', { name: 'Indexing' })).not.toBeInTheDocument();
    });
  });

  test('given a pick then its row opens and the open one closes', () => {
    render(<TableHarness />);
    act(() => focusProvision(SINGLE_PATH));
    expect(
      screen.getByRole('button', { name: 'Close Standard deduction amount' })
    ).toBeInTheDocument();

    act(() => focusProvision(CTC_PATH));

    expect(
      screen.getByRole('button', { name: 'Open Standard deduction amount' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close Base amount' })).toBeInTheDocument();
    expect(rowValue(CTC_PATH)).toHaveFocus();
  });

  test('given a pick lands on a lone parameter then its value is focused', () => {
    render(<TableHarness />);

    act(() => focusProvision(CTC_PATH));

    expect(rowValue(CTC_PATH)).toHaveFocus();
  });

  test('given a pick lands on a breakdown member then its row opens on that member', () => {
    render(<TableHarness />);

    act(() => focusProvision(SINGLE_PATH));

    expect(cell('Single, 2026')).toHaveFocus();
  });

  test('given a breakdown row is removed then all its members leave the draft', async () => {
    const user = userEvent.setup();
    addDraftProvision('us', { ...SINGLE, path: JOINT_PATH, breadcrumb: 'IRS → JOINT' });
    render(<TableHarness />);

    await user.click(screen.getByRole('button', { name: 'Remove Standard deduction amount' }));

    expect(getDraftReform()!.provisions.map((p) => p.path)).toEqual([CTC_PATH]);
  });

  test('given a list-valued parameter from an older reform then it shows read only', () => {
    const list = ['employee_social_security_tax', 'employee_medicare_tax'];
    addDraftProvision('us', {
      path: LIST_PATH,
      breadcrumb: 'IRS → Credits → Child tax credit → Refundability → Social security → Added',
      unit: 'list',
      baselineValue: list,
      value: [...list],
    });
    render(<TableHarness />);

    expect(screen.getByText(/can.t be changed here/i)).toBeInTheDocument();
    expect(document.querySelector(`[data-path="${LIST_PATH}"]`)).toBeNull();
  });

  test('given list-valued parameters then search and browse never offer them', () => {
    const offered = selectParameterSearchEntries(store.getState()).map((entry) => entry.path);

    expect(offered).toContain(CTC_PATH);
    expect(offered).not.toContain(LIST_PATH);
  });
});
