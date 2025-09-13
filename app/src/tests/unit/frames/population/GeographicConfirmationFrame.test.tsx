import { configureStore } from '@reduxjs/toolkit';
import { screen, waitFor } from '@test-utils';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import GeographicConfirmationFrame from '@/frames/population/GeographicConfirmationFrame';
import metadataReducer from '@/reducers/metadataReducer';
import populationReducer from '@/reducers/populationReducer';
import {
  mockFlowProps,
  mockGeographicAssociation,
  mockNationalGeography,
  mockStateGeography,
  TEST_COUNTRIES,
  TEST_USER_ID,
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
        ],
      },
    },
  },
  uk_regions: {
    result: {
      economy_options: {
        region: [
          { name: 'uk', label: 'United Kingdom' },
          { name: 'constituency/london', label: 'London' },
        ],
      },
    },
  },
}));

// Mock constants
vi.mock('@/constants', () => ({
  MOCK_USER_ID: 'test-user-123',
}));

// Mock hooks
const mockCreateGeographicAssociation = vi.fn();
const mockResetIngredient = vi.fn();

vi.mock('@/hooks/useUserGeographic', () => ({
  useCreateGeographicAssociation: () => ({
    mutateAsync: mockCreateGeographicAssociation,
    isPending: false,
  }),
}));

vi.mock('@/hooks/useIngredientReset', () => ({
  useIngredientReset: () => ({
    resetIngredient: mockResetIngredient,
  }),
}));

