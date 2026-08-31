import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import ParameterSearchBox from '@/components/flagship/ParameterSearchBox';
import type { ParameterSearchEntry } from '@/libs/parameterSearch';

const ENTRIES: ParameterSearchEntry[] = [
  {
    path: 'gov.irs.credits.ctc.amount',
    label: 'amount',
    breadcrumb: 'IRS → Credits → Child tax credit → Amount',
    unit: 'currency-USD',
    description: null,
    isContrib: false,
    stateCode: null,
  },
  {
    path: 'gov.irs.credits.eitc.max',
    label: 'maximum',
    breadcrumb: 'IRS → Credits → EITC → Maximum',
    unit: 'currency-USD',
    description: null,
    isContrib: false,
    stateCode: null,
  },
  {
    path: 'gov.irs.credits.eitc.phase_in_rate',
    label: 'phase-in rate',
    breadcrumb: 'IRS → Credits → EITC → Phase-in rate',
    unit: '/1',
    description: null,
    isContrib: false,
    stateCode: null,
  },
  {
    path: 'gov.states.ut.tax.income.credits.ctc.amount',
    label: 'amount',
    breadcrumb: 'Utah → Income tax → Child tax credit → Amount',
    unit: 'currency-USD',
    description: null,
    isContrib: false,
    stateCode: 'ut',
  },
  {
    path: 'gov.contrib.ctc.expansion.amount',
    label: 'expanded amount',
    breadcrumb: 'Contributed → CTC expansion → Amount',
    unit: 'currency-USD',
    description: null,
    isContrib: true,
    stateCode: null,
  },
];

// A folder with both its own leaf and a nested subfolder, for the
// in-place folder browser: crumbs up, subfolder rows down.
const REFUNDABILITY_ENTRIES: ParameterSearchEntry[] = [
  {
    path: 'gov.irs.credits.ctc.refundable.fully_refundable',
    label: 'fully refundable',
    breadcrumb: 'IRS → Credits → Child tax credit → Refundability → Fully refundable',
    unit: 'bool',
    description: null,
    isContrib: false,
    stateCode: null,
  },
  {
    path: 'gov.irs.credits.ctc.refundable.phase_in.rate',
    label: 'rate',
    breadcrumb: 'IRS → Credits → Child tax credit → Refundability → Phase-in → Rate',
    unit: '/1',
    description: null,
    isContrib: false,
    stateCode: null,
  },
  {
    path: 'gov.irs.credits.ctc.refundable.phase_in.threshold',
    label: 'threshold',
    breadcrumb: 'IRS → Credits → Child tax credit → Refundability → Phase-in → Threshold',
    unit: 'currency-USD',
    description: null,
    isContrib: false,
    stateCode: null,
  },
];

const NODE_LABELS: Record<string, string> = {
  'gov.irs': 'IRS',
  'gov.irs.credits': 'Credits',
  'gov.irs.credits.ctc': 'Child tax credit',
  'gov.irs.credits.ctc.refundable': 'Refundability',
  'gov.irs.credits.ctc.refundable.phase_in': 'Phase-in',
};

const labelForNode = (path: string) => NODE_LABELS[path] ?? null;

