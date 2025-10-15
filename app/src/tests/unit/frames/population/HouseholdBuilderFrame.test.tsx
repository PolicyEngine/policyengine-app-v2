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

// Mock household utilities
vi.mock('@/utils/HouseholdBuilder', () => ({
  HouseholdBuilder: vi.fn().mockImplementation((_countryId, _taxYear) => ({
    build: vi.fn(() => getMockHousehold()),
    loadHousehold: vi.fn(),
    addAdult: vi.fn(),
    addChild: vi.fn(),
    removePerson: vi.fn(),
    setMaritalStatus: vi.fn(),
    assignToGroupEntity: vi.fn(),
  })),
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

// Mock metadata selectors
const mockBasicInputFields = {
  person: ['age', 'employment_income'],
  household: ['state_code'],
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
  isDropdownField: (field: string) => field === 'state_code',
  getFieldOptions: () => mockFieldOptions,
}));

// Mock useBackButton hook
const mockHandleBack = vi.fn();
vi.mock('@/hooks/useBackButton', () => ({
  useBackButton: vi.fn(() => ({ handleBack: mockHandleBack, canGoBack: false })),
}));

// Mock useCancelFlow
const mockHandleCancel = vi.fn();
vi.mock('@/hooks/useCancelFlow', () => ({
  useCancelFlow: vi.fn(() => ({ handleCancel: mockHandleCancel })),
}));

describe('HouseholdBuilderFrame', () => {
  let store: any;

  beforeEach(() => {
    mockHandleCancel.mockClear();
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
        age: { defaultValue: 30 },
        employment_income: { defaultValue: 0 },
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
      populations: [null, null],
      ...populationState,
    };
    const fullMetadataState = {
      loading: false,
      error: null,
      currentCountry: 'us',
      variables: {
        age: { defaultValue: 30 },
        employment_income: { defaultValue: 0 },
      },
      parameters: {},
      entities: {},
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
      expect(screen.getByText('Tax Year')).toBeInTheDocument();
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
        expect(screen.getByText('Child 1')).toBeInTheDocument();
        expect(screen.getByText('Child 2')).toBeInTheDocument();
      });
    });

    test('given tax year changed then updates household data', async () => {
      // Given
      const user = userEvent.setup();
      renderComponent();

      // When
      const taxYearLabel = screen.getByText('Tax Year');
      const taxYearSelect = taxYearLabel.parentElement?.querySelector('input') as HTMLElement;
      await user.click(taxYearSelect);
      const year2023 = await screen.findByText('2023');
      await user.click(year2023);

      // Then
      await waitFor(() => {
        const taxYearLabel = screen.getByText('Tax Year');
        const taxYearInput = taxYearLabel.parentElement?.querySelector('input') as HTMLInputElement;
        expect(taxYearInput.value).toBe('2023');
      });
    });
  });

  describe('Field value changes', () => {
    test('given adult age changed then updates household data', async () => {
      // Given
      const user = userEvent.setup();
      renderComponent();

      // When
      const ageInputs = screen.getAllByPlaceholderText('Age');
      const primaryAdultAge = ageInputs[0];

      await user.clear(primaryAdultAge);
      await user.type(primaryAdultAge, '35');

      // Then
      await waitFor(() => {
        expect(primaryAdultAge).toHaveValue('35');
      });
    });

    test('given employment income changed then updates household data', async () => {
      // Given
      const user = userEvent.setup();
      renderComponent();

      // When
      const incomeInputs = screen.getAllByPlaceholderText('Employment Income');
      const primaryIncome = incomeInputs[0];

      await user.clear(primaryIncome);
      await user.type(primaryIncome, '75000');

      // Then
      await waitFor(() => {
        const value = (primaryIncome as HTMLInputElement).value;
        expect(value).toContain('75'); // Check that the value contains 75
      });
    });

    test('given household field changed then updates household data', async () => {
      // Given
      const user = userEvent.setup();
      renderComponent();

      // When
      const stateLabel = screen.getByText('State');
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
        expect(screen.getByText('Child 1')).toBeInTheDocument();
        expect(screen.getByText('Child 2')).toBeInTheDocument();
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
});
