import { fireEvent, render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import HouseholdBuilderForm, {
  rankVariablesBySearch,
} from '@/components/household/HouseholdBuilderForm';
import { Household } from '@/models/Household';
import type { VariableInfo } from '@/utils/VariableResolver';

// The SPM choice needs the full model metadata; here only its place in the form matters.
vi.mock('@/components/household/SPMGeographyChoice', () => ({
  default: () => <div>Supplemental Poverty Measure geography</div>,
}));

const YEAR = '2026';

function renderForm(props: Partial<React.ComponentProps<typeof HouseholdBuilderForm>> = {}) {
  return render(
    <HouseholdBuilderForm
      household={Household.starter('us', YEAR).withSPM({ geography_kind: 'national' })}
      metadata={{ variables: {}, entities: {} }}
      year={YEAR}
      maritalStatus="single"
      numChildren={0}
      basicPersonFields={[]}
      basicNonPersonFields={[]}
      onChange={vi.fn()}
      onMaritalStatusChange={vi.fn()}
      onNumChildrenChange={vi.fn()}
      {...props}
    />
  );
}

describe('HouseholdBuilderForm', () => {
  test('given no layout props then the SPM choice and the stacked sections show, as before', () => {
    renderForm();

    expect(screen.getByText('Supplemental Poverty Measure geography')).toBeInTheDocument();
    expect(screen.getByRole('separator', { hidden: true })).toBeInTheDocument();
  });

  test('given hideSpmGeography then the SPM choice is left out', () => {
    renderForm({ hideSpmGeography: true });

    expect(screen.queryByText('Supplemental Poverty Measure geography')).not.toBeInTheDocument();
    expect(screen.getByText('Marital status')).toBeInTheDocument();
  });

  test('given the columns layout then the number of children is typed, any whole number to 10', () => {
    const onNumChildrenChange = vi.fn();
    renderForm({ layout: 'columns', onNumChildrenChange });

    const input = screen.getByLabelText('Number of children');
    fireEvent.change(input, { target: { value: '7' } });
    expect(onNumChildrenChange).toHaveBeenLastCalledWith(7);

    // A partial or out-of-range entry waits.
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.change(input, { target: { value: '12' } });
    expect(onNumChildrenChange).toHaveBeenCalledTimes(1);
  });

  test('given the columns layout then family and household share a row, the people follow as cards', () => {
    const { container } = renderForm({ layout: 'columns' });

    expect(container.firstElementChild).toHaveClass('tw:lg:flex-wrap');
    expect(screen.queryByRole('separator', { hidden: true })).not.toBeInTheDocument();
    expect(screen.getByText('Individuals')).toBeInTheDocument();
    expect(screen.getByText('Household')).toBeInTheDocument();
  });
});

describe('rankVariablesBySearch', () => {
  const variable = (name: string, label: string) => ({ name, label }) as VariableInfo;
  const VARIABLES = [
    variable('has_esi', 'Person currently has ESI'),
    variable('is_parent', 'Is a parent'),
    variable('rent', 'Rent'),
    variable('pre_subsidy_rent', 'Pre-subsidy rent'),
    variable('childcare_expenses', 'Childcare expenses'),
  ];
  const names = (list: VariableInfo[]) => list.map((entry) => entry.name);

  test('given a word then whole words lead, and parts of words follow', () => {
    expect(names(rankVariablesBySearch(VARIABLES, 'rent'))).toEqual([
      'rent',
      'pre_subsidy_rent',
      'is_parent',
      'has_esi',
    ]);
  });

  test('given two words then a variable must match both', () => {
    expect(names(rankVariablesBySearch(VARIABLES, 'subsidy rent'))).toEqual(['pre_subsidy_rent']);
  });

  test('given no match then the list is empty', () => {
    expect(rankVariablesBySearch(VARIABLES, 'pension')).toEqual([]);
  });
});
