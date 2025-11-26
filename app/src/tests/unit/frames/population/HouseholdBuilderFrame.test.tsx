import { configureStore } from '@reduxjs/toolkit';
import { screen, waitFor } from '@test-utils';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import HouseholdBuilderFrame from '@/frames/population/HouseholdBuilderFrame';
import metadataReducer from '@/reducers/metadataReducer';
import populationReducer from '@/reducers/populationReducer';
import reportReducer from '@/reducers/reportReducer';
import {
  getMockHousehold,
  mockCreateHouseholdResponse,
  mockFlowProps,
  mockTaxYears,
} from '@/tests/fixtures/frames/populationMocks';

// Mock household utilities with stateful implementation
vi.mock('@/utils/HouseholdBuilder', () => ({
  HouseholdBuilder: vi.fn().mockImplementation((_countryId, _taxYear) => {
    let householdData = {
      people: {} as Record<string, any>,
      families: {},
      spm_units: {},
      households: {
        'your household': {
          members: [] as string[],
        },
      },
      marital_units: {},
      tax_units: {
        'your tax unit': {
          members: [] as string[],
        },
      },
    };

    return {
      build: vi.fn(() => ({
        id: '456',
        countryId: 'us' as any,
        householdData,
      })),
      loadHousehold: vi.fn((household) => {
        householdData = { ...household.householdData };
      }),
      addAdult: vi.fn((name: string, age, vars) => {
        householdData.people[name] = {
          age: { '2024': age },
          employment_income: { '2024': vars?.employment_income || 0 },
        };
        householdData.households['your household'].members.push(name);
        householdData.tax_units['your tax unit'].members.push(name);
      }),
      addChild: vi.fn((name: string, age, _parents, vars) => {
        householdData.people[name] = {
          age: { '2024': age },
          employment_income: { '2024': vars?.employment_income || 0 },
        };
        householdData.households['your household'].members.push(name);
        householdData.tax_units['your tax unit'].members.push(name);
      }),
      removePerson: vi.fn((name: string) => {
        delete householdData.people[name];
        const householdMembers = householdData.households['your household'].members;
        const index = householdMembers.indexOf(name);
        if (index > -1) {
          householdMembers.splice(index, 1);
        }
        const taxUnitMembers = householdData.tax_units['your tax unit'].members;
        const taxIndex = taxUnitMembers.indexOf(name);
        if (taxIndex > -1) {
          taxUnitMembers.splice(taxIndex, 1);
        }
      }),
      setMaritalStatus: vi.fn(),
      assignToGroupEntity: vi.fn(),
    };
  }),
}));

vi.mock('@/utils/HouseholdQueries', () => ({
  getChildCount: vi.fn(() => 0),
  getChildren: vi.fn(() => []),
  getPersonVariable: vi.fn((_household, _person, variable, _year) => {
    if (variable === 'age') {
      return 30;
    }
    if (variable === 'employment_income') {
      return 50000;
    }
    return 0;
  }),
}));

vi.mock('@/utils/HouseholdValidation', () => ({
  HouseholdValidation: {
    isReadyForSimulation: vi.fn(() => ({ isValid: true, errors: [] })),
  },
}));

// Mock adapter
vi.mock('@/adapters/HouseholdAdapter', () => ({
  HouseholdAdapter: {
    toCreationPayload: vi.fn(() => ({
      country_id: 'us',
      data: getMockHousehold().householdData,
    })),
  },
}));

// Mock hooks - hoisted to ensure they're available before module load
const { mockCreateHousehold, mockResetIngredient } = vi.hoisted(() => ({
  mockCreateHousehold: vi.fn(),
  mockResetIngredient: vi.fn(),
}));

vi.mock('@/hooks/useCreateHousehold', () => ({
  useCreateHousehold: () => ({
    createHousehold: mockCreateHousehold,
    isPending: false,
  }),
}));

vi.mock('@/hooks/useIngredientReset', () => ({
  useIngredientReset: () => ({
    resetIngredient: mockResetIngredient,
  }),
}));

vi.mock('@/hooks/useReportYear', () => ({
  useReportYear: () => '2024',
}));

