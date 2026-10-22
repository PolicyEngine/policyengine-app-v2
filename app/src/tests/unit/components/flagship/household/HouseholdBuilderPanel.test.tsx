import { configureStore } from '@reduxjs/toolkit';
import { render, screen, userEvent } from '@test-utils';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import HouseholdBuilderPanel from '@/components/flagship/household/HouseholdBuilderPanel';
import { commonHouseholdInputs } from '@/components/flagship/report/household/householdPickerInputs';
import { Household } from '@/models/Household';
import metadataReducer from '@/reducers/metadataReducer';
import type { VariableInfo } from '@/utils/VariableResolver';

const PANEL_YEAR = '2026';

/** Inputs the variable search could list, each standing for a rule the panel applies. */
const CANDIDATE_INPUTS: VariableInfo[] = [
  { name: 'tip_income', moduleName: 'household.income.person.tip_income' },
  { name: 'ca_rent', moduleName: 'gov.states.ca.tax.income.credits.renters' },
  { name: 'ny_rent', moduleName: 'gov.states.ny.tax.income.credits.renters' },
  { name: 'employment_income_reported', moduleName: 'household.income.person' },
  { name: 'employment_income_before_lsr', moduleName: 'household.income.person' },
] as VariableInfo[];

// The household builder, tested on its own: a stand-in shows how the panel
// configures it and makes the calls it makes.
vi.mock('@/components/household/HouseholdBuilderForm', () => ({
  default: (props: any) => (
    <div
      aria-label="Household builder"
      data-composition={`${props.maritalStatus} · ${props.numChildren}`}
      data-featured={props.variablePickerCommon
        .map((input: { name: string }) => input.name)
        .join(' ')}
      data-listed={CANDIDATE_INPUTS.filter(props.variableFilter)
        .map((variable) => variable.name)
        .join(' ')}
      data-child-name={
        props.personDisplayNameOf?.('your first dependent') ?? 'your first dependent'
      }
      data-label-inputs={String(!!props.labelInputs)}
      data-suggested={`${props.suggestedLabel}: ${(props.suggestedVariables ?? []).join(' ')}`}
      data-disabled={String(!!props.disabled)}
    >
      <button type="button" onClick={() => props.onMaritalStatusChange('married')}>
        Married
      </button>
      <button type="button" onClick={() => props.onNumChildrenChange(2)}>
        Two children
      </button>
      <button type="button" onClick={() => props.onVariablePickerOpen?.('person')}>
        Open search
      </button>
    </div>
  ),
}));

const californiaHousehold = Household.starter('us', PANEL_YEAR).setGroupVariableAtYear(
  'households',
  'your household',
  'state_name',
  PANEL_YEAR,
  'CA'
);

/** Model information whose builder always shows a person's age and employment income. */
function storeWithBasicInputs() {
  return configureStore({
    reducer: { metadata: metadataReducer },
    preloadedState: {
      metadata: {
        ...metadataReducer(undefined, { type: 'test/init' }),
        currentCountry: 'us',
        basicInputs: ['age', 'employment_income'],
        variables: {
          age: { name: 'age', entity: 'person' },
          employment_income: { name: 'employment_income', entity: 'person' },
        } as any,
        entities: { person: { plural: 'people', is_person: true } } as any,
      },
    },
  });
}

function renderPanel(props: Partial<React.ComponentProps<typeof HouseholdBuilderPanel>> = {}) {
  const onChange = vi.fn();
  render(
    <Provider store={storeWithBasicInputs()}>
      <HouseholdBuilderPanel
        household={californiaHousehold}
        countryId="us"
        year={PANEL_YEAR}
        onChange={onChange}
        {...props}
      />
    </Provider>
  );
  return { onChange, builder: screen.getByLabelText('Household builder') };
}

describe('HouseholdBuilderPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("given a US household then the search lists its own state's programs, and no survey totals or twins of basic fields", () => {
    const { builder } = renderPanel();

    expect(builder).toHaveAttribute('data-listed', 'tip_income ca_rent');
  });

  test("given a country then the builder features that country's inputs and names", () => {
    const { builder } = renderPanel({
      household: Household.starter('uk', PANEL_YEAR),
      countryId: 'uk',
    });

    expect(builder).toHaveAttribute(
      'data-featured',
      commonHouseholdInputs('uk')
        .map((input) => input.name)
        .join(' ')
    );
    expect(builder).toHaveAttribute('data-child-name', 'your first child');
    expect(builder).toHaveAttribute('data-label-inputs', 'true');
  });

  test('given suggested inputs then the builder leads with them as related to the reform', () => {
    const { builder } = renderPanel({ suggestedVariables: ['tip_income'] });

    expect(builder).toHaveAttribute('data-suggested', 'Related to this reform: tip_income');
  });

  test('given the marital status and children chosen then the household changes to match', async () => {
    const user = userEvent.setup();
    const { onChange, builder } = renderPanel();
    expect(builder).toHaveAttribute('data-composition', 'single · 0');

    await user.click(screen.getByRole('button', { name: 'Married' }));
    await user.click(screen.getByRole('button', { name: 'Two children' }));

    expect(onChange.mock.calls[0][0].deriveBuilderComposition(PANEL_YEAR).maritalStatus).toBe(
      'married'
    );
    expect(onChange.mock.calls[1][0].deriveBuilderComposition(PANEL_YEAR).numChildren).toBe(2);
  });

  test("given the caller's analytics then the builder tells it when a search opens", async () => {
    const user = userEvent.setup();
    const onVariablePickerOpen = vi.fn();
    renderPanel({ onVariablePickerOpen });

    await user.click(screen.getByRole('button', { name: 'Open search' }));

    expect(onVariablePickerOpen).toHaveBeenCalledWith('person');
  });
});
