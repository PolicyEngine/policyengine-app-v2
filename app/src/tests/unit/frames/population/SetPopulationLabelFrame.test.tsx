import { configureStore } from '@reduxjs/toolkit';
import { screen } from '@test-utils';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import SetPopulationLabelFrame from '@/frames/population/SetPopulationLabelFrame';
import populationReducer from '@/reducers/populationReducer';
import {
  LONG_LABEL,
  mockFlowProps,
  mockHousehold,
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

  const renderComponent = (populationState = {}, props = mockFlowProps) => {
    store = configureStore({
      reducer: {
        population: populationReducer,
        metadata: () => ({}),
      },
      preloadedState: {
        population: populationState,
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
        household: mockHousehold,
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

    test('given whitespace-only label when submitted then shows error', async () => {
      // Given
      renderComponent();
      const input = screen.getByPlaceholderText(UI_TEXT.LABEL_PLACEHOLDER);

      // When
      await user.clear(input);
      await user.type(input, '   ');
      const submitButton = screen.getByRole('button', { name: UI_TEXT.CONTINUE_BUTTON });
      await user.click(submitButton);

      // Then
      expect(screen.getByText(UI_TEXT.ERROR_EMPTY_LABEL)).toBeInTheDocument();
    });

    test('given label over 100 characters when submitted then shows error', async () => {
      // Given
      renderComponent();
      const input = screen.getByPlaceholderText(UI_TEXT.LABEL_PLACEHOLDER);

      // When
      await user.clear(input);
      await user.type(input, LONG_LABEL);
      const submitButton = screen.getByRole('button', { name: UI_TEXT.CONTINUE_BUTTON });
      await user.click(submitButton);

      // Then
      expect(screen.getByText(UI_TEXT.ERROR_LONG_LABEL)).toBeInTheDocument();
    });

    test('given error shown when user types then clears error', async () => {
      // Given
      renderComponent();
      const input = screen.getByPlaceholderText(UI_TEXT.LABEL_PLACEHOLDER);

      // Create error first
      await user.clear(input);
      const submitButton = screen.getByRole('button', { name: UI_TEXT.CONTINUE_BUTTON });
      await user.click(submitButton);

      expect(screen.getByText(UI_TEXT.ERROR_EMPTY_LABEL)).toBeInTheDocument();

      // When - User starts typing
      await user.type(input, 'New Label');

      // Then - Error should be cleared
      expect(screen.queryByText(UI_TEXT.ERROR_EMPTY_LABEL)).not.toBeInTheDocument();
    });
  });

  describe('Form submission', () => {
    test('given valid label with geography when submitted then navigates to geographic', async () => {
      // Given
      const populationState = {
        geography: mockNationalGeography,
      };
      const props = { ...mockFlowProps };
      renderComponent(populationState, props);

      const input = screen.getByPlaceholderText(UI_TEXT.LABEL_PLACEHOLDER);
      await user.clear(input);
      await user.type(input, 'My National Population');

      // When
      const submitButton = screen.getByRole('button', { name: UI_TEXT.CONTINUE_BUTTON });
      await user.click(submitButton);

      // Then
      expect(props.onNavigate).toHaveBeenCalledWith('geographic');

      // Verify Redux action was dispatched
      const state = store.getState();
      expect(state.population.label).toBe('My National Population');
    });

    test('given valid label with household when submitted then navigates to household', async () => {
      // Given
      const populationState = {
        household: mockHousehold,
      };
      const props = { ...mockFlowProps };
      renderComponent(populationState, props);

      const input = screen.getByPlaceholderText(UI_TEXT.LABEL_PLACEHOLDER);
      await user.clear(input);
      await user.type(input, 'My Family 2024');

      // When
      const submitButton = screen.getByRole('button', { name: UI_TEXT.CONTINUE_BUTTON });
      await user.click(submitButton);

      // Then
      expect(props.onNavigate).toHaveBeenCalledWith('household');

      const state = store.getState();
      expect(state.population.label).toBe('My Family 2024');
    });

    test('given label with leading/trailing spaces when submitted then trims label', async () => {
      // Given
      const props = { ...mockFlowProps };
      renderComponent({}, props);

      const input = screen.getByPlaceholderText(UI_TEXT.LABEL_PLACEHOLDER);
      await user.clear(input);
      await user.type(input, '  Trimmed Label  ');

      // When
      const submitButton = screen.getByRole('button', { name: UI_TEXT.CONTINUE_BUTTON });
      await user.click(submitButton);

      // Then
      const state = store.getState();
      expect(state.population.label).toBe('Trimmed Label');
    });

    test('given no population type when submitted then defaults to household navigation', async () => {
      // Given - No geography or household set
      const props = { ...mockFlowProps };
      renderComponent({}, props);

      const input = screen.getByPlaceholderText(UI_TEXT.LABEL_PLACEHOLDER);
      await user.clear(input);
      await user.type(input, 'Default Population');

      // When
      const submitButton = screen.getByRole('button', { name: UI_TEXT.CONTINUE_BUTTON });
      await user.click(submitButton);

      // Then - Should navigate to household by default
      expect(props.onNavigate).toHaveBeenCalledWith('household');
    });
  });

  describe('Navigation', () => {
    test('given back button clicked then navigates back', async () => {
      // Given
      const props = { ...mockFlowProps };
      renderComponent({}, props);

      // When
      const backButton = screen.getByRole('button', { name: UI_TEXT.BACK_BUTTON });
      await user.click(backButton);

      // Then
      expect(props.onNavigate).toHaveBeenCalledWith('back');
    });
  });

  describe('Input constraints', () => {
    test('given input has maxLength attribute then limits to 100 characters', () => {
      // When
      renderComponent();

      // Then
      const input = screen.getByPlaceholderText(UI_TEXT.LABEL_PLACEHOLDER) as HTMLInputElement;
      expect(input.maxLength).toBe(TEST_VALUES.LABEL_MAX_LENGTH);
    });

    test('given input is required then has required attribute', () => {
      // When
      renderComponent();

      // Then
      const input = screen.getByPlaceholderText(UI_TEXT.LABEL_PLACEHOLDER) as HTMLInputElement;
      expect(input.required).toBe(true);
    });
  });

  describe('Help text', () => {
    test('given component rendered then shows help text', () => {
      // When
      renderComponent();

      // Then
      expect(screen.getByText(UI_TEXT.LABEL_HELP_TEXT)).toBeInTheDocument();
    });
  });
});
