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
  },
  {
    path: 'gov.irs.credits.eitc.max',
    label: 'maximum',
    breadcrumb: 'IRS → Credits → EITC → Maximum',
    unit: 'currency-USD',
    description: null,
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
