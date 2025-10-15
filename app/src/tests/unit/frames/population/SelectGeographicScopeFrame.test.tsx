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
import {
  formatUSGeographyId,
  formatDefaultGeographyId,
  formatGeographyId,
  formatDisplayId,
} from '@/frames/population/SelectGeographicScopeFrame';
import {
  TEST_COUNTRIES as GEO_TEST_COUNTRIES,
  TEST_SCOPES,
  US_STATES,
  UK_REGIONS,
  EXPECTED_GEOGRAPHY_IDS,
  EXPECTED_DISPLAY_IDS,
  EDGE_CASES,
} from '@/tests/fixtures/frames/population/geographyConstants';
import { mockMetadataState } from '@/tests/fixtures/frames/population/SelectGeographicScopeFrameMocks';

// Mock the regions data
// Note: vi.mock is hoisted, so we must inline the data here
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
    metadataState: Partial<any> = { currentCountry: TEST_COUNTRIES.US },
    props = mockFlowProps
  ) => {
    const fullMetadataState = {
      ...mockMetadataState,
      currentCountry: TEST_COUNTRIES.US,
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
      expect(screen.getByRole('heading', { name: 'Select scope' })).toBeInTheDocument();
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

    test('given UK country and country scope then shows country dropdown', async () => {
      // Given
      renderComponent({ currentCountry: TEST_COUNTRIES.UK });

      // When - Select "Country" radio button
      const countryRadio = screen.getByLabelText('Country');
      await user.click(countryRadio);

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
    });

    test('given UK country and constituency scope then shows constituency dropdown', async () => {
      // Given
      renderComponent({ currentCountry: TEST_COUNTRIES.UK });

      // When - Select "Parliamentary constituency" radio button
      const constituencyRadio = screen.getByLabelText('Parliamentary constituency');
      await user.click(constituencyRadio);

      // Then shows constituency selector
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search for a constituency')).toBeInTheDocument();
      });

      const constituencyDropdown = screen.getByPlaceholderText('Search for a constituency');
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

      // When - National is selected by default for US
      const submitButton = screen.getByRole('button', { name: /Select scope/i });
      await user.click(submitButton);

      // Then - Should navigate with 'state' (the navTarget logic returns 'state' for non-household)
      expect(props.onNavigate).toHaveBeenCalledWith(GEOGRAPHIC_SCOPES.STATE);

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

      const submitButton = screen.getByRole('button', { name: /Select scope/i });
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

      const submitButton = screen.getByRole('button', { name: /Select scope/i });
      await user.click(submitButton);

      // Then
      expect(props.onNavigate).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('State selected but no state chosen');

      consoleSpy.mockRestore();
    });

    test('given household scope when submitted then navigates without creating geography', async () => {
      // Given
      const props = { ...mockFlowProps };
      renderComponent(undefined, props);

      // When
      const householdRadio = screen.getByLabelText('Household');
      await user.click(householdRadio);

      const submitButton = screen.getByRole('button', { name: /Select scope/i });
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

      const submitButton = screen.getByRole('button', { name: /Select scope/i });
      await user.click(submitButton);

      // Then
      const state = store.getState();
      expect(state.population.populations[0]?.geography?.geographyId).toBe('ca'); // Not 'state/ca'
    });

    test('given UK country when submitted then preserves full country path', async () => {
      // Given
      const props = { ...mockFlowProps };
      renderComponent({ currentCountry: TEST_COUNTRIES.UK }, props);

      // When - Select "Country" radio button
      const countryRadio = screen.getByLabelText('Country');
      await user.click(countryRadio);

      // Select country (countries are few, so they show up immediately)
      const countryDropdown = await screen.findByPlaceholderText('Pick a country');
      await user.click(countryDropdown);

      const scotland = await screen.findByText('Scotland');
      await user.click(scotland);

      const submitButton = screen.getByRole('button', { name: /Select scope/i });
      await user.click(submitButton);

      // Then - Should preserve full path with prefix
      const state = store.getState();
      expect(state.population.populations[0]?.geography?.geographyId).toBe('country/scotland');
    });
  });

  describe('Country-specific behavior', () => {
    test('given unknown country then shows no options', () => {
      // Given - Canada not implemented
      renderComponent({ currentCountry: 'ca' });

      // Then - Should not show any scope options
      expect(screen.queryByLabelText('National')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('State')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('UK-wide')).not.toBeInTheDocument();
    });
  });
});


