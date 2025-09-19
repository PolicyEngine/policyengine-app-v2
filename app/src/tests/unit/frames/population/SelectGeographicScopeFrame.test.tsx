import { configureStore } from '@reduxjs/toolkit';
import { screen, waitFor } from '@test-utils';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import SelectGeographicScopeFrame from '@/frames/population/SelectGeographicScopeFrame';
import metadataReducer from '@/reducers/metadataReducer';
import populationReducer from '@/reducers/populationReducer';
import reportReducer from '@/reducers/reportReducer';
import {
  GEOGRAPHIC_SCOPES,
  mockFlowProps,
  TEST_COUNTRIES,
} from '@/tests/fixtures/frames/populationMocks';

// Mock the regions data
vi.mock('@/mocks/regions', () => ({
  us_regions: {
    result: {
      economy_options: {
        region: [
          { name: 'us', label: 'United States' },
          { name: 'state/ca', label: 'California' },
          { name: 'state/ny', label: 'New York' },
          { name: 'state/tx', label: 'Texas' },
        ],
      },
    },
  },
  uk_regions: {
    result: {
      economy_options: {
        region: [
          { name: 'uk', label: 'United Kingdom' },
          { name: 'country/england', label: 'England' },
          { name: 'country/scotland', label: 'Scotland' },
          { name: 'constituency/london', label: 'London' },
          { name: 'constituency/manchester', label: 'Manchester' },
        ],
      },
    },
  },
}));