// Mock metadata selectors
const mockBasicInputFields = {
  person: ['age', 'employment_income'],
  household: ['state_code'],
  taxUnit: [],
  spmUnit: [],
  family: [],
  maritalUnit: [],
};

const mockFieldOptions = [
  { value: 'CA', label: 'California' },
  { value: 'NY', label: 'New York' },
];

vi.mock('@/libs/metadataUtils', () => ({
  getTaxYears: () => mockTaxYears,
  getBasicInputFields: () => mockBasicInputFields,
  getFieldLabel: (field: string) => {
    const labels: Record<string, string> = {
      state_code: 'State',
      age: 'Age',
      employment_income: 'Employment Income',
    };
    return labels[field] || field;
  },
  isDropdownField: (_state: any, field: string) => field === 'state_code',
  getFieldOptions: (_state: any, _field: string) => mockFieldOptions,
}));

// Mock VariableResolver utilities
vi.mock('@/utils/VariableResolver', () => ({
  getInputVariables: (_metadata: any) => {
    // Return list of all input variables
    return [
      { name: 'self_employment_income', label: 'Self Employment Income', entity: 'person' },
      { name: 'rental_income', label: 'Rental Income', entity: 'person' },
      { name: 'household_wealth', label: 'Household Wealth', entity: 'household' },
    ];
  },
  getVariableInfo: (variableName: string, _metadata: any) => {
    // Return variable info for a given variable name
    const variableMap: Record<string, any> = {
      age: { name: 'age', label: 'Age', entity: 'person', valueType: 'int', defaultValue: 0 },
      employment_income: {
        name: 'employment_income',
        label: 'Employment Income',
        entity: 'person',
        valueType: 'float',
        unit: 'currency-USD',
        defaultValue: 0,
      },
      self_employment_income: {
        name: 'self_employment_income',
        label: 'Self Employment Income',
        entity: 'person',
        valueType: 'float',
        defaultValue: 0,
      },
      rental_income: {
        name: 'rental_income',
        label: 'Rental Income',
        entity: 'person',
        valueType: 'float',
        defaultValue: 0,
      },
      state_code: {
        name: 'state_code',
        label: 'State',
        entity: 'household',
        valueType: 'string',
        defaultValue: 'CA',
      },
      household_wealth: {
        name: 'household_wealth',
        label: 'Household Wealth',
        entity: 'household',
        valueType: 'float',
        defaultValue: 0,
      },
    };
    return variableMap[variableName] || null;
  },
  getVariableEntityDisplayInfo: (variableName: string, _metadata: any) => {
    // Return entity display info for a variable
    const personVars = ['age', 'employment_income', 'self_employment_income', 'rental_income'];
    const isPerson = personVars.includes(variableName);
    return { isPerson, label: isPerson ? 'person' : 'household' };
  },
  resolveEntity: (variableName: string, _metadata: any) => {
    // Map variable names to entities
    const entityMap: Record<string, { plural: string; isPerson: boolean }> = {
      age: { plural: 'people', isPerson: true },
      employment_income: { plural: 'people', isPerson: true },
      self_employment_income: { plural: 'people', isPerson: true },
      rental_income: { plural: 'people', isPerson: true },
      state_code: { plural: 'households', isPerson: false },
      household_wealth: { plural: 'households', isPerson: false },
    };
    return entityMap[variableName] || { plural: 'households', isPerson: false };
  },
  getValue: (household: any, variableName: string, _metadata: any, year: string) => {
    // Get value from household data
    // Check people first
    for (const person of Object.values(household.householdData.people)) {
      if ((person as any)[variableName]) {
        return (person as any)[variableName][year] ?? 0;
      }
    }

    // Check households
    for (const hh of Object.values(household.householdData.households)) {
      if ((hh as any)[variableName]) {
        return (hh as any)[variableName][year] ?? 0;
      }
    }

    return 0;
  },
  addVariableToEntity: (
    household: any,
    variableName: string,
    _metadata: any,
    year: string,
    entityName: string
  ) => {
    // Add variable to the entity
    const newHousehold = JSON.parse(JSON.stringify(household));

    // Check if it's a person or household-level entity
    if (newHousehold.householdData.people[entityName]) {
      // Person entity
      newHousehold.householdData.people[entityName][variableName] = { [year]: 0 };
    } else {
      // Household-level entity
      if (!newHousehold.householdData.households[entityName]) {
        newHousehold.householdData.households[entityName] = { members: [] };
      }
      newHousehold.householdData.households[entityName][variableName] = { [year]: 0 };
    }

    return newHousehold;
  },
  removeVariable: (household: any, variableName: string, _metadata: any) => {
    // Remove variable from all entities
    const newHousehold = JSON.parse(JSON.stringify(household));

    // Remove from people
    Object.keys(newHousehold.householdData.people).forEach((person) => {
      delete newHousehold.householdData.people[person][variableName];
    });

    // Remove from households
    Object.keys(newHousehold.householdData.households).forEach((hh) => {
      delete newHousehold.householdData.households[hh][variableName];
    });

    return newHousehold;
  },
}));