describe('formatUSGeographyId', () => {
  test('given national scope then returns "us"', () => {
    // Given & When
    const result = formatUSGeographyId(GEO_TEST_COUNTRIES.US, TEST_SCOPES.NATIONAL);

    // Then
    expect(result).toBe(EXPECTED_GEOGRAPHY_IDS.US_NATIONAL);
  });

  test('given national scope with any value then returns "us"', () => {
    // Given & When
    const result = formatUSGeographyId('anything', TEST_SCOPES.NATIONAL);

    // Then
    expect(result).toBe(EXPECTED_GEOGRAPHY_IDS.US_NATIONAL);
  });

  test('given state code with prefix then extracts code', () => {
    // Given & When
    const resultCA = formatUSGeographyId(
      US_STATES.CALIFORNIA_WITH_PREFIX,
      TEST_SCOPES.SUBNATIONAL
    );
    const resultNY = formatUSGeographyId(
      US_STATES.NEW_YORK_WITH_PREFIX,
      TEST_SCOPES.SUBNATIONAL
    );
    const resultTX = formatUSGeographyId(US_STATES.TEXAS_WITH_PREFIX, TEST_SCOPES.SUBNATIONAL);

    // Then
    expect(resultCA).toBe(EXPECTED_GEOGRAPHY_IDS.US_CALIFORNIA);
    expect(resultNY).toBe(EXPECTED_GEOGRAPHY_IDS.US_NEW_YORK);
    expect(resultTX).toBe('tx');
  });

  test('given state code without prefix then returns as-is', () => {
    // Given & When
    const resultCA = formatUSGeographyId(
      US_STATES.CALIFORNIA_WITHOUT_PREFIX,
      TEST_SCOPES.SUBNATIONAL
    );
    const resultNY = formatUSGeographyId(
      US_STATES.NEW_YORK_WITHOUT_PREFIX,
      TEST_SCOPES.SUBNATIONAL
    );

    // Then
    expect(resultCA).toBe(EXPECTED_GEOGRAPHY_IDS.US_CALIFORNIA);
    expect(resultNY).toBe(EXPECTED_GEOGRAPHY_IDS.US_NEW_YORK);
  });

  test('given edge cases then handles gracefully', () => {
    // Given & When
    const trailingSlashResult = formatUSGeographyId(
      EDGE_CASES.TRAILING_SLASH,
      TEST_SCOPES.SUBNATIONAL
    );
    const justSlashResult = formatUSGeographyId(EDGE_CASES.JUST_SLASH, TEST_SCOPES.SUBNATIONAL);

    // Then
    // "state/" splits to ["state", ""] and pop() returns "" which is falsy, so fallback returns "state/"
    expect(trailingSlashResult).toBe(EDGE_CASES.TRAILING_SLASH);
    // "/" splits to ["", ""] and pop() returns "" which is falsy, so fallback returns "/"
    expect(justSlashResult).toBe(EDGE_CASES.JUST_SLASH);
  });
});