describe('SelectGeographicScopeFrame', () => {
  let store: any;
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (
    metadataState: Partial<any> = { currentCountry: TEST_COUNTRIES.US as string },
    props = mockFlowProps
  ) => {
    const fullMetadataState = {
      loading: false,
      error: null,
      currentCountry: TEST_COUNTRIES.US as string,
      variables: {},
      parameters: {},
      entities: {},
      variableModules: {},
      economyOptions: { region: [], time_period: [], datasets: [] },
      currentLawId: 0,
      basicInputs: [],
      modelledPolicies: { core: {}, filtered: {} },
      version: null,
      parameterTree: null,
      ...metadataState,
    };

    store = configureStore({
      reducer: {
        population: populationReducer,
        metadata: metadataReducer,
        report: reportReducer,
      },
      preloadedState: {
        population: {
          populations: [null, null] as [any, any],
        },
        metadata: fullMetadataState,
      },
    });

    return render(
      <Provider store={store}>
        <MantineProvider>
          <SelectGeographicScopeFrame {...props} />
        </MantineProvider>
      </Provider>
    );
  };

  describe('Component rendering', () => {
    test('given component loads then displays all scope options', () => {
      // When
      renderComponent();

      // Then
      expect(screen.getByRole('heading', { name: 'Select Scope' })).toBeInTheDocument();
      expect(screen.getByLabelText('National')).toBeInTheDocument();
      expect(screen.getByLabelText('State')).toBeInTheDocument();
      expect(screen.getByLabelText('Household')).toBeInTheDocument();
    });

    test('given initial state then national is selected by default', () => {
      // When
      renderComponent();

      // Then
      const nationalRadio = screen.getByLabelText('National') as HTMLInputElement;
      expect(nationalRadio.checked).toBe(true);
    });
  });

  describe('Scope selection', () => {
    test('given state scope selected then shows state dropdown for US', async () => {
      // Given
      renderComponent();

      // When
      const stateRadio = screen.getByLabelText('State');
      await user.click(stateRadio);

      // Then
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Pick a state')).toBeInTheDocument();
      });

      // And the dropdown should have US states
      const dropdown = screen.getByPlaceholderText('Pick a state');
      await user.click(dropdown);

      await waitFor(() => {
        expect(screen.getByText('California')).toBeInTheDocument();
        expect(screen.getByText('New York')).toBeInTheDocument();
        expect(screen.getByText('Texas')).toBeInTheDocument();
      });
    });

    test('given UK country and state scope then shows constituency options', async () => {
      // Given
      renderComponent({ currentCountry: TEST_COUNTRIES.UK });

      // When
      const stateRadio = screen.getByLabelText('State');
      await user.click(stateRadio);

      // Then - Shows UK country selector
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Pick a country')).toBeInTheDocument();
      });

      // Select a UK country
      const countryDropdown = screen.getByPlaceholderText('Pick a country');
      await user.click(countryDropdown);
      await waitFor(() => {
        expect(screen.getByText('England')).toBeInTheDocument();
        expect(screen.getByText('Scotland')).toBeInTheDocument();
      });

      await user.click(screen.getByText('England'));

      // Then shows constituency selector
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Pick a constituency')).toBeInTheDocument();
      });

      const constituencyDropdown = screen.getByPlaceholderText('Pick a constituency');
      await user.click(constituencyDropdown);

      await waitFor(() => {
        expect(screen.getByText('London')).toBeInTheDocument();
        expect(screen.getByText('Manchester')).toBeInTheDocument();
      });
    });

    test('given household scope selected then hides region selectors', async () => {
      // Given
      renderComponent();

      // First select state to show dropdown
      const stateRadio = screen.getByLabelText('State');
      await user.click(stateRadio);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Pick a state')).toBeInTheDocument();
      });

      // When - Switch to household
      const householdRadio = screen.getByLabelText('Household');
      await user.click(householdRadio);

      // Then - Dropdown should be hidden
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Pick a state')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form submission', () => {
    test('given national scope when submitted then creates national geography', async () => {
      // Given
      const props = { ...mockFlowProps };
      renderComponent(undefined, props);

      // When
      const submitButton = screen.getByRole('button', { name: /Select Scope/i });
      await user.click(submitButton);

      // Then
      expect(props.onNavigate).toHaveBeenCalledWith(GEOGRAPHIC_SCOPES.NATIONAL);

      // Verify Redux action was dispatched
      const state = store.getState();
      expect(state.population.populations[0]?.geography).toEqual(
        expect.objectContaining({
          id: TEST_COUNTRIES.US,
          countryId: TEST_COUNTRIES.US,
          scope: 'national',
          geographyId: TEST_COUNTRIES.US,
        })
      );
    });

    test('given state scope with selected region when submitted then creates subnational geography', async () => {
      // Given
      const props = { ...mockFlowProps };
      renderComponent(undefined, props);

      // When
      const stateRadio = screen.getByLabelText('State');
      await user.click(stateRadio);

      const dropdown = await screen.findByPlaceholderText('Pick a state');
      await user.click(dropdown);

      const california = await screen.findByText('California');
      await user.click(california);

      const submitButton = screen.getByRole('button', { name: /Select Scope/i });
      await user.click(submitButton);

      // Then
      expect(props.onNavigate).toHaveBeenCalledWith(GEOGRAPHIC_SCOPES.STATE);

      const state = store.getState();
      expect(state.population.populations[0]?.geography).toEqual(
        expect.objectContaining({
          id: `${TEST_COUNTRIES.US}-ca`,
          countryId: TEST_COUNTRIES.US,
          scope: 'subnational',
          geographyId: 'ca',
        })
      );
    });

    test('given state scope without region selected when submitted then does not navigate', async () => {
      // Given
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const props = { ...mockFlowProps };
      renderComponent(undefined, props);

      // When
      const stateRadio = screen.getByLabelText('State');
      await user.click(stateRadio);

      const submitButton = screen.getByRole('button', { name: /Select Scope/i });
      await user.click(submitButton);

      // Then
      expect(props.onNavigate).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('State selected but no region chosen');

      consoleSpy.mockRestore();
    });

    test('given household scope when submitted then navigates without creating geography', async () => {
      // Given
      const props = { ...mockFlowProps };
      renderComponent(undefined, props);

      // When
      const householdRadio = screen.getByLabelText('Household');
      await user.click(householdRadio);

      const submitButton = screen.getByRole('button', { name: /Select Scope/i });
      await user.click(submitButton);

      // Then
      expect(props.onNavigate).toHaveBeenCalledWith(GEOGRAPHIC_SCOPES.HOUSEHOLD);

      // Geography should not be set for household scope
      const state = store.getState();
      expect(state.population.populations[0]?.geography).toBeNull();
    });
  });

  describe('Region value extraction', () => {
    test('given region with slash prefix when submitted then extracts correct value', async () => {
      // Given
      const props = { ...mockFlowProps };
      renderComponent(undefined, props);

      // When
      const stateRadio = screen.getByLabelText('State');
      await user.click(stateRadio);

      const dropdown = await screen.findByPlaceholderText('Pick a state');
      await user.click(dropdown);

      // Select state/ca which should extract to 'ca'
      const california = await screen.findByText('California');
      await user.click(california);

      const submitButton = screen.getByRole('button', { name: /Select Scope/i });
      await user.click(submitButton);

      // Then
      const state = store.getState();
      expect(state.population.populations[0]?.geography?.geographyId).toBe('ca'); // Not 'state/ca'
    });

    test('given UK constituency when submitted then extracts constituency name', async () => {
      // Given
      const props = { ...mockFlowProps };
      renderComponent({ currentCountry: TEST_COUNTRIES.UK }, props);

      // When
      const stateRadio = screen.getByLabelText('State');
      await user.click(stateRadio);

      // Select UK country
      const countryDropdown = await screen.findByPlaceholderText('Pick a country');
      await user.click(countryDropdown);
      const england = await screen.findByText('England');
      await user.click(england);

      // Select constituency
      const constituencyDropdown = await screen.findByPlaceholderText('Pick a constituency');
      await user.click(constituencyDropdown);
      const london = await screen.findByText('London');
      await user.click(london);

      const submitButton = screen.getByRole('button', { name: /Select Scope/i });
      await user.click(submitButton);

      // Then
      const state = store.getState();
      expect(state.population.populations[0]?.geography?.geographyId).toBe('london'); // Not 'constituency/london'
    });
  });

  describe('Country-specific behavior', () => {
    test('given no metadata country then defaults to US', () => {
      // Given
      renderComponent({ currentCountry: null });

      // When
      const stateRadio = screen.getByLabelText('State');
      stateRadio.click();

      // Then - Should show US states
      waitFor(() => {
        expect(screen.getByPlaceholderText('Pick a state')).toBeInTheDocument();
      });
    });

    test('given unknown country then defaults to US behavior', () => {
      // Given
      renderComponent({ currentCountry: 'ca' }); // Canada not implemented

      // When
      const stateRadio = screen.getByLabelText('State');
      stateRadio.click();

      // Then - Should show US states as fallback
      waitFor(() => {
        expect(screen.getByPlaceholderText('Pick a state')).toBeInTheDocument();
      });
    });
  });
});