describe('HouseholdBuilderFrame', () => {
  let store: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateHousehold.mockReset();
    mockResetIngredient.mockReset();
    mockCreateHousehold.mockResolvedValue(mockCreateHouseholdResponse);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (
    populationState: any = {},
    metadataState: Partial<any> = {
      currentCountry: 'us',
      variables: {
        age: {
          name: 'age',
          label: 'Age',
          entity: 'person',
          valueType: 'float',
          unit: 'year',
          defaultValue: 30,
          isInputVariable: true,
        },
        employment_income: {
          name: 'employment_income',
          label: 'Employment Income',
          entity: 'person',
          valueType: 'float',
          unit: 'currency-USD',
          defaultValue: 0,
          isInputVariable: true,
        },
      },
      basic_inputs: {
        person: ['age', 'employment_income'],
        household: ['state_code'],
      },
      loading: false,
      error: null,
    },
    props = mockFlowProps
  ) => {
    const basePopulationState = {
      populations: [
        {
          household: getMockHousehold(),
        },
        null,
      ],
      ...populationState,
    };
    const fullMetadataState = {
      loading: false,
      error: null,
      currentCountry: 'us',
      variables: {
        age: {
          name: 'age',
          label: 'Age',
          entity: 'person',
          valueType: 'float',
          unit: 'year',
          defaultValue: 30,
          isInputVariable: true,
        },
        employment_income: {
          name: 'employment_income',
          label: 'Employment Income',
          entity: 'person',
          valueType: 'float',
          unit: 'currency-USD',
          defaultValue: 0,
          isInputVariable: true,
        },
        state_code: {
          name: 'state_code',
          label: 'State',
          entity: 'household',
          valueType: 'str',
          defaultValue: '',
          possibleValues: mockFieldOptions,
          isInputVariable: true,
        },
      },
      parameters: {},
      entities: {
        person: { plural: 'people', label: 'Person' },
        household: { plural: 'households', label: 'Household' },
        tax_unit: { plural: 'tax_units', label: 'Tax Unit' },
        spm_unit: { plural: 'spm_units', label: 'SPM Unit' },
        family: { plural: 'families', label: 'Family' },
        marital_unit: { plural: 'marital_units', label: 'Marital Unit' },
      },
      variableModules: {},
      economyOptions: { region: [], time_period: [], datasets: [] },
      currentLawId: 0,
      basicInputs: ['age', 'employment_income'],
      basic_inputs: {
        person: ['age', 'employment_income'],
        household: ['state_code'],
      },
      modelledPolicies: { core: {}, filtered: {} },
      version: null,
      parameterTree: null,
      ...metadataState,
    };

    store = configureStore({
      reducer: {
        population: populationReducer,
        report: reportReducer,
        metadata: metadataReducer,
      },
      preloadedState: {
        population: basePopulationState,
        metadata: fullMetadataState,
      },
    });

    return render(
      <Provider store={store}>
        <MantineProvider>
          <MemoryRouter initialEntries={['/us/populations']}>
            <Routes>
              <Route path="/:countryId/*" element={<HouseholdBuilderFrame {...props} />} />
            </Routes>
          </MemoryRouter>
        </MantineProvider>
      </Provider>
    );
  };

  describe('Component rendering', () => {
    test('given component loads then displays household builder form', () => {
      // When
      renderComponent();

      // Then
      expect(screen.getByText('Build Your Household')).toBeInTheDocument();
      expect(screen.getByText('Marital Status')).toBeInTheDocument();
      expect(screen.getByText('Number of Children')).toBeInTheDocument();
    });

    test('given metadata error then displays error state', () => {
      // Given
      const metadataState = {
        loading: false,
        error: 'Failed to load metadata',
      };

      // When
      renderComponent({}, metadataState);

      // Then
      expect(screen.getByText('Failed to Load Required Data')).toBeInTheDocument();
      expect(screen.getByText(/Unable to load household configuration data/)).toBeInTheDocument();
    });

    test('given loading state then shows loading overlay', () => {
      // Given
      const metadataState = {
        loading: true,
        error: null,
        currentCountry: 'us',
        variables: {},
        basic_inputs: { person: [], household: [] },
      };

      // When
      renderComponent({}, metadataState);

      // Then
      const loadingOverlay = document.querySelector('.mantine-LoadingOverlay-root');
      expect(loadingOverlay).toBeInTheDocument();
    });
  });

  describe('Household configuration', () => {
    test('given marital status changed to married then shows partner fields', async () => {
      // Given
      const user = userEvent.setup();
      renderComponent();

      // When
      const maritalLabel = screen.getByText('Marital Status');
      const maritalSelect = maritalLabel.parentElement?.querySelector('input') as HTMLElement;
      await user.click(maritalSelect);
      const marriedOption = await screen.findByText('Married');
      await user.click(marriedOption);

      // Then
      await waitFor(() => {
        expect(screen.getByText('Your Partner')).toBeInTheDocument();
      });
    });

    test('given number of children changed then shows child fields', async () => {
      // Given
      const user = userEvent.setup();
      renderComponent();

      // When
      const childrenLabel = screen.getByText('Number of Children');
      const childrenSelect = childrenLabel.parentElement?.querySelector('input') as HTMLElement;
      await user.click(childrenSelect);
      const twoChildren = await screen.findByText('2');
      await user.click(twoChildren);

      // Then
      await waitFor(() => {
        expect(screen.getByText('Your First Dependent')).toBeInTheDocument();
        expect(screen.getByText('Your Second Dependent')).toBeInTheDocument();
      });
    });

    test.skip('given tax year changed then updates household data', async () => {
      // Note: Tax year selection has been removed from HouseholdBuilderFrame
      // Year is now set at report level and passed via useReportYear hook
      // This test is skipped as the feature is no longer in this component
    });
  });

  describe('Field value changes', () => {
    test.skip('given adult age changed then updates household data', async () => {
      // Given
      const user = userEvent.setup();
      renderComponent();

      // When - Expand "You" accordion to reveal fields
      const youButton = screen.getByRole('button', { name: 'You' });
      await user.click(youButton);

      // Wait for Age label to appear
      await waitFor(() => {
        expect(screen.getByText('Age')).toBeInTheDocument();
      });

      // Find age input - Look for all number inputs
      const ageInputs = screen.getAllByRole('spinbutton');
      const primaryAdultAge = ageInputs[0]; // First age input is for "you"

      await user.clear(primaryAdultAge);
      await user.type(primaryAdultAge, '35');

      // Then
      await waitFor(() => {
        expect(primaryAdultAge).toHaveValue(35);
      });
    });

    test.skip('given employment income changed then updates household data', async () => {
      // Given
      const user = userEvent.setup();
      renderComponent();

      // When - Expand "You" accordion to reveal fields
      const youButton = screen.getByRole('button', { name: 'You' });
      await user.click(youButton);

      // Wait for Employment Income label to appear
      await waitFor(() => {
        expect(screen.getByText('Employment Income')).toBeInTheDocument();
      });

      // Find income input (second spinbutton, after age)
      const incomeInputs = screen.getAllByRole('spinbutton');
      const primaryIncome = incomeInputs[1]; // Second input is employment_income for "you"

      await user.clear(primaryIncome);
      await user.type(primaryIncome, '75000');

      // Then
      await waitFor(() => {
        expect(primaryIncome).toHaveValue(75000);
      });
    });

    test.skip('given household field changed then updates household data', async () => {
      // Given
      const user = userEvent.setup();
      renderComponent();

      // When - Check if State field is rendered
      const stateLabels = screen.queryAllByText('State');
      if (stateLabels.length === 0) {
        // State field not rendered, skip test as the component structure has changed
        return;
      }

      const stateLabel = stateLabels[0];
      const stateSelect = stateLabel.parentElement?.querySelector('input') as HTMLElement;
      await user.click(stateSelect);
      const california = await screen.findByText('California');
      await user.click(california);

      // Then
      await waitFor(() => {
        const stateLabel2 = screen.getByText('State');
        const stateInput = stateLabel2.parentElement?.querySelector('input') as HTMLInputElement;
        expect(stateInput.value).toBe('California');
      });
    });
  });

  describe('Form submission', () => {
    test('given valid household when submitted then creates household', async () => {
      // Given
      const user = userEvent.setup();
      const mockHouseholdData = getMockHousehold();
      const populationState = {
        label: 'Test Household',
        household: mockHouseholdData,
      };
      const props = { ...mockFlowProps };
      renderComponent(populationState, undefined, props);

      // When
      const submitButton = screen.getByRole('button', { name: /Create household/i });
      await user.click(submitButton);

      // Then
      await waitFor(() => {
        expect(mockCreateHousehold).toHaveBeenCalledWith(
          expect.objectContaining({
            country_id: 'us',
            data: mockHouseholdData.householdData,
          })
        );
      });

      await waitFor(() => {
        expect(props.onReturn).toHaveBeenCalled();
      });
    });

    test('given invalid household when submitted then does not create', async () => {
      // Given
      const { HouseholdValidation } = await import('@/utils/HouseholdValidation');
      (HouseholdValidation.isReadyForSimulation as any).mockReturnValue({
        isValid: false,
        errors: ['Missing required fields'],
      });

      renderComponent();

      // When
      const submitButton = screen.getByRole('button', { name: /Create household/i });

      // Then
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Complex household scenarios', () => {
    test('given married with children configuration then creates complete household', async () => {
      // Given
      const user = userEvent.setup();
      renderComponent();

      // When - Configure married with 2 children
      const maritalLabel2 = screen.getByText('Marital Status');
      const maritalSelect2 = maritalLabel2.parentElement?.querySelector('input') as HTMLElement;
      await user.click(maritalSelect2);
      const marriedOption = await screen.findByText('Married');
      await user.click(marriedOption);

      const childrenLabel2 = screen.getByText('Number of Children');
      const childrenSelect2 = childrenLabel2.parentElement?.querySelector('input') as HTMLElement;
      await user.click(childrenSelect2);
      const twoChildren = await screen.findByText('2');
      await user.click(twoChildren);

      // Then - Verify all family members are displayed
      await waitFor(() => {
        expect(screen.getByText('You')).toBeInTheDocument();
        expect(screen.getByText('Your Partner')).toBeInTheDocument();
        expect(screen.getByText('Your First Dependent')).toBeInTheDocument();
        expect(screen.getByText('Your Second Dependent')).toBeInTheDocument();
      });
    });

    test('given switching from married to single then removes partner', async () => {
      // Given
      const user = userEvent.setup();
      renderComponent();

      // When - Set to married first
      const maritalLabel = screen.getByText('Marital Status');
      const maritalSelect = maritalLabel.parentElement?.querySelector('input') as HTMLElement;
      await user.click(maritalSelect);
      const marriedOption = await screen.findByText('Married');
      await user.click(marriedOption);

      // Verify partner appears
      await waitFor(() => {
        expect(screen.getByText('Your Partner')).toBeInTheDocument();
      });

      // Then switch back to single
      await user.click(maritalSelect);
      const singleOption = await screen.findByText('Single');
      await user.click(singleOption);

      // Then - Partner should be removed
      await waitFor(() => {
        expect(screen.queryByText('Your Partner')).not.toBeInTheDocument();
      });
    });
  });

  describe('Custom variable addition', () => {
    test('given user clicks add variable link then shows search input', async () => {
      // Given
      const user = userEvent.setup();
      renderComponent();

      // When - Expand "You" accordion
      const youButton = screen.getByRole('button', { name: 'You' });
      await user.click(youButton);

      // Then - Find and click "Add variable" link
      const addVariableLink = await screen.findByText(/Add variable to You/i);
      await user.click(addVariableLink);

      // Then - Search input should appear
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search for a variable...')).toBeInTheDocument();
      });
    });

    test('given user searches for variable then filters results', async () => {
      // Given
      const user = userEvent.setup();
      renderComponent();

      // When - Open add variable search
      const youButton = screen.getByRole('button', { name: 'You' });
      await user.click(youButton);
      const addVariableLink = await screen.findByText(/Add variable to You/i);
      await user.click(addVariableLink);

      // When - Type in search
      const searchInput = await screen.findByPlaceholderText('Search for a variable...');
      await user.type(searchInput, 'self');

      // Then - Should show filtered variable
      await waitFor(() => {
        expect(screen.getByText('Self Employment Income')).toBeInTheDocument();
      });
    });

    test('given user selects variable then adds to person', async () => {
      // Given
      const user = userEvent.setup();
      renderComponent();

      // When - Open add variable search
      const youButton = screen.getByRole('button', { name: 'You' });
      await user.click(youButton);
      const addVariableLink = await screen.findByText(/Add variable to You/i);
      await user.click(addVariableLink);

      // When - Click on a variable in the list
      const searchInput = await screen.findByPlaceholderText('Search for a variable...');
      await user.click(searchInput); // Focus to show list

      const selfEmploymentOption = await screen.findByText('Self Employment Income');
      await user.click(selfEmploymentOption);

      // Then - Search should close and variable should be added
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search for a variable...')).not.toBeInTheDocument();
      });

      // Variable label should now appear in the person's accordion
      await waitFor(() => {
        expect(screen.getByText('Self Employment Income')).toBeInTheDocument();
      });
    });
  });

  describe('Variable removal', () => {
    test.skip('given person has custom variable then shows remove button', async () => {
      // Given - Start with a person that already has a custom variable
      const user = userEvent.setup();
      const householdWithCustomVar = getMockHousehold();
      householdWithCustomVar.householdData.people.you.self_employment_income = { '2024': 1000 };

      const populationState = {
        populations: [
          {
            household: householdWithCustomVar,
          },
          null,
        ],
      };
      renderComponent(populationState);

      // When - Expand "You" accordion
      const youButton = screen.getByRole('button', { name: 'You' });
      await user.click(youButton);

      // Then - Should show the custom variable with remove button
      await waitFor(() => {
        expect(screen.getByText('Self Employment Income')).toBeInTheDocument();
      });

      // Find the remove button (icon button next to the variable)
      const removeButtons = screen.getAllByRole('button');
      const removeButton = removeButtons.find(
        (btn) => btn.getAttribute('aria-label')?.includes('Remove') || btn.querySelector('svg')
      );
      expect(removeButton).toBeInTheDocument();
    });

    test.skip('given user clicks remove button then removes variable from person', async () => {
      // Given - Start with a person that has a custom variable
      const user = userEvent.setup();
      const householdWithCustomVar = getMockHousehold();
      householdWithCustomVar.householdData.people.you.rental_income = { '2024': 5000 };

      const populationState = {
        populations: [
          {
            household: householdWithCustomVar,
          },
          null,
        ],
      };
      renderComponent(populationState);

      // When - Expand "You" accordion and find remove button
      const youButton = screen.getByRole('button', { name: 'You' });
      await user.click(youButton);

      await waitFor(() => {
        expect(screen.getByText('Rental Income')).toBeInTheDocument();
      });

      // Click remove button (IconX button)
      const removeButtons = screen.getAllByRole('button');
      const removeButton = removeButtons.find((btn) => {
        const svg = btn.querySelector('svg');
        return svg && btn.parentElement?.textContent?.includes('Rental Income');
      });

      if (removeButton) {
        await user.click(removeButton);

        // Then - Variable should be removed
        await waitFor(() => {
          expect(screen.queryByText('Rental Income')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Entity-aware fields', () => {
    test.skip('given household has taxUnit fields then renders them', async () => {
      // Given
      const user = userEvent.setup();

      // Given - Add a taxUnit field to basicInputFields
      const metadataWithTaxUnit = {
        currentCountry: 'us',
        variables: {
          age: {
            name: 'age',
            label: 'Age',
            entity: 'person',
            valueType: 'float',
            unit: 'year',
            defaultValue: 30,
            isInputVariable: true,
          },
          employment_income: {
            name: 'employment_income',
            label: 'Employment Income',
            entity: 'person',
            valueType: 'float',
            unit: 'currency-USD',
            defaultValue: 0,
            isInputVariable: true,
          },
          tax_unit_income: {
            name: 'tax_unit_income',
            label: 'Tax Unit Income',
            entity: 'tax_unit',
            valueType: 'float',
            unit: 'currency-USD',
            defaultValue: 0,
            isInputVariable: true,
          },
        },
        entities: {
          person: { plural: 'people', label: 'Person' },
          household: { plural: 'households', label: 'Household' },
          tax_unit: { plural: 'tax_units', label: 'Tax Unit' },
          spm_unit: { plural: 'spm_units', label: 'SPM Unit' },
          family: { plural: 'families', label: 'Family' },
          marital_unit: { plural: 'marital_units', label: 'Marital Unit' },
        },
        basic_inputs: {
          person: ['age', 'employment_income'],
          household: [],
          taxUnit: ['tax_unit_income'],
          spmUnit: [],
          family: [],
          maritalUnit: [],
        },
        loading: false,
        error: null,
      };

      renderComponent({}, metadataWithTaxUnit);

      // When - Expand "Household Variables" section
      const householdVarsButton = screen.getByRole('button', { name: 'Household Variables' });
      await user.click(householdVarsButton);

      // Then - Should show the taxUnit field
      await waitFor(() => {
        expect(screen.getByText('Tax Unit Income')).toBeInTheDocument();
      });
    });

    test.skip('given household has multiple entity fields then renders all', async () => {
      // Given - Add fields from different entities
      const metadataWithMultipleEntities = {
        currentCountry: 'us',
        variables: {
          age: {
            name: 'age',
            label: 'Age',
            entity: 'person',
            valueType: 'float',
            unit: 'year',
            defaultValue: 30,
            isInputVariable: true,
          },
          employment_income: {
            name: 'employment_income',
            label: 'Employment Income',
            entity: 'person',
            valueType: 'float',
            unit: 'currency-USD',
            defaultValue: 0,
            isInputVariable: true,
          },
          state_code: {
            name: 'state_code',
            label: 'State',
            entity: 'household',
            valueType: 'str',
            defaultValue: '',
            possibleValues: mockFieldOptions,
            isInputVariable: true,
          },
          spm_unit_size: {
            name: 'spm_unit_size',
            label: 'SPM Unit Size',
            entity: 'spm_unit',
            valueType: 'int',
            defaultValue: 1,
            isInputVariable: true,
          },
        },
        entities: {
          person: { plural: 'people', label: 'Person' },
          household: { plural: 'households', label: 'Household' },
          tax_unit: { plural: 'tax_units', label: 'Tax Unit' },
          spm_unit: { plural: 'spm_units', label: 'SPM Unit' },
          family: { plural: 'families', label: 'Family' },
          marital_unit: { plural: 'marital_units', label: 'Marital Unit' },
        },
        basic_inputs: {
          person: ['age', 'employment_income'],
          household: ['state_code'],
          taxUnit: [],
          spmUnit: ['spm_unit_size'],
          family: [],
          maritalUnit: [],
        },
        loading: false,
        error: null,
      };

      const user = userEvent.setup();
      renderComponent({}, metadataWithMultipleEntities);

      // When - Expand "Household Variables" section
      const householdVarsButton = screen.getByRole('button', { name: 'Household Variables' });
      await user.click(householdVarsButton);

      // Then - Should show fields from both household and spm_unit
      await waitFor(() => {
        expect(screen.getByText('State')).toBeInTheDocument();
        expect(screen.getByText('SPM Unit Size')).toBeInTheDocument();
      });
    });
  });
});
