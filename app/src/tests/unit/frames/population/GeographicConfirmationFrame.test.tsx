import { configureStore } from '@reduxjs/toolkit';
import { screen, waitFor } from '@test-utils';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import GeographicConfirmationFrame from '@/frames/population/GeographicConfirmationFrame';
import metadataReducer from '@/reducers/metadataReducer';
import populationReducer from '@/reducers/populationReducer';
import reportReducer from '@/reducers/reportReducer';
import {
  mockFlowProps,
  mockGeographicAssociation,
  mockNationalGeography,
  mockStateGeography,
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
  CURRENT_YEAR: '2025',
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
    // Use position-based structure for populations
    const basePopulationState = {
      populations: [populationState, null], // Population at position 0
    };
    const fullMetadataState = {
      loading: false,
      error: null,
      currentCountry: TEST_COUNTRIES.US,
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
        metadata: metadataReducer,
      },
      preloadedState: {
        population: basePopulationState as any,
        metadata: fullMetadataState,
        report: reportState as any,
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
    test('given national geography then displays correct country information', async () => {
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
      const user = userEvent.setup();
      const populationState = {
        geography: mockNationalGeography,
        label: 'Test National Population',
      };
      renderComponent(populationState);

      // When
      const submitButton = screen.getByRole('button', { name: /Create Geographic Association/i });
      await user.click(submitButton);

      // Then
      await waitFor(() => {
        expect(mockCreateGeographicAssociation).toHaveBeenCalledWith(
          expect.objectContaining({
            countryId: TEST_COUNTRIES.US,
            scope: 'national',
            label: 'Test National Population',
          })
        );
      });
    });

    test('given subnational geography when submitted then creates correct association', async () => {
      // Given
      const user = userEvent.setup();
      const populationState = {
        geography: mockStateGeography,
        label: 'California Population',
      };
      renderComponent(populationState);

      // When
      const submitButton = screen.getByRole('button', { name: /Create Geographic Association/i });
      await user.click(submitButton);

      // Then
      await waitFor(() => {
        expect(mockCreateGeographicAssociation).toHaveBeenCalledWith(
          expect.objectContaining({
            countryId: TEST_COUNTRIES.US,
            scope: 'subnational',
            geographyId: 'ca',
            label: 'California Population',
          })
        );
      });
    });

    test('given standalone flow when submitted then resets ingredient', async () => {
      // Given
      const user = userEvent.setup();
      const populationState = {
        geography: mockNationalGeography,
      };
      renderComponent(populationState, {}, { ...mockFlowProps, isInSubflow: false });

      // When
      const submitButton = screen.getByRole('button', { name: /Create Geographic Association/i });
      await user.click(submitButton);

      // Then
      await waitFor(() => {
        expect(mockResetIngredient).toHaveBeenCalledWith('population');
      });
    });

    test('given subflow when submitted then does not reset ingredient', async () => {
      // Given
      const user = userEvent.setup();
      const populationState = {
        geography: mockNationalGeography,
      };
      renderComponent(populationState, {}, { ...mockFlowProps, isInSubflow: true });

      // When
      const submitButton = screen.getByRole('button', { name: /Create Geographic Association/i });
      await user.click(submitButton);

      // Then
      await waitFor(() => {
        expect(mockCreateGeographicAssociation).toHaveBeenCalled();
        expect(mockResetIngredient).not.toHaveBeenCalled();
      });
    });

    test('given API error when submitted then logs error', async () => {
      // Given
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockCreateGeographicAssociation.mockRejectedValueOnce(new Error('API Error'));

      const user = userEvent.setup();
      const populationState = {
        geography: mockNationalGeography,
      };
      renderComponent(populationState);

      // When
      const submitButton = screen.getByRole('button', { name: /Create Geographic Association/i });
      await user.click(submitButton);

      // Then
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to create geographic association:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
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

    test('given onReturn prop when submitted then calls onReturn', async () => {
      // Given
      const user = userEvent.setup();
      const mockOnNavigate = vi.fn();
      const mockOnReturn = vi.fn();
      const populationState = {
        geography: mockNationalGeography,
      };
      renderComponent(
        populationState,
        {},
        {
          ...mockFlowProps,
          onNavigate: mockOnNavigate,
          onReturn: mockOnReturn,
        }
      );

      // When
      const submitButton = screen.getByRole('button', { name: /Create Geographic Association/i });
      await user.click(submitButton);

      // Then
      await waitFor(() => {
        expect(mockOnReturn).toHaveBeenCalled();
        expect(mockOnNavigate).not.toHaveBeenCalledWith('__return__');
      });
    });

    test('given missing metadata country then defaults to us', () => {
      // Given
      const populationState = {
        geography: {
          ...mockNationalGeography,
          countryId: 'us', // Keep countryId
        },
      };

      // When - render without country in metadata
      renderComponent(populationState, { currentCountry: undefined });

      // Then - should still display United States (from geography)
      expect(screen.getByText('United States')).toBeInTheDocument();
    });
  });
});