describe('GeographicConfirmationFrame', () => {
  let store: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateGeographicAssociation.mockResolvedValue(mockGeographicAssociation);
  });

  const renderComponent = (
    populationState: any = {},
    metadataState: Partial<any> = { currentCountry: TEST_COUNTRIES.US },
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
      economyOptions: {
        region: [
          { name: 'us', label: 'United States' },
          { name: 'state/ca', label: 'California' },
          { name: 'state/ny', label: 'New York' },
          { name: 'uk', label: 'United Kingdom' },
          { name: 'constituency/london', label: 'London' },
        ],
        time_period: [],
        datasets: [],
      },
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
      },
      preloadedState: {
        population: populationState,
        metadata: fullMetadataState,
      },
    });

    return render(
      <Provider store={store}>
        <MantineProvider>
          <GeographicConfirmationFrame {...props} />
        </MantineProvider>
      </Provider>
    );
  };

  describe('National geography', () => {
    test('given national geography then displays correct country information', () => {
      // Given
      const populationState = {
        geography: mockNationalGeography,
      };

      // When
      renderComponent(populationState);

      // Then
      expect(screen.getByText('Confirm Geographic Selection')).toBeInTheDocument();
      expect(screen.getByText('National')).toBeInTheDocument();
      expect(screen.getByText('United States')).toBeInTheDocument();
    });

    test('given UK national geography then displays United Kingdom', () => {
      // Given
      const populationState = {
        geography: {
          ...mockNationalGeography,
          id: TEST_COUNTRIES.UK,
          countryId: TEST_COUNTRIES.UK,
          geographyId: TEST_COUNTRIES.UK,
        },
      };

      // When
      renderComponent(populationState, { currentCountry: TEST_COUNTRIES.UK });

      // Then
      expect(screen.getByText('United Kingdom')).toBeInTheDocument();
    });
  });

  describe('Subnational geography', () => {
    test('given state geography then displays state information', () => {
      // Given
      const populationState = {
        geography: mockStateGeography,
      };

      // When
      renderComponent(populationState);

      // Then
      expect(screen.getByText('Confirm Geographic Selection')).toBeInTheDocument();
      expect(screen.getByText('State')).toBeInTheDocument();
      expect(screen.getByText('California')).toBeInTheDocument();
    });

    test('given UK constituency then displays constituency information', () => {
      // Given
      const populationState = {
        geography: {
          id: `${TEST_COUNTRIES.UK}-london`,
          countryId: TEST_COUNTRIES.UK,
          scope: 'subnational',
          geographyId: 'london',
        },
      };

      // When
      renderComponent(populationState, { currentCountry: TEST_COUNTRIES.UK });

      // Then
      expect(screen.getByText('Constituency')).toBeInTheDocument();
      expect(screen.getByText('London')).toBeInTheDocument();
    });
  });

  describe('Submission handling', () => {
    test('given valid national geography when submitted then creates association and updates state', async () => {
      // Given
      const populationState = {
        geography: mockNationalGeography,
        label: 'Test National',
      };
      const props = { ...mockFlowProps };
      renderComponent(populationState, undefined, props);

      // When
      const submitButton = screen.getByRole('button', { name: /Create Geographic Association/i });
      submitButton.click();

      // Then
      await waitFor(() => {
        expect(mockCreateGeographicAssociation).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: TEST_USER_ID,
            countryId: TEST_COUNTRIES.US,
            scope: 'national',
            geographyId: TEST_COUNTRIES.US,
            label: 'Test National',
          })
        );
      });

      await waitFor(() => {
        expect(props.onReturn).toHaveBeenCalled();
      });
    });

    test('given subnational geography when submitted then creates correct association', async () => {
      // Given
      const populationState = {
        geography: mockStateGeography,
        label: 'Test State',
      };
      renderComponent(populationState);

      // When
      const submitButton = screen.getByRole('button', { name: /Create Geographic Association/i });
      submitButton.click();

      // Then
      await waitFor(() => {
        expect(mockCreateGeographicAssociation).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: TEST_USER_ID,
            countryId: TEST_COUNTRIES.US,
            scope: 'subnational',
            geographyId: 'ca',
            label: 'Test State',
          })
        );
      });
    });

    test('given standalone flow when submitted then resets ingredient', async () => {
      // Given
      const populationState = {
        geography: mockNationalGeography,
      };
      const props = { ...mockFlowProps, isInSubflow: false };
      renderComponent(populationState, undefined, props);

      // When
      const submitButton = screen.getByRole('button', { name: /Create Geographic Association/i });
      submitButton.click();

      // Then
      await waitFor(() => {
        expect(mockResetIngredient).toHaveBeenCalledWith('population');
      });
    });

    test('given subflow when submitted then does not reset ingredient', async () => {
      // Given
      const populationState = {
        geography: mockNationalGeography,
      };
      const props = { ...mockFlowProps, isInSubflow: true };
      renderComponent(populationState, undefined, props);

      // When
      const submitButton = screen.getByRole('button', { name: /Create Geographic Association/i });
      submitButton.click();

      // Then
      await waitFor(() => {
        expect(mockCreateGeographicAssociation).toHaveBeenCalled();
      });
      expect(mockResetIngredient).not.toHaveBeenCalled();
    });

    test('given API error when submitted then logs error', async () => {
      // Given
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockCreateGeographicAssociation.mockRejectedValue(new Error('API Error'));
      const populationState = {
        geography: mockNationalGeography,
      };
      renderComponent(populationState);

      // When
      const submitButton = screen.getByRole('button', { name: /Create Geographic Association/i });
      submitButton.click();

      // Then
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to create geographic association:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Edge cases', () => {
    test('given unknown region code then displays raw code', () => {
      // Given
      const populationState = {
        geography: {
          ...mockStateGeography,
          geographyId: 'unknown-region',
        },
      };

      // When
      renderComponent(populationState);

      // Then
      expect(screen.getByText('unknown-region')).toBeInTheDocument();
    });

    test('given no onReturn prop when submitted then navigates to __return__', async () => {
      // Given
      const populationState = {
        geography: mockNationalGeography,
      };
      const mockOnNavigate = vi.fn();
      const props = {
        ...mockFlowProps,
        onReturn: undefined as any, // Testing edge case where onReturn is not provided
        onNavigate: mockOnNavigate,
      };
      renderComponent(populationState, undefined, props);

      // When
      const submitButton = screen.getByRole('button', { name: /Create Geographic Association/i });
      submitButton.click();

      // Then
      await waitFor(() => {
        expect(mockOnNavigate).toHaveBeenCalledWith('__return__');
      });
    });

    test('given missing metadata country then defaults to us', () => {
      // Given
      const populationState = {
        geography: mockNationalGeography,
      };

      // When
      renderComponent(populationState, { currentCountry: null });

      // Then
      expect(screen.getByText('United States')).toBeInTheDocument();
    });
  });
});