describe('formatDefaultGeographyId', () => {
  test('given UK national scope then returns "uk"', () => {
    // Given & When
    const result = formatDefaultGeographyId(
      GEO_TEST_COUNTRIES.UK,
      TEST_SCOPES.NATIONAL,
      GEO_TEST_COUNTRIES.UK
    );

    // Then
    expect(result).toBe(EXPECTED_GEOGRAPHY_IDS.UK_NATIONAL);
  });

  test('given UK national scope with any value then returns "uk"', () => {
    // Given & When
    const result = formatDefaultGeographyId('anything', TEST_SCOPES.NATIONAL, GEO_TEST_COUNTRIES.UK);

    // Then
    expect(result).toBe(EXPECTED_GEOGRAPHY_IDS.UK_NATIONAL);
  });

  test('given UK constituency path then keeps full path with prefix', () => {
    // Given & When
    const resultBrighton = formatDefaultGeographyId(
      UK_REGIONS.CONSTITUENCY_BRIGHTON,
      TEST_SCOPES.SUBNATIONAL,
      GEO_TEST_COUNTRIES.UK
    );
    const resultAldershot = formatDefaultGeographyId(
      UK_REGIONS.CONSTITUENCY_ALDERSHOT,
      TEST_SCOPES.SUBNATIONAL,
      GEO_TEST_COUNTRIES.UK
    );

    // Then
    expect(resultBrighton).toBe(EXPECTED_GEOGRAPHY_IDS.UK_CONSTITUENCY_BRIGHTON);
    expect(resultAldershot).toBe(EXPECTED_GEOGRAPHY_IDS.UK_CONSTITUENCY_ALDERSHOT);
  });

  test('given UK country path then keeps full path with prefix', () => {
    // Given & When
    const resultEngland = formatDefaultGeographyId(
      UK_REGIONS.COUNTRY_ENGLAND,
      TEST_SCOPES.SUBNATIONAL,
      GEO_TEST_COUNTRIES.UK
    );
    const resultScotland = formatDefaultGeographyId(
      UK_REGIONS.COUNTRY_SCOTLAND,
      TEST_SCOPES.SUBNATIONAL,
      GEO_TEST_COUNTRIES.UK
    );
    const resultWales = formatDefaultGeographyId(
      UK_REGIONS.COUNTRY_WALES,
      TEST_SCOPES.SUBNATIONAL,
      GEO_TEST_COUNTRIES.UK
    );
    const resultNI = formatDefaultGeographyId(
      UK_REGIONS.COUNTRY_NI,
      TEST_SCOPES.SUBNATIONAL,
      GEO_TEST_COUNTRIES.UK
    );

    // Then
    expect(resultEngland).toBe(UK_REGIONS.COUNTRY_ENGLAND);
    expect(resultScotland).toBe(EXPECTED_GEOGRAPHY_IDS.UK_COUNTRY_SCOTLAND);
    expect(resultWales).toBe(UK_REGIONS.COUNTRY_WALES);
    expect(resultNI).toBe(UK_REGIONS.COUNTRY_NI);
  });
});

describe('formatGeographyId', () => {
  test('given US country then delegates to formatUSGeographyId', () => {
    // Given & When
    const resultNational = formatGeographyId(
      GEO_TEST_COUNTRIES.US,
      GEO_TEST_COUNTRIES.US,
      TEST_SCOPES.NATIONAL
    );
    const resultState = formatGeographyId(
      GEO_TEST_COUNTRIES.US,
      US_STATES.CALIFORNIA_WITH_PREFIX,
      TEST_SCOPES.SUBNATIONAL
    );

    // Then
    expect(resultNational).toBe(EXPECTED_GEOGRAPHY_IDS.US_NATIONAL);
    expect(resultState).toBe(EXPECTED_GEOGRAPHY_IDS.US_CALIFORNIA);
  });

  test('given UK country then delegates to formatDefaultGeographyId', () => {
    // Given & When
    const resultNational = formatGeographyId(
      GEO_TEST_COUNTRIES.UK,
      GEO_TEST_COUNTRIES.UK,
      TEST_SCOPES.NATIONAL
    );
    const resultConstituency = formatGeographyId(
      GEO_TEST_COUNTRIES.UK,
      UK_REGIONS.CONSTITUENCY_BRIGHTON,
      TEST_SCOPES.SUBNATIONAL
    );
    const resultCountry = formatGeographyId(
      GEO_TEST_COUNTRIES.UK,
      UK_REGIONS.COUNTRY_SCOTLAND,
      TEST_SCOPES.SUBNATIONAL
    );

    // Then
    expect(resultNational).toBe(EXPECTED_GEOGRAPHY_IDS.UK_NATIONAL);
    expect(resultConstituency).toBe(EXPECTED_GEOGRAPHY_IDS.UK_CONSTITUENCY_BRIGHTON);
    expect(resultCountry).toBe(EXPECTED_GEOGRAPHY_IDS.UK_COUNTRY_SCOTLAND);
  });

  test('given unknown country then uses default formatting', () => {
    // Given & When
    const result = formatGeographyId(
      GEO_TEST_COUNTRIES.UNKNOWN,
      'province/ontario',
      TEST_SCOPES.SUBNATIONAL
    );

    // Then
    expect(result).toBe('province/ontario');
  });
});