describe('ParameterSearchBox', () => {
  test('given a matching query then results show breadcrumb and path', async () => {
    // Given
    const user = userEvent.setup();
    render(<ParameterSearchBox entries={ENTRIES} onSelect={vi.fn()} />);

    // When
    await user.type(screen.getByRole('combobox', { name: /search parameters/i }), 'child tax');

    // Then
    expect(
      await screen.findByText('IRS → Credits → Child tax credit → Amount')
    ).toBeInTheDocument();
    expect(screen.getByText('gov.irs.credits.ctc.amount')).toBeInTheDocument();
  });

  test('given a result is clicked then onSelect fires and the query clears', async () => {
    // Given
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ParameterSearchBox entries={ENTRIES} onSelect={onSelect} />);
    const input = screen.getByRole('combobox', { name: /search parameters/i });
    await user.type(input, 'child tax');

    // When
    await user.click(await screen.findByText('IRS → Credits → Child tax credit → Amount'));

    // Then
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'gov.irs.credits.ctc.amount' })
    );
    expect(input).toHaveValue('');
  });

  test('given keyboard navigation then enter selects the highlighted result', async () => {
    // Given
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ParameterSearchBox entries={ENTRIES} onSelect={onSelect} />);
    const input = screen.getByRole('combobox', { name: /search parameters/i });

    // When
    await user.type(input, 'credits');
    await user.keyboard('{ArrowDown}{Enter}');

    // Then
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test('given results sharing a folder then a folder header shows with indented leaf labels', async () => {
    // Given
    const user = userEvent.setup();
    render(<ParameterSearchBox entries={ENTRIES} onSelect={vi.fn()} />);

    // When
    await user.type(screen.getByRole('combobox', { name: /search parameters/i }), 'eitc');

    // Then
    expect(await screen.findByText('IRS → Credits → EITC')).toBeInTheDocument();
    expect(screen.getByText('Maximum')).toBeInTheDocument();
    expect(screen.getByText('Phase-in rate')).toBeInTheDocument();
    expect(screen.queryByText('IRS → Credits → EITC → Maximum')).not.toBeInTheDocument();
  });

  test('given a folder child is clicked then onSelect fires with that parameter', async () => {
    // Given
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ParameterSearchBox entries={ENTRIES} onSelect={onSelect} />);
    await user.type(screen.getByRole('combobox', { name: /search parameters/i }), 'eitc');

    // When
    await user.click(await screen.findByText('Maximum'));

    // Then
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'gov.irs.credits.eitc.max' })
    );
  });

  test('given default filters then contributed parameters are hidden', async () => {
    // Given
    const user = userEvent.setup();
    render(<ParameterSearchBox entries={ENTRIES} onSelect={vi.fn()} />);

    // When
    await user.type(
      screen.getByRole('combobox', { name: /search parameters/i }),
      'ctc expansion amount'
    );

    // Then
    expect(screen.queryByText('Contributed → CTC expansion → Amount')).not.toBeInTheDocument();
  });

  test('given contributed is opted in then contributed parameters appear with a badge', async () => {
    // Given
    const user = userEvent.setup();
    render(<ParameterSearchBox entries={ENTRIES} onSelect={vi.fn()} />);
    await user.click(screen.getByRole('checkbox', { name: /include contributed/i }));

    // When
    await user.type(
      screen.getByRole('combobox', { name: /search parameters/i }),
      'ctc expansion amount'
    );

    // Then
    expect(await screen.findByText('Contributed → CTC expansion → Amount')).toBeInTheDocument();
    expect(screen.getByText('contributed')).toBeInTheDocument();
  });

  test('given federal-only scope then state parameters are excluded', async () => {
    // Given
    const user = userEvent.setup();
    render(<ParameterSearchBox entries={ENTRIES} onSelect={vi.fn()} />);
    await user.selectOptions(screen.getByRole('combobox', { name: /state scope/i }), 'federal');

    // When
    await user.type(screen.getByRole('combobox', { name: /search parameters/i }), 'child tax');

    // Then
    expect(screen.getByText('IRS → Credits → Child tax credit → Amount')).toBeInTheDocument();
    expect(
      screen.queryByText('Utah → Income tax → Child tax credit → Amount')
    ).not.toBeInTheDocument();
  });

  test('given a state scope then only that state appears with its badge', async () => {
    // Given
    const user = userEvent.setup();
    render(
      <ParameterSearchBox entries={ENTRIES} onSelect={vi.fn()} stateLabels={{ ut: 'Utah' }} />
    );
    await user.selectOptions(screen.getByRole('combobox', { name: /state scope/i }), 'ut');

    // When
    await user.type(screen.getByRole('combobox', { name: /search parameters/i }), 'child tax');

    // Then
    expect(screen.getByText('Utah → Income tax → Child tax credit → Amount')).toBeInTheDocument();
    expect(screen.queryByText('IRS → Credits → Child tax credit → Amount')).not.toBeInTheDocument();
    // The badge keeps the code; only the filter option spells the state out.
    expect(screen.getByRole('option', { name: 'Utah' })).toBeInTheDocument();
    expect(screen.getAllByText('UT').length).toBeGreaterThan(0);
  });

  test('given state labels then the scope filter names states instead of codes', () => {
    // Given / When
    render(
      <ParameterSearchBox entries={ENTRIES} onSelect={vi.fn()} stateLabels={{ ut: 'Utah' }} />
    );

    // Then
    expect(screen.getByRole('option', { name: 'Utah' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'UT only' })).not.toBeInTheDocument();
  });

  test('given no label for a state then the filter falls back to its code', () => {
    // Given / When
    render(<ParameterSearchBox entries={ENTRIES} onSelect={vi.fn()} />);

    // Then
    expect(screen.getByRole('option', { name: 'UT' })).toBeInTheDocument();
  });

  test('given the contributed filter then its meaning is available to the reader', () => {
    // Given / When
    render(<ParameterSearchBox entries={ENTRIES} onSelect={vi.fn()} />);

    // Then
    expect(screen.getByLabelText(/not current law/i)).toBeInTheDocument();
  });

  test('given a query with no match then no listbox renders', async () => {
    // Given
    const user = userEvent.setup();
    render(<ParameterSearchBox entries={ENTRIES} onSelect={vi.fn()} />);

    // When
    await user.type(
      screen.getByRole('combobox', { name: /search parameters/i }),
      'zzzz quantum flux'
    );

    // Then
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('given a folder header is clicked then the folder contents show in place', async () => {
    // Given — search matched only one of the folder's parameters
    const user = userEvent.setup();
    const bracketed: ParameterSearchEntry[] = [
      {
        path: 'gov.irs.credits.eitc.max[0].threshold',
        label: 'threshold',
        breadcrumb: 'IRS → Credits → EITC → Maximum → Bracket 1 → Threshold',
        unit: 'currency-USD',
        description: null,
        isContrib: false,
        stateCode: null,
      },
      {
        path: 'gov.irs.credits.eitc.max[0].amount',
        label: 'amount',
        breadcrumb: 'IRS → Credits → EITC → Maximum → Bracket 1 → Amount',
        unit: 'currency-USD',
        description: null,
        isContrib: false,
        stateCode: null,
      },
      {
        path: 'gov.irs.credits.eitc.max[1].threshold',
        label: 'threshold',
        breadcrumb: 'IRS → Credits → EITC → Maximum → Bracket 2 → Threshold',
        unit: 'currency-USD',
        description: null,
        isContrib: false,
        stateCode: null,
      },
    ];
    render(<ParameterSearchBox entries={bracketed} onSelect={vi.fn()} />);
    // 'bracket' matches both Bracket 1 rows, so they cluster under a
    // folder header; Bracket 2's lone row stays standalone.
    await user.type(screen.getByRole('combobox', { name: /search parameters/i }), 'bracket');

    // When — the bracket index is not a folder of its own, so the header
    // resolves to the real parent and lists every descendant
    await user.click(screen.getAllByRole('button', { name: /^browse/i })[0]);

    // Then — the sibling the query missed is now on screen
    expect(screen.getByText('3 parameters')).toBeInTheDocument();
    expect(screen.getByText('Bracket 1 → Amount')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to matches/i })).toBeInTheDocument();
  });

  test('given folder contents then selecting one adds it and closes the list', async () => {
    const user = userEvent.setup();
    const onSelectEntry = vi.fn();
    render(<ParameterSearchBox entries={ENTRIES} onSelect={onSelectEntry} />);
    await user.type(screen.getByRole('combobox', { name: /search parameters/i }), 'eitc');
    await user.click(screen.getAllByRole('button', { name: /^browse/i })[0]);

    await user.click(screen.getByText('Phase-in rate'));

    expect(onSelectEntry).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'gov.irs.credits.eitc.phase_in_rate' })
    );
  });

  test('given back to matches then the search results return', async () => {
    const user = userEvent.setup();
    render(<ParameterSearchBox entries={ENTRIES} onSelect={vi.fn()} />);
    await user.type(screen.getByRole('combobox', { name: /search parameters/i }), 'eitc');
    await user.click(screen.getAllByRole('button', { name: /^browse/i })[0]);

    await user.click(screen.getByRole('button', { name: /back to matches/i }));

    expect(screen.getByText('IRS → Credits → EITC')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /back to matches/i })).not.toBeInTheDocument();
  });

  test('given a breadcrumb crumb is clicked then the parent folder opens with subfolder rows', async () => {
    // Given — browsing the Phase-in folder, reached from search
    const user = userEvent.setup();
    render(
      <ParameterSearchBox
        entries={REFUNDABILITY_ENTRIES}
        onSelect={vi.fn()}
        labelFor={labelForNode}
      />
    );
    await user.type(screen.getByRole('combobox', { name: /search parameters/i }), 'phase-in');
    await user.click(screen.getAllByRole('button', { name: /^browse/i })[0]);
    expect(screen.getByText('2 parameters')).toBeInTheDocument();

    // When — stepping up one level via the breadcrumb
    await user.click(screen.getByRole('button', { name: 'Refundability' }));

    // Then — the parent's own leaf shows, and Phase-in folds into a
    // subfolder row instead of flattened arrow-prefixed rows
    expect(screen.getByText('3 parameters')).toBeInTheDocument();
    expect(screen.getByText('Fully refundable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open phase-in/i })).toBeInTheDocument();
    expect(screen.queryByText('Phase-in → Rate')).not.toBeInTheDocument();
  });

  test('given a subfolder row is clicked then the dropdown descends into it', async () => {
    // Given — browsing the Refundability folder
    const user = userEvent.setup();
    render(
      <ParameterSearchBox
        entries={REFUNDABILITY_ENTRIES}
        onSelect={vi.fn()}
        labelFor={labelForNode}
      />
    );
    await user.type(screen.getByRole('combobox', { name: /search parameters/i }), 'phase-in');
    await user.click(screen.getAllByRole('button', { name: /^browse/i })[0]);
    await user.click(screen.getByRole('button', { name: 'Refundability' }));

    // When
    await user.click(screen.getByRole('button', { name: /open phase-in/i }));

    // Then
    expect(screen.getByText('2 parameters')).toBeInTheDocument();
    expect(screen.getByText('Rate')).toBeInTheDocument();
    expect(screen.getByText('Threshold')).toBeInTheDocument();
  });

  test('given escape inside a folder then it steps back to matches, not to empty', async () => {
    const user = userEvent.setup();
    render(<ParameterSearchBox entries={ENTRIES} onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox', { name: /search parameters/i });
    await user.type(input, 'eitc');
    await user.click(screen.getAllByRole('button', { name: /^browse/i })[0]);

    await user.type(input, '{Escape}');

    expect(input).toHaveValue('eitc');
    expect(screen.queryByRole('button', { name: /back to matches/i })).not.toBeInTheDocument();
  });
});
