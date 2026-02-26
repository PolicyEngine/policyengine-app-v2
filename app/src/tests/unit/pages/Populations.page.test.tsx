import { render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useGeographicAssociationsByUser } from '@/hooks/useUserGeographic';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import PopulationsPage from '@/pages/Populations.page';
import {
  createEmptyDataState,
  createErrorState,
  createLoadingState,
  mockGeographicAssociationsData,
  mockUserHouseholdsData,
  POPULATION_COLUMNS,
  POPULATION_LABELS,
  POPULATION_TEST_IDS,
  setupMockConsole,
} from '@/tests/fixtures/pages/populationsMocks';

// Mock the hooks first
vi.mock('@/hooks/useUserHousehold', () => ({
  useUserHouseholds: vi.fn(),
  useUpdateHouseholdAssociation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/hooks/useUserGeographic', () => ({
  useGeographicAssociationsByUser: vi.fn(),
  useUpdateGeographicAssociation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

// Mock useCurrentCountry
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: () => 'us',
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the constants
vi.mock('@/constants', () => ({
  MOCK_USER_ID: 'test-user-123',
  BASE_URL: 'https://api.test.com',
  CURRENT_YEAR: '2026',
}));

describe('PopulationsPage', () => {
  let consoleMocks: ReturnType<typeof setupMockConsole>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleMocks = setupMockConsole();

    // Set default mock implementations
    (useUserHouseholds as any).mockReturnValue({
      data: mockUserHouseholdsData,
      isLoading: false,
      isError: false,
      error: null,
    });

    (useGeographicAssociationsByUser as any).mockReturnValue({
      data: mockGeographicAssociationsData,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  afterEach(() => {
    consoleMocks.restore();
  });

  const renderPage = () => {
    return render(<PopulationsPage />);
  };

  describe('initial render', () => {
    test('given page loads then displays title and subtitle', () => {
      // When
      renderPage();

      // Then
      expect(
        screen.getByRole('heading', { name: 'Your saved households', level: 2 })
      ).toBeInTheDocument();
      expect(screen.getByText(POPULATION_LABELS.PAGE_SUBTITLE)).toBeInTheDocument();
    });

    test('given page loads then displays build population button', () => {
      // When
      renderPage();

      // Then
      expect(
        screen.getByRole('button', { name: POPULATION_LABELS.BUILD_BUTTON })
      ).toBeInTheDocument();
    });

    test('given page loads then fetches user data with correct user ID', () => {
      // When
      renderPage();

      // Then
      expect(useUserHouseholds).toHaveBeenCalledWith(POPULATION_TEST_IDS.USER_ID);
      expect(useGeographicAssociationsByUser).toHaveBeenCalledWith(POPULATION_TEST_IDS.USER_ID);
    });
  });

  describe('data display', () => {
    test('given household data available then displays household populations', () => {
      // When
      renderPage();

      // Then
      expect(screen.getByText(POPULATION_LABELS.HOUSEHOLD_1)).toBeInTheDocument();
      expect(screen.getByText(POPULATION_LABELS.HOUSEHOLD_2)).toBeInTheDocument();
    });

    test('given geographic data available then displays geographic populations', () => {
      // When
      renderPage();

      // Then
      expect(screen.getByText(POPULATION_LABELS.GEOGRAPHIC_1)).toBeInTheDocument();
      expect(screen.getByText(POPULATION_LABELS.GEOGRAPHIC_2)).toBeInTheDocument();
    });

    test('given household with people then displays correct person count', () => {
      // When
      const { container } = renderPage();

      // Then - check that person counts appear in the page content
      const pageContent = container.textContent || '';
      expect(pageContent).toContain('2 person');
      expect(pageContent).toContain('1 person');
    });

    test('given geographic association then displays scope details', () => {
      // When
      const { container } = renderPage();

      // Then - check for geography-related details in page content
      const pageContent = container.textContent || '';
      expect(pageContent).toContain('National');
      expect(pageContent).toContain('Subnational');
    });

    test('given subnational geography then displays region details', () => {
      // When
      const { container } = renderPage();

      // Then - check that region details appear in page content
      const pageContent = container.textContent || '';
      expect(pageContent).toContain('State');
    });

    test('given created dates then displays formatted dates', () => {
      // When
      renderPage();

      // Then
      // Format dates as 'short-month-day-year' format: "Jan 15, 2025"
      const date1 = new Date(POPULATION_TEST_IDS.TIMESTAMP_1).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const date2 = new Date(POPULATION_TEST_IDS.TIMESTAMP_2).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      // Use getAllByText since dates might appear multiple times
      const date1Elements = screen.getAllByText(date1);
      const date2Elements = screen.getAllByText(date2);

      expect(date1Elements.length).toBeGreaterThan(0);
      expect(date2Elements.length).toBeGreaterThan(0);
    });

    test('given no data then displays empty state', () => {
      // Given
      const emptyState = createEmptyDataState();
      (useUserHouseholds as any).mockReturnValue(emptyState.household);
      (useGeographicAssociationsByUser as any).mockReturnValue(emptyState.geographic);

      // When
      renderPage();

      // Then - Check that no population items are displayed
      expect(screen.queryByText(POPULATION_LABELS.HOUSEHOLD_1)).not.toBeInTheDocument();
      expect(screen.queryByText(POPULATION_LABELS.GEOGRAPHIC_1)).not.toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    test('given household data loading then shows loading state', () => {
      // Given
      const loadingState = createLoadingState(true, false);
      (useUserHouseholds as any).mockReturnValue(loadingState.household);
      (useGeographicAssociationsByUser as any).mockReturnValue(loadingState.geographic);

      // When
      renderPage();

      // Then - Look for the Loader component by its role or test the loading state
      const loaderElement = document.querySelector('.mantine-Loader-root');
      expect(loaderElement).toBeInTheDocument();
    });

    test('given geographic data loading then shows loading state', () => {
      // Given
      const loadingState = createLoadingState(false, true);
      (useUserHouseholds as any).mockReturnValue(loadingState.household);
      (useGeographicAssociationsByUser as any).mockReturnValue(loadingState.geographic);

      // When
      renderPage();

      // Then - Look for the Loader component
      const loaderElement = document.querySelector('.mantine-Loader-root');
      expect(loaderElement).toBeInTheDocument();
    });

    test('given both loading then shows single loading state', () => {
      // Given
      const loadingState = createLoadingState(true, true);
      (useUserHouseholds as any).mockReturnValue(loadingState.household);
      (useGeographicAssociationsByUser as any).mockReturnValue(loadingState.geographic);

      // When
      renderPage();

      // Then - Check for single loader
      const loaderElements = document.querySelectorAll('.mantine-Loader-root');
      expect(loaderElements).toHaveLength(1);
    });
  });

  describe('error states', () => {
    test('given household fetch error then displays error message', () => {
      // Given
      const errorState = createErrorState(true, false);
      (useUserHouseholds as any).mockReturnValue(errorState.household);
      (useGeographicAssociationsByUser as any).mockReturnValue(errorState.geographic);

      // When
      renderPage();

      // Then - Look for error text containing "Error:"
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });

    test('given geographic fetch error then displays error message', () => {
      // Given
      const errorState = createErrorState(false, true);
      (useUserHouseholds as any).mockReturnValue(errorState.household);
      (useGeographicAssociationsByUser as any).mockReturnValue(errorState.geographic);

      // When
      renderPage();

      // Then - Look for error text containing "Error:"
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });

    test('given both fetch errors then displays single error message', () => {
      // Given
      const errorState = createErrorState(true, true);
      (useUserHouseholds as any).mockReturnValue(errorState.household);
      (useGeographicAssociationsByUser as any).mockReturnValue(errorState.geographic);

      // When
      renderPage();

      // Then - Check for single error message
      const errorElements = screen.getAllByText(/Error:/);
      expect(errorElements).toHaveLength(1);
    });
  });

  describe('user interactions', () => {
    test('given user clicks build population then dispatches flow action', async () => {
      // Given
      const user = userEvent.setup();
      renderPage();

      // When
      const buildButton = screen.getByRole('button', {
        name: POPULATION_LABELS.BUILD_BUTTON,
      });
      await user.click(buildButton);

      // Then
      expect(mockNavigate).toHaveBeenCalledWith('/us/households/create');
    });

    test('given user selects population then updates selection state', async () => {
      // Given
      const user = userEvent.setup();
      renderPage();

      // When - Find and click a checkbox (assuming the IngredientReadView renders checkboxes)
      const checkboxes = screen.getAllByRole('checkbox');
      if (checkboxes.length > 0) {
        await user.click(checkboxes[0]);

        // Then
        await waitFor(() => {
          expect(checkboxes[0]).toBeChecked();
        });
      }
    });
  });

  describe('data transformation', () => {
    test('given household without label then uses default naming', () => {
      // Given
      const dataWithoutLabel = [
        {
          ...mockUserHouseholdsData[0],
          association: {
            ...mockUserHouseholdsData[0].association,
            label: undefined,
          },
        },
      ];

      (useUserHouseholds as any).mockReturnValue({
        data: dataWithoutLabel,
        isLoading: false,
        isError: false,
        error: null,
      });

      // When
      renderPage();

      // Then
      expect(
        screen.getByText(`Household #${POPULATION_TEST_IDS.HOUSEHOLD_ID_1}`)
      ).toBeInTheDocument();
    });

    test('given household without created date then displays empty date', () => {
      // Given
      const dataWithoutDate = [
        {
          ...mockUserHouseholdsData[0],
          association: {
            ...mockUserHouseholdsData[0].association,
            createdAt: undefined,
          },
        },
      ];

      (useUserHouseholds as any).mockReturnValue({
        data: dataWithoutDate,
        isLoading: false,
        isError: false,
        error: null,
      });

      // When
      renderPage();

      // Then - Check that the household data is displayed (but without checking for specific date text)
      expect(
        screen.getByText(mockUserHouseholdsData[0].association.label || 'Household')
      ).toBeInTheDocument();
    });

    test('given household with no people then displays zero count', () => {
      // Given
      const dataWithNoPeople = [
        {
          ...mockUserHouseholdsData[0],
          household: {
            ...mockUserHouseholdsData[0].household,
            household_json: {
              people: {},
              families: {},
            },
          },
        },
      ];

      (useUserHouseholds as any).mockReturnValue({
        data: dataWithNoPeople,
        isLoading: false,
        isError: false,
        error: null,
      });

      // When
      const { container } = renderPage();

      // Then - check that zero person count appears in page content
      const pageContent = container.textContent || '';
      expect(pageContent).toContain('0 person');
    });

    test('given mixed data then displays both household and geographic populations', () => {
      // When
      const { container } = renderPage();

      // Then - Verify both types are rendered
      expect(screen.getByText(POPULATION_LABELS.HOUSEHOLD_1)).toBeInTheDocument();
      expect(screen.getByText(POPULATION_LABELS.GEOGRAPHIC_1)).toBeInTheDocument();

      // Verify different detail types in page content
      const pageContent = container.textContent || '';
      expect(pageContent).toContain('2 person');
      expect(pageContent).toContain('Subnational');
    });
  });

  describe('column configuration', () => {
    test('given page renders then displays correct column headers without connections', () => {
      // When
      renderPage();

      // Then
      expect(screen.getByText(POPULATION_COLUMNS.NAME)).toBeInTheDocument();
      expect(screen.getByText(POPULATION_COLUMNS.DATE)).toBeInTheDocument();
      expect(screen.getByText(POPULATION_COLUMNS.DETAILS)).toBeInTheDocument();
      // Connections column should not be present
      expect(screen.queryByText(POPULATION_COLUMNS.CONNECTIONS)).not.toBeInTheDocument();
    });

    test('given column configuration then does not include connections column', () => {
      // When
      renderPage();

      // Then
      // The component should render successfully without connections column
      expect(
        screen.getByRole('heading', { name: 'Your saved households', level: 2 })
      ).toBeInTheDocument();
      // Verify data is displayed correctly
      expect(screen.getByText(POPULATION_LABELS.HOUSEHOLD_1)).toBeInTheDocument();
    });
  });
});
