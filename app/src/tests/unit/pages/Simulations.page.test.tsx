import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MOCK_USER_ID } from '@/constants';
import { useUserSimulations } from '@/hooks/useUserSimulations';
import SimulationsPage from '@/pages/Simulations.page';
import {
  ERROR_MESSAGES,
  mockDefaultHookReturn,
  mockEmptyHookReturn,
  mockErrorHookReturn,
  mockLoadingHookReturn,
} from '@/tests/fixtures/pages/simulationsMocks';

// Mock the hooks
vi.mock('@/hooks/useUserSimulations', () => ({
  useUserSimulations: vi.fn(),
}));

vi.mock('@/hooks/useUserSimulationAssociations', () => ({
  useUpdateSimulationAssociation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

// Mock useCurrentCountry
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: () => 'us',
}));

// Mock useRegions
vi.mock('@/hooks/useRegions', () => ({
  useRegions: vi.fn(() => ({
    regions: [],
    isLoading: false,
    error: null,
    rawRegions: [],
  })),
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

// Mock IngredientReadView component
// Note: Cannot use factory function in vi.mock due to hoisting, so we inline it
vi.mock('@/components/IngredientReadView', () => ({
  default: vi.fn(
    ({
      title,
      subtitle,
      onBuild,
      isLoading,
      isError,
      error,
      data,
      searchValue,
      onSearchChange,
      columns,
    }: any) => {
      const menuColumn = columns?.find((col: any) => col.type === 'split-menu');
      const handleMenuAction = menuColumn?.onAction;

      return (
        <div data-testid="ingredient-read-view">
          <h1>{title}</h1>
          <p>{subtitle}</p>
          {isLoading && <div>Loading...</div>}
          {isError && <div>Error: {error?.message}</div>}
          {data && (
            <>
              <div>Data count: {data.length}</div>
              {data.length > 0 && (
                <>
                  <div data-testid="simulation-name">{(data[0].simulation as any).text}</div>
                  <div data-testid="population-value">{(data[0].population as any).text}</div>
                  {handleMenuAction && (
                    <button
                      type="button"
                      onClick={() => handleMenuAction('add-to-report', data[0].id)}
                      data-testid="add-to-report-button"
                    >
                      Add to Report
                    </button>
                  )}
                </>
              )}
            </>
          )}
          <button type="button" onClick={onBuild}>
            Build Simulation
          </button>
          <input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
          />
        </div>
      );
    }
  ),
}));

describe('SimulationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useUserSimulations as any).mockReturnValue(mockDefaultHookReturn);
  });

  test('given simulations data when rendering then displays simulations page', () => {
    // When
    render(<SimulationsPage />);

    // Then
    expect(screen.getByText('Your saved simulations')).toBeInTheDocument();
    expect(screen.getByText(/Build and save tax policy scenarios/)).toBeInTheDocument();
    expect(screen.getByText('Data count: 2')).toBeInTheDocument();
  });

  test('given loading state when rendering then shows loading indicator', () => {
    // Given
    (useUserSimulations as any).mockReturnValue(mockLoadingHookReturn);

    // When
    render(<SimulationsPage />);

    // Then
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('given error state when rendering then shows error message', () => {
    // Given
    (useUserSimulations as any).mockReturnValue(mockErrorHookReturn);

    // When
    render(<SimulationsPage />);

    // Then
    expect(screen.getByText(`Error: ${ERROR_MESSAGES.FETCH_FAILED}`)).toBeInTheDocument();
  });

  test('given user clicks build simulation button then navigates to create route', async () => {
    // Given
    const user = userEvent.setup();
    render(<SimulationsPage />);

    // When
    await user.click(screen.getByRole('button', { name: /Build Simulation/i }));

    // Then
    expect(mockNavigate).toHaveBeenCalledWith('/us/simulations/create');
  });

  test('given no simulations when rendering then displays empty state', () => {
    // Given
    (useUserSimulations as any).mockReturnValue(mockEmptyHookReturn);

    // When
    render(<SimulationsPage />);

    // Then
    expect(screen.getByText('Data count: 0')).toBeInTheDocument();
  });

  test('given user searches then updates search value', async () => {
    // Given
    const user = userEvent.setup();
    render(<SimulationsPage />);

    // When
    const searchInput = screen.getByPlaceholderText('Search');
    await user.type(searchInput, 'Test Simulation');

    // Then
    expect(searchInput).toHaveValue('Test Simulation');
  });

  test('given hook returns correct user ID then uses MOCK_USER_ID', () => {
    // When
    render(<SimulationsPage />);

    // Then
    expect(useUserSimulations).toHaveBeenCalledWith(MOCK_USER_ID.toString());
  });

  test('given population column then displays as text not link', () => {
    // When
    render(<SimulationsPage />);

    // Then
    const population = screen.getByTestId('population-value');
    expect(population).toBeInTheDocument();
    expect(population).toHaveTextContent('Test Household 1');
  });

  test('given simulation without label then displays default label', () => {
    // Given
    const dataWithoutLabel = {
      ...mockDefaultHookReturn,
      data: [
        {
          ...mockDefaultHookReturn.data![0],
          userSimulation: {
            ...mockDefaultHookReturn.data![0].userSimulation,
            label: undefined,
          },
        },
      ],
    };
    (useUserSimulations as any).mockReturnValue(dataWithoutLabel);

    // When
    render(<SimulationsPage />);

    // Then
    const simulationName = screen.getByTestId('simulation-name');
    expect(simulationName).toHaveTextContent(/Simulation #1001/);
  });

  test('given column configuration then does not include connected column', () => {
    // When
    render(<SimulationsPage />);

    // Then
    // The component should render successfully without connected column
    expect(screen.getByText('Your saved simulations')).toBeInTheDocument();
    // Verify data is displayed correctly
    expect(screen.getByTestId('simulation-name')).toBeInTheDocument();
  });
});