describe('formatDisplayId', () => {
  test('given national scope then returns country ID', () => {
    // Given & When
    const resultUS = formatDisplayId(
      GEO_TEST_COUNTRIES.US,
      EXPECTED_GEOGRAPHY_IDS.US_NATIONAL,
      TEST_SCOPES.NATIONAL
    );
    const resultUK = formatDisplayId(
      GEO_TEST_COUNTRIES.UK,
      EXPECTED_GEOGRAPHY_IDS.UK_NATIONAL,
      TEST_SCOPES.NATIONAL
    );

    // Then
    expect(resultUS).toBe(EXPECTED_DISPLAY_IDS.US_NATIONAL);
    expect(resultUK).toBe(EXPECTED_DISPLAY_IDS.UK_NATIONAL);
  });

  test('given US state display IDs then formats correctly', () => {
    // Given & When
    const resultCA = formatDisplayId(
      GEO_TEST_COUNTRIES.US,
      EXPECTED_GEOGRAPHY_IDS.US_CALIFORNIA,
      TEST_SCOPES.SUBNATIONAL
    );
    const resultNY = formatDisplayId(
      GEO_TEST_COUNTRIES.US,
      EXPECTED_GEOGRAPHY_IDS.US_NEW_YORK,
      TEST_SCOPES.SUBNATIONAL
    );

    // Then
    expect(resultCA).toBe(EXPECTED_DISPLAY_IDS.US_CALIFORNIA);
    expect(resultNY).toBe(EXPECTED_DISPLAY_IDS.US_NEW_YORK);
  });

  test('given UK constituency then replaces slashes with hyphens', () => {
    // Given & When
    const resultBrighton = formatDisplayId(
      GEO_TEST_COUNTRIES.UK,
      EXPECTED_GEOGRAPHY_IDS.UK_CONSTITUENCY_BRIGHTON,
      TEST_SCOPES.SUBNATIONAL
    );
    const resultAldershot = formatDisplayId(
      GEO_TEST_COUNTRIES.UK,
      EXPECTED_GEOGRAPHY_IDS.UK_CONSTITUENCY_ALDERSHOT,
      TEST_SCOPES.SUBNATIONAL
    );

    // Then
    expect(resultBrighton).toBe(EXPECTED_DISPLAY_IDS.UK_CONSTITUENCY_BRIGHTON);
    expect(resultAldershot).toBe(EXPECTED_DISPLAY_IDS.UK_CONSTITUENCY_ALDERSHOT);
  });

  test('given UK country then replaces slashes with hyphens', () => {
    // Given & When
    const resultScotland = formatDisplayId(
      GEO_TEST_COUNTRIES.UK,
      EXPECTED_GEOGRAPHY_IDS.UK_COUNTRY_SCOTLAND,
      TEST_SCOPES.SUBNATIONAL
    );

    // Then
    expect(resultScotland).toBe(EXPECTED_DISPLAY_IDS.UK_COUNTRY_SCOTLAND);
  });

  test('given multiple slashes then replaces all with hyphens', () => {
    // Given & When
    const result = formatDisplayId(
      GEO_TEST_COUNTRIES.UK,
      EDGE_CASES.MULTIPLE_SLASHES,
      TEST_SCOPES.SUBNATIONAL
    );

    // Then
    expect(result).toBe('uk-country-region-subregion');
  });
});

