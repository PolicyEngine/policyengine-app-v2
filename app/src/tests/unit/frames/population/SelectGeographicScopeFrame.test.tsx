import { configureStore } from '@reduxjs/toolkit';
import { screen, waitFor } from '@test-utils';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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

// Mock region data for tests
const mockUSRegions = [
  { name: 'us', label: 'United States' },
  { name: 'ca', label: 'California' },
  { name: 'ny', label: 'New York' },
  { name: 'tx', label: 'Texas' },
];

const mockUKRegions = [
  { name: 'uk', label: 'United Kingdom' },
  { name: 'country/england', label: 'England' },
  { name: 'country/scotland', label: 'Scotland' },
  { name: 'constituency/E14000639', label: 'Cities of London and Westminster' },
  { name: 'constituency/E14000973', label: 'Uxbridge and South Ruislip' },
];

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
    const countryId = metadataState.currentCountry || TEST_COUNTRIES.US;
    const regionData = countryId === TEST_COUNTRIES.UK ? mockUKRegions : mockUSRegions;

    const fullMetadataState = {
      loading: false,
      error: null,
      currentCountry: countryId as string,
      variables: {},
      parameters: {},
      entities: {},
      variableModules: {},
      economyOptions: { region: regionData, time_period: [], datasets: [] },
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

    // Use the country from metadata state for the router path
    const countryForRouter = fullMetadataState.currentCountry || TEST_COUNTRIES.US;

    return render(
      <Provider store={store}>
        <MantineProvider>
          <MemoryRouter initialEntries={[`/${countryForRouter}/populations`]}>
            <Routes>
              <Route path="/:countryId/*" element={<SelectGeographicScopeFrame {...props} />} />
            </Routes>
          </MemoryRouter>
        </MantineProvider>
      </Provider>
    );
  };

  describe('Component rendering', () => {
    test('given component loads then displays all scope options', () => {
      // When
      renderComponent();

      // Then
      expect(screen.getByRole('heading', { name: 'Select Household Scope' })).toBeInTheDocument();
      expect(screen.getByLabelText('All households nationally')).toBeInTheDocument();
      expect(screen.getByLabelText('All households in a state')).toBeInTheDocument();
      expect(screen.getByLabelText('Custom household')).toBeInTheDocument();
    });

    test('given initial state then national is selected by default', () => {
      // When
      renderComponent();

      // Then
      const nationalRadio = screen.getByLabelText('All households nationally') as HTMLInputElement;
      expect(nationalRadio.checked).toBe(true);
    });
  });

  describe('Scope selection', () => {
    test('given state scope selected then shows state dropdown for US', async () => {
      // Given
      renderComponent();

      // When
      const stateRadio = screen.getByLabelText('All households in a state');
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

    test('given UK then shows UK-wide, Country, Parliamentary Constituency, Household options', async () => {
      // Given
      renderComponent({ currentCountry: TEST_COUNTRIES.UK });

      // Then - Shows 4 UK options
      expect(screen.getByLabelText('All households UK-wide')).toBeInTheDocument();
      expect(screen.getByLabelText('All households in a country')).toBeInTheDocument();
      expect(screen.getByLabelText('All households in a constituency')).toBeInTheDocument();
      expect(screen.getByLabelText('Custom household')).toBeInTheDocument();
    });

    test('given UK Country selected then shows country dropdown', async () => {
      // Given
      renderComponent({ currentCountry: TEST_COUNTRIES.UK });

      // When
      const countryRadio = screen.getByLabelText('All households in a country');
      await user.click(countryRadio);

      // Then - Shows country selector
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Pick a country')).toBeInTheDocument();
      });

      const countryDropdown = screen.getByPlaceholderText('Pick a country');
      await user.click(countryDropdown);
      await waitFor(() => {
        expect(screen.getByText('England')).toBeInTheDocument();
        expect(screen.getByText('Scotland')).toBeInTheDocument();
      });
    });

    test('given UK Constituency selected then shows constituency dropdown', async () => {
      // Given
      renderComponent({ currentCountry: TEST_COUNTRIES.UK });

      // When
      const constituencyRadio = screen.getByLabelText('All households in a constituency');
      await user.click(constituencyRadio);

      // Then - Shows constituency selector
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Pick a constituency')).toBeInTheDocument();
      });

      const constituencyDropdown = screen.getByPlaceholderText('Pick a constituency');
      await user.click(constituencyDropdown);

      await waitFor(() => {
        expect(screen.getByText('Cities of London and Westminster')).toBeInTheDocument();
        expect(screen.getByText('Uxbridge and South Ruislip')).toBeInTheDocument();
      });
    });

    test('given household scope selected then hides region selectors', async () => {
      // Given
      renderComponent();

      // First select state to show dropdown
      const stateRadio = screen.getByLabelText('All households in a state');
      await user.click(stateRadio);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Pick a state')).toBeInTheDocument();
      });

      // When - Switch to household
      const householdRadio = screen.getByLabelText('Custom household');
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
      const stateRadio = screen.getByLabelText('All households in a state');
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
      const stateRadio = screen.getByLabelText('All households in a state');
      await user.click(stateRadio);

      const submitButton = screen.getByRole('button', { name: /Select Scope/i });
      await user.click(submitButton);

      // Then
      expect(props.onNavigate).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('state selected but no region chosen');

      consoleSpy.mockRestore();
    });

    test('given household scope when submitted then navigates without creating geography', async () => {
      // Given
      const props = { ...mockFlowProps };
      renderComponent(undefined, props);

      // When
      const householdRadio = screen.getByLabelText('Custom household');
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

  describe('Region value storage', () => {
    test('given US state when submitted then stores value without prefix', async () => {
      // Given
      const props = { ...mockFlowProps };
      renderComponent(undefined, props);

      // When
      const stateRadio = screen.getByLabelText('All households in a state');
      await user.click(stateRadio);

      const dropdown = await screen.findByPlaceholderText('Pick a state');
      await user.click(dropdown);

      const california = await screen.findByText('California');
      await user.click(california);

      const submitButton = screen.getByRole('button', { name: /Select Scope/i });
      await user.click(submitButton);

      // Then - US values stored without prefix
      const state = store.getState();
      expect(state.population.populations[0]?.geography?.geographyId).toBe('ca');
    });

    test('given UK constituency when submitted then stores full prefixed value', async () => {
      // Given
      const props = { ...mockFlowProps };
      renderComponent({ currentCountry: TEST_COUNTRIES.UK }, props);

      // When
      const constituencyRadio = screen.getByLabelText('All households in a constituency');
      await user.click(constituencyRadio);

      // Select constituency
      const constituencyDropdown = await screen.findByPlaceholderText('Pick a constituency');
      await user.click(constituencyDropdown);
      const constituency = await screen.findByText('Cities of London and Westminster');
      await user.click(constituency);

      const submitButton = screen.getByRole('button', { name: /Select Scope/i });
      await user.click(submitButton);

      // Then - Should store FULL prefixed value
      const state = store.getState();
      expect(state.population.populations[0]?.geography?.geographyId).toBe(
        'constituency/E14000639'
      );
    });

    test('given UK country when submitted then stores full prefixed value', async () => {
      // Given
      const props = { ...mockFlowProps };
      renderComponent({ currentCountry: TEST_COUNTRIES.UK }, props);

      // When
      const countryRadio = screen.getByLabelText('All households in a country');
      await user.click(countryRadio);

      // Select country
      const countryDropdown = await screen.findByPlaceholderText('Pick a country');
      await user.click(countryDropdown);
      const england = await screen.findByText('England');
      await user.click(england);

      const submitButton = screen.getByRole('button', { name: /Select Scope/i });
      await user.click(submitButton);

      // Then - Should store FULL prefixed value
      const state = store.getState();
      expect(state.population.populations[0]?.geography?.geographyId).toBe('country/england');
    });
  });

  describe('Country-specific behavior', () => {
    test('given no metadata country then defaults to US', () => {
      // Given
      renderComponent({ currentCountry: null });

      // When
      const stateRadio = screen.getByLabelText('All households in a state');
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
      const stateRadio = screen.getByLabelText('All households in a state');
      stateRadio.click();

      // Then - Should show US states as fallback
      waitFor(() => {
        expect(screen.getByPlaceholderText('Pick a state')).toBeInTheDocument();
      });
    });
  });
});
