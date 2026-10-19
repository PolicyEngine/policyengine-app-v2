import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import VariableSearchDropdown from '@/components/household/VariableSearchDropdown';
import type { VariableInfo } from '@/utils/VariableResolver';

const variable = (name: string, label: string) => ({ name, label }) as VariableInfo;
const VARIABLES = [
  variable('alimony_income', 'Alimony income'),
  variable('childcare_expenses', 'Childcare expenses'),
  variable('rent', 'Rent'),
];

function renderDropdown(suggested?: ReadonlyMap<string, number>) {
  return render(
    <VariableSearchDropdown
      searchValue=""
      onSearchChange={vi.fn()}
      onFocusChange={vi.fn()}
      filteredVariables={VARIABLES}
      onSelect={vi.fn()}
      suggested={suggested}
      suggestedLabel="Related to this reform"
    />
  );
}

describe('VariableSearchDropdown', () => {
  test('given no suggestions then the list shows as before, without headings', async () => {
    renderDropdown();
    await userEvent.setup().click(screen.getByRole('textbox'));

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Alimony income',
      'Childcare expenses',
      'Rent',
    ]);
    expect(screen.queryByText('All variables')).not.toBeInTheDocument();
  });

  test('given suggestions then they lead under their heading, then all variables', async () => {
    renderDropdown(
      new Map([
        ['rent', 0],
        ['childcare_expenses', 1],
      ])
    );
    await userEvent.setup().click(screen.getByRole('textbox'));

    expect(screen.getByText('Related to this reform')).toBeInTheDocument();
    expect(screen.getByText('All variables')).toBeInTheDocument();
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Childcare expenses',
      'Rent',
      'Alimony income',
    ]);
  });

  test('given groups then chips filter the list, and each group shows under its heading', async () => {
    const user = userEvent.setup();
    const groupOf = (v: VariableInfo) => (v.name === 'rent' ? 'Housing' : 'Income');
    render(
      <VariableSearchDropdown
        searchValue=""
        onSearchChange={vi.fn()}
        onFocusChange={vi.fn()}
        filteredVariables={VARIABLES}
        onSelect={vi.fn()}
        groupOf={groupOf}
        groupOrder={['Income', 'Housing']}
      />
    );
    await user.click(screen.getByRole('textbox'));

    expect(screen.getByText('Income', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('Housing', { selector: 'p' })).toBeInTheDocument();
    // The list's rows; the phone's category choice has options of its own.
    const rows = () =>
      screen.getAllByRole('option').filter((option) => option.hasAttribute('data-option'));
    expect(rows()).toHaveLength(3);

    await user.click(screen.getByRole('button', { name: /Housing/ }));

    expect(rows().map((option) => option.textContent)).toEqual(['Rent']);
    expect(screen.getByRole('button', { name: /Housing/ })).toHaveAttribute('aria-pressed', 'true');
  });

  test('given groups on a phone then one category choice filters the list', async () => {
    const user = userEvent.setup();
    const groupOf = (v: VariableInfo) => (v.name === 'rent' ? 'Housing' : 'Income');
    render(
      <VariableSearchDropdown
        searchValue=""
        onSearchChange={vi.fn()}
        onFocusChange={vi.fn()}
        filteredVariables={VARIABLES}
        onSelect={vi.fn()}
        groupOf={groupOf}
        groupOrder={['Income', 'Housing']}
      />
    );
    await user.click(screen.getByRole('textbox'));

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Variable category' }),
      'Housing'
    );

    expect(
      screen
        .getAllByRole('option')
        .filter((option) => option.hasAttribute('data-option'))
        .map((option) => option.textContent)
    ).toEqual(['Rent']);
  });
});
