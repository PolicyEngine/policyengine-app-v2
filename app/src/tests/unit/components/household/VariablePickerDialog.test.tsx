import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import VariablePickerDialog from '@/components/household/VariablePickerDialog';
import type { VariableInfo } from '@/utils/VariableResolver';

const input = (name: string, label: string, documentation?: string) =>
  ({ name, label, documentation }) as VariableInfo;

const VARIABLES = [
  input('pre_subsidy_rent', 'Pre subsidy rent', 'Rent paid for the home'),
  input('tip_income', 'Tip income'),
  input('qualified_dividend_income', 'qualified dividend income'),
  input('hourly_wage', 'Hourly wage'),
];
const GROUPS: Record<string, string> = {
  pre_subsidy_rent: 'Housing and utilities',
  tip_income: 'Income',
  qualified_dividend_income: 'Income',
  hourly_wage: 'Income',
};
const PARTS: Record<string, string> = {
  tip_income: 'Wages and work',
  hourly_wage: 'Wages and work',
  qualified_dividend_income: 'Investments',
};

function renderPicker(props: Partial<React.ComponentProps<typeof VariablePickerDialog>> = {}) {
  const onSelect = vi.fn();
  render(
    <VariablePickerDialog
      title="Add a variable to you"
      searchValue=""
      onSearchChange={vi.fn()}
      variables={VARIABLES}
      onSelect={onSelect}
      onClose={vi.fn()}
      groupOf={(v) => GROUPS[v.name]}
      groupOrder={['Income', 'Housing and utilities']}
      subgroupOf={(v) => PARTS[v.name] ?? null}
      subgroupOrder={['Wages and work', 'Investments']}
      common={[
        { name: 'pre_subsidy_rent', label: 'Rent', icon: null },
        { name: 'not_offered_here', label: 'Gas', icon: null },
      ]}
      {...props}
    />
  );
  return { onSelect };
}

const rows = () => screen.queryAllByRole('option').map((option) => option.textContent);

describe('VariablePickerDialog', () => {
  test('given it opens then the common inputs it offers lead, as tiles', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();

    expect(screen.getByRole('dialog', { name: 'Add a variable to you' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rent' })).toBeInTheDocument();
    // A tile for an input this picker does not offer is left out.
    expect(screen.queryByRole('button', { name: 'Gas' })).not.toBeInTheDocument();
    expect(rows()).toEqual([]);

    await user.click(screen.getByRole('button', { name: 'Rent' }));
    expect(onSelect).toHaveBeenCalledWith(VARIABLES[0]);
  });

  test('given a topic then its inputs list by name, part by part', async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getAllByRole('button', { name: 'Income' })[0]);

    expect(rows()).toEqual(['Hourly wage', 'Tip income', 'Qualified dividend income']);
    expect(screen.getByText('Wages and work')).toBeInTheDocument();
    expect(screen.getByText('Investments')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Income' })[0]).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  test('given a search then its matches list in its order', () => {
    renderPicker({ searchValue: 'income', variables: [VARIABLES[2], VARIABLES[1]] });

    expect(screen.getByText('Results for “income”')).toBeInTheDocument();
    expect(rows()).toEqual(['Qualified dividend income', 'Tip income']);
  });

  test('given the pointer on a row then the input is described below the list', async () => {
    const user = userEvent.setup();
    renderPicker({ searchValue: 'rent', variables: [VARIABLES[0]], nameOf: () => 'Rent' });

    expect(screen.queryByText('Rent paid for the home')).not.toBeInTheDocument();
    await user.hover(screen.getByRole('option', { name: 'Rent' }));

    expect(screen.getByText('Rent paid for the home')).toBeInTheDocument();
  });

  test('given the reform suggests inputs then the first view lists them', () => {
    renderPicker({
      suggested: new Map([['hourly_wage', 0]]),
      suggestedLabel: 'Related to this reform',
    });

    expect(screen.getByText('Related to this reform')).toBeInTheDocument();
    expect(rows()).toEqual(['Hourly wage']);
  });
});
