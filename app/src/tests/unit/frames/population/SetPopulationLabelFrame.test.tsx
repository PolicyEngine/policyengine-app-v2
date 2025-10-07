import { configureStore } from '@reduxjs/toolkit';
import { screen } from '@test-utils';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { CURRENT_YEAR } from '@/constants';
import SetPopulationLabelFrame from '@/frames/population/SetPopulationLabelFrame';
import populationReducer from '@/reducers/populationReducer';
import reportReducer from '@/reducers/reportReducer';
import {
  getMockHousehold,
  LONG_LABEL,
  mockFlowProps,
  mockNationalGeography,
  mockStateGeography,
  TEST_POPULATION_LABEL,
  TEST_VALUES,
  UI_TEXT,
} from '@/tests/fixtures/frames/populationMocks';

describe('SetPopulationLabelFrame', () => {
  let store: any;
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (populationState: any = null, props = mockFlowProps) => {
    // Use position-based structure - population at position 0
    const basePopulationState = {
      populations: [populationState, null] as [any, any],
    };

    // Report reducer for position management
    const reportState = {
      mode: 'standalone' as const,
      activeSimulationPosition: 0 as 0 | 1,
      countryId: 'us',
      apiVersion: 'v1',
      simulationIds: [],
      status: 'idle' as const,
      output: null,
    };

    store = configureStore({
      reducer: {
        population: populationReducer,
        report: reportReducer,
        metadata: () => ({}),
      },
      preloadedState: {
        population: basePopulationState,
        report: reportState as any,
        metadata: {},
      },
    });

    return render(
      <Provider store={store}>
        <MantineProvider>
          <SetPopulationLabelFrame {...props} />
        </MantineProvider>
      </Provider>
    );
  };

  describe('Component rendering', () => {
    test('given component loads then displays label input form', () => {
      // When
      renderComponent();

      // Then
      expect(screen.getByText(UI_TEXT.NAME_POPULATION_TITLE)).toBeInTheDocument();
      expect(screen.getByText(UI_TEXT.POPULATION_LABEL)).toBeInTheDocument();
      expect(screen.getByText(UI_TEXT.LABEL_DESCRIPTION)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(UI_TEXT.LABEL_PLACEHOLDER)).toBeInTheDocument();
    });

    test('given existing label then pre-fills input', () => {
      // Given
      const populationState = {
        label: TEST_POPULATION_LABEL,
      };

      // When
      renderComponent(populationState);

      // Then
      const input = screen.getByPlaceholderText(UI_TEXT.LABEL_PLACEHOLDER) as HTMLInputElement;
      expect(input.value).toBe(TEST_POPULATION_LABEL);
    });
  });

  describe('Default labels', () => {
    test('given national geography then suggests National Population', () => {
      // Given
      const populationState = {
        geography: mockNationalGeography,
      };

      // When
      renderComponent(populationState);

      // Then
      const input = screen.getByPlaceholderText(UI_TEXT.LABEL_PLACEHOLDER) as HTMLInputElement;
      expect(input.value).toBe(UI_TEXT.DEFAULT_NATIONAL_LABEL);
    });

    test('given state geography then suggests state name population', () => {
      // Given
      const populationState = {
        geography: mockStateGeography,
      };

      // When
      renderComponent(populationState);

      // Then
      const input = screen.getByPlaceholderText(UI_TEXT.LABEL_PLACEHOLDER) as HTMLInputElement;
      expect(input.value).toBe(UI_TEXT.DEFAULT_STATE_LABEL('ca'));
    });

    test('given household then suggests Custom Household', () => {
      // Given
      const populationState = {
        household: getMockHousehold(),
      };

      // When
      renderComponent(populationState);

      // Then
      const input = screen.getByPlaceholderText(UI_TEXT.LABEL_PLACEHOLDER) as HTMLInputElement;
      expect(input.value).toBe(UI_TEXT.DEFAULT_HOUSEHOLD_LABEL);
    });

    test('given no population type then defaults to Custom Household', () => {
      // When
      renderComponent();

      // Then
      const input = screen.getByPlaceholderText(UI_TEXT.LABEL_PLACEHOLDER) as HTMLInputElement;
      expect(input.value).toBe(UI_TEXT.DEFAULT_HOUSEHOLD_LABEL);
    });
  });

  describe('Label validation', () => {
    test('given empty label when submitted then shows error', async () => {
      // Given
      renderComponent();
      const input = screen.getByPlaceholderText(UI_TEXT.LABEL_PLACEHOLDER);

      // When
      await user.clear(input);
      const submitButton = screen.getByRole('button', { name: UI_TEXT.CONTINUE_BUTTON });
      await user.click(submitButton);

      // Then
      expect(screen.getByText(UI_TEXT.ERROR_EMPTY_LABEL)).toBeInTheDocument();
    });

    test('given valid label when submitted then updates state', async () => {
      // Given
      renderComponent();
      const input = screen.getByPlaceholderText(UI_TEXT.LABEL_PLACEHOLDER);

      // When
      await user.clear(input);
      await user.type(input, TEST_VALUES.TEST_LABEL);
      const submitButton = screen.getByRole('button', { name: UI_TEXT.CONTINUE_BUTTON });
      await user.click(submitButton);

      // Then - verify state was updated
      const state = store.getState();
      expect(state.population.populations[0]?.label).toBe(TEST_VALUES.TEST_LABEL);
    });

    test('given label over 150 characters then truncates', async () => {
      // Given
      renderComponent();
      const input = screen.getByPlaceholderText(UI_TEXT.LABEL_PLACEHOLDER);

      // When
      await user.clear(input);
      await user.type(input, LONG_LABEL);

      // Then
      const inputElement = input as HTMLInputElement;
      expect(inputElement.value.length).toBeLessThanOrEqual(150);
    });
  });

  describe('Form submission', () => {
    test('given valid label with geography when submitted then navigates to geographic', async () => {
      // Given
      const mockOnNavigate = vi.fn();
      const populationState = {
        geography: mockNationalGeography,
      };
      renderComponent(populationState, { ...mockFlowProps, onNavigate: mockOnNavigate });

      const input = screen.getByPlaceholderText(UI_TEXT.LABEL_PLACEHOLDER);
      await user.clear(input);
      await user.type(input, 'My Population');

      // When
      const submitButton = screen.getByRole('button', { name: UI_TEXT.CONTINUE_BUTTON });
      await user.click(submitButton);

      // Then
      expect(mockOnNavigate).toHaveBeenCalledWith('geographic');
    });

    test('given valid label with household when submitted then navigates to household', async () => {
      // Given
      const mockOnNavigate = vi.fn();
      const populationState = {
        household: getMockHousehold(),
      };
      renderComponent(populationState, { ...mockFlowProps, onNavigate: mockOnNavigate });

      const input = screen.getByPlaceholderText(UI_TEXT.LABEL_PLACEHOLDER);
      await user.clear(input);
      await user.type(input, `My Family ${CURRENT_YEAR}`);

      // When
      const submitButton = screen.getByRole('button', { name: UI_TEXT.CONTINUE_BUTTON });
      await user.click(submitButton);

      // Then
      expect(mockOnNavigate).toHaveBeenCalledWith('household');
      const state = store.getState();
      expect(state.population.populations[0]?.label).toBe(`My Family ${CURRENT_YEAR}`);
    });

    test('given label with leading/trailing spaces when submitted then trims label', async () => {
      // Given
      renderComponent();
      const input = screen.getByPlaceholderText(UI_TEXT.LABEL_PLACEHOLDER);

      // When
      await user.clear(input);
      await user.type(input, '  Trimmed Label  ');
      const submitButton = screen.getByRole('button', { name: UI_TEXT.CONTINUE_BUTTON });
      await user.click(submitButton);

      // Then
      const state = store.getState();
      expect(state.population.populations[0]?.label).toBe('Trimmed Label');
    });
  });

  describe('Navigation', () => {
    test('given back button clicked then navigates to back', async () => {
      // Given
      const mockOnNavigate = vi.fn();
      renderComponent(null, { ...mockFlowProps, onNavigate: mockOnNavigate });

      // When
      const backButton = screen.getByRole('button', { name: /Back/i });
      await user.click(backButton);

      // Then
      expect(mockOnNavigate).toHaveBeenCalledWith('back');
    });
  });
});
