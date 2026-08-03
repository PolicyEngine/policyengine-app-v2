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

  test('given default filters then contributed parameters are hidden with a hint', async () => {
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
    expect(screen.getByText(/hidden by filters/i)).toBeInTheDocument();
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

  test('given a state scope then that state and federal both appear with state badges', async () => {
    // Given
    const user = userEvent.setup();
    render(<ParameterSearchBox entries={ENTRIES} onSelect={vi.fn()} />);
    await user.selectOptions(screen.getByRole('combobox', { name: /state scope/i }), 'ut');

    // When
    await user.type(screen.getByRole('combobox', { name: /search parameters/i }), 'child tax');

    // Then
    expect(screen.getByText('Utah → Income tax → Child tax credit → Amount')).toBeInTheDocument();
    expect(screen.getByText('IRS → Credits → Child tax credit → Amount')).toBeInTheDocument();
    expect(screen.getByText('UT')).toBeInTheDocument();
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
});
