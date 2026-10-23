import { fireEvent, render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import HouseholdBuilderForm, {
  PEOPLE_GRID_CLASSES,
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

  test('given a request to hide the SPM choice then there is no such option, and the choice shows', () => {
    // @ts-expect-error Every builder shows the SPM choice; it cannot be hidden.
    renderForm({ hideSpmGeography: true });

    expect(screen.getByText('Supplemental Poverty Measure geography')).toBeInTheDocument();
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

    expect(container.firstElementChild).toHaveClass('tw:lg:flex-row');
    expect(screen.queryByRole('separator', { hidden: true })).not.toBeInTheDocument();
    expect(screen.getByText('Individuals')).toBeInTheDocument();
    expect(screen.getByText('Household')).toBeInTheDocument();
  });

  test('given the columns layout then the people sit at most four to a row, fewer as the section narrows', () => {
    renderForm({ layout: 'columns' });

    const peopleGrid = screen.getByText('You').closest('[data-slot="accordion"]');
    expect(peopleGrid).toHaveClass(...PEOPLE_GRID_CLASSES.split(' '));
    expect(peopleGrid?.className).not.toContain('auto-fill');
    // The column counts follow the Individuals section's width, not the window's.
    const individualsSection = screen
      .getByText('Individuals')
      .closest('[data-slot="accordion-item"]');
    expect(individualsSection).toHaveClass('tw:@container');
  });

  test('given each width step of the people grid then it holds at most four cards of at least 260px', () => {
    const minimumCardWidthPx = 260;
    const gapPx = 12; // tw:gap-3
    expect(PEOPLE_GRID_CLASSES).toContain('tw:gap-3');

    const columnCounts = [...PEOPLE_GRID_CLASSES.matchAll(/grid-cols-(\d+)/g)].map((match) =>
      Number(match[1])
    );
    expect(Math.max(...columnCounts)).toBe(4);

    const widthSteps = [...PEOPLE_GRID_CLASSES.matchAll(/@min-\[(\d+)px\]:grid-cols-(\d+)/g)];
    expect(widthSteps.length).toBeGreaterThan(0);
    for (const [, sectionWidth, columnCount] of widthSteps) {
      const columns = Number(columnCount);
      const cardWidthPx = (Number(sectionWidth) - (columns - 1) * gapPx) / columns;
      expect(cardWidthPx).toBeGreaterThanOrEqual(minimumCardWidthPx);
    }
  });

  describe('input names', () => {
    const metadata = {
      entities: {
        person: { plural: 'people', label: 'Person', is_person: true },
        household: { plural: 'households', label: 'Household' },
      },
      variables: {
        employment_income: {
          name: 'employment_income',
          label: 'employment income',
          entity: 'person',
          isInputVariable: true,
          valueType: 'float',
          defaultValue: 0,
        },
        rent: {
          name: 'rent',
          label: 'rent',
          entity: 'household',
          isInputVariable: true,
          valueType: 'float',
          defaultValue: 0,
        },
      },
    };
    const props = {
      metadata,
      basicPersonFields: ['employment_income'],
      basicNonPersonFields: ['rent'],
    };

    test('given labelInputs then each input is named by its label, and whose it is', () => {
      renderForm({ ...props, labelInputs: true });

      expect(screen.getByRole('textbox', { name: 'Employment income, you' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Rent' })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Marital status' })).toBeInTheDocument();
    });

    test('given no labelInputs then the inputs have no names of their own, as before', () => {
      renderForm(props);

      for (const input of screen.getAllByRole('textbox')) {
        expect(input).not.toHaveAttribute('aria-label');
      }
    });
  });

  test('given personDisplayNameOf then a person shows by that name, and keeps their key', () => {
    const household = Household.starter('uk', YEAR).withBuilderChildCount(YEAR, 1);
    const onChange = vi.fn();
    renderForm({
      household,
      onChange,
      personDisplayNameOf: (key) => key.replace('dependent', 'child'),
    });

    expect(screen.getByText('Your first child')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add variable to your first child/ })).toBeVisible();
    expect(household.personNames).toContain('your first dependent');
  });

  test('given no personDisplayNameOf then a dependent keeps the name, as before', () => {
    renderForm({ household: Household.starter('uk', YEAR).withBuilderChildCount(YEAR, 1) });

    expect(screen.getByText('Your first dependent')).toBeInTheDocument();
  });

  test('given the stacked layout then the people are not laid out as a grid of cards', () => {
    renderForm();

    const peopleList = screen.getByText('You').closest('[data-slot="accordion"]');
    expect(peopleList?.className ?? '').not.toContain('tw:grid');
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

  test('given searchByEntity then a person lists person inputs and the household the rest', async () => {
    const variable = (name: string, label: string, entity: string) => ({
      name,
      label,
      entity,
      isInputVariable: true,
      valueType: 'float',
      moduleName: 'household.income.person.misc',
    });
    const metadata = {
      entities: {
        person: { plural: 'people', label: 'Person', is_person: true },
        tax_unit: { plural: 'tax_units', label: 'Tax unit' },
        household: { plural: 'households', label: 'Household' },
      },
      variables: {
        tip_income: variable('tip_income', 'Tip income', 'person'),
        rent: variable('rent', 'Rent', 'household'),
        tax_unit_childcare: variable('tax_unit_childcare', 'Childcare', 'tax_unit'),
      },
    };
    const groupOf = () => 'Income';
    const optionsIn = () =>
      screen
        .getAllByRole('option')
        .filter((option) => option.hasAttribute('data-option'))
        .map((option) => option.textContent);
    const { unmount } = renderForm({ metadata, searchByEntity: true, variableGroupOf: groupOf });

    fireEvent.click(screen.getByRole('button', { name: /Add variable to you$/ }));
    fireEvent.mouseDown(screen.getAllByRole('button', { name: 'Income' })[0]);
    expect(optionsIn()).toEqual(['Tip income']);
    unmount();

    renderForm({ metadata, searchByEntity: true, variableGroupOf: groupOf });
    fireEvent.click(screen.getByRole('button', { name: 'Add variable to your household' }));
    fireEvent.mouseDown(screen.getAllByRole('button', { name: 'Income' })[0]);
    expect(optionsIn().sort()).toEqual(['Childcare', 'Rent']);
  });

  test('given a picker opened and an input added then it says so once, by entity and source', () => {
    const variable = (name: string, label: string, entity: string) => ({
      name,
      label,
      entity,
      isInputVariable: true,
      valueType: 'float',
      defaultValue: 0,
      moduleName: 'household.income.person.misc',
    });
    const metadata = {
      entities: {
        person: { plural: 'people', label: 'Person', is_person: true },
        household: { plural: 'households', label: 'Household' },
      },
      variables: {
        tip_income: variable('tip_income', 'Tip income', 'person'),
        rent: variable('rent', 'Rent', 'household'),
      },
    };
    const onVariablePickerOpen = vi.fn();
    const onVariableAdd = vi.fn();
    renderForm({
      metadata,
      searchByEntity: true,
      variableGroupOf: () => 'Income',
      onVariablePickerOpen,
      onVariableAdd,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add variable to your household' }));
    fireEvent.mouseDown(screen.getAllByRole('button', { name: 'Income' })[0]);
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Rent' }));

    expect(onVariablePickerOpen.mock.calls).toEqual([['group']]);
    expect(onVariableAdd.mock.calls).toEqual([
      [{ variable: 'rent', source: 'topic', entity: 'group' }],
    ]);
  });

  test('given the columns layout then the number of children steps up and down and takes no decimals', () => {
    const onNumChildrenChange = vi.fn();
    renderForm({ layout: 'columns', numChildren: 2, onNumChildrenChange });

    fireEvent.click(screen.getByRole('button', { name: 'Increase number of children' }));
    expect(onNumChildrenChange).toHaveBeenLastCalledWith(3);
    fireEvent.click(screen.getByRole('button', { name: 'Decrease number of children' }));
    expect(onNumChildrenChange).toHaveBeenLastCalledWith(1);

    const input = screen.getByLabelText('Number of children');
    fireEvent.change(input, { target: { value: '2.5' } });
    expect(input).toHaveValue('25');
  });

  test('given the columns layout then a whole-number input steps and drops a decimal point', () => {
    const onChange = vi.fn();
    const metadata = {
      entities: {
        person: { plural: 'people', label: 'Person', is_person: true },
        household: { plural: 'households', label: 'Household' },
      },
      variables: {
        num_bedrooms: {
          name: 'num_bedrooms',
          label: 'Number of bedrooms',
          entity: 'household',
          isInputVariable: true,
          valueType: 'int',
          defaultValue: 0,
        },
      },
    };
    const household = Household.starter('us', YEAR).withSPM({ geography_kind: 'national' });
    renderForm({
      layout: 'columns',
      metadata,
      household,
      basicNonPersonFields: ['num_bedrooms'],
      onChange,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Increase Number of bedrooms' }));
    expect(onChange).toHaveBeenCalledTimes(1);

    const input = screen.getByPlaceholderText(/^Enter/);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '3.7' } });
    expect(input).toHaveValue('37');
  });

  test('given the stacked layout then whole-number inputs keep no step buttons, as before', () => {
    renderForm();
    expect(screen.queryByRole('button', { name: /^Increase / })).not.toBeInTheDocument();
  });

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