describe('Integration: Full geography object creation', () => {
  test('given US state then produces correct geography IDs', () => {
    // Given
    const countryId = GEO_TEST_COUNTRIES.US;
    const selectedValue = US_STATES.CALIFORNIA_WITH_PREFIX;
    const scope = TEST_SCOPES.SUBNATIONAL;

    // When
    const geographyId = formatGeographyId(countryId, selectedValue, scope);
    const displayId = formatDisplayId(countryId, geographyId, scope);

    // Then
    expect(geographyId).toBe(EXPECTED_GEOGRAPHY_IDS.US_CALIFORNIA);
    expect(displayId).toBe(EXPECTED_DISPLAY_IDS.US_CALIFORNIA);
  });

  test('given UK constituency then produces correct geography IDs', () => {
    // Given
    const countryId = GEO_TEST_COUNTRIES.UK;
    const selectedValue = UK_REGIONS.CONSTITUENCY_BRIGHTON;
    const scope = TEST_SCOPES.SUBNATIONAL;

    // When
    const geographyId = formatGeographyId(countryId, selectedValue, scope);
    const displayId = formatDisplayId(countryId, geographyId, scope);

    // Then
    expect(geographyId).toBe(EXPECTED_GEOGRAPHY_IDS.UK_CONSTITUENCY_BRIGHTON);
    expect(displayId).toBe(EXPECTED_DISPLAY_IDS.UK_CONSTITUENCY_BRIGHTON);
  });

  test('given UK country then produces correct geography IDs', () => {
    // Given
    const countryId = GEO_TEST_COUNTRIES.UK;
    const selectedValue = UK_REGIONS.COUNTRY_SCOTLAND;
    const scope = TEST_SCOPES.SUBNATIONAL;

    // When
    const geographyId = formatGeographyId(countryId, selectedValue, scope);
    const displayId = formatDisplayId(countryId, geographyId, scope);

    // Then
    expect(geographyId).toBe(EXPECTED_GEOGRAPHY_IDS.UK_COUNTRY_SCOTLAND);
    expect(displayId).toBe(EXPECTED_DISPLAY_IDS.UK_COUNTRY_SCOTLAND);
  });

  test('given US national scope then produces correct geography IDs', () => {
    // Given
    const countryId = GEO_TEST_COUNTRIES.US;
    const selectedValue = GEO_TEST_COUNTRIES.US;
    const scope = TEST_SCOPES.NATIONAL;

    // When
    const geographyId = formatGeographyId(countryId, selectedValue, scope);
    const displayId = formatDisplayId(countryId, geographyId, scope);

    // Then
    expect(geographyId).toBe(EXPECTED_GEOGRAPHY_IDS.US_NATIONAL);
    expect(displayId).toBe(EXPECTED_DISPLAY_IDS.US_NATIONAL);
  });

  test('given UK national scope then produces correct geography IDs', () => {
    // Given
    const countryId = GEO_TEST_COUNTRIES.UK;
    const selectedValue = GEO_TEST_COUNTRIES.UK;
    const scope = TEST_SCOPES.NATIONAL;

    // When
    const geographyId = formatGeographyId(countryId, selectedValue, scope);
    const displayId = formatDisplayId(countryId, geographyId, scope);

    // Then
    expect(geographyId).toBe(EXPECTED_GEOGRAPHY_IDS.UK_NATIONAL);
    expect(displayId).toBe(EXPECTED_DISPLAY_IDS.UK_NATIONAL);
  });
});