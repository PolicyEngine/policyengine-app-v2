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
});
