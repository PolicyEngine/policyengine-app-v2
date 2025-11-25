import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import SimulationSelectExistingPopulationFrame from '@/frames/simulation/SimulationSelectExistingPopulationFrame';
import * as populationReducer from '@/reducers/populationReducer';
import { mockDispatch, mockOnNavigate } from '@/tests/fixtures/frames/simulationFrameMocks';
// Import mock data separately after mocks are set up
import {
  mockErrorResponse,
  mockGeographicData,
  mockHouseholdData,
  mockLoadingResponse,
  mockSuccessResponse,
} from '@/tests/fixtures/frames/simulationSelectExistingMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock selector function
const mockSelectCurrentPosition = vi.fn();

// Mock selectors
vi.mock('@/reducers/activeSelectors', () => ({
  selectCurrentPosition: () => mockSelectCurrentPosition(),
}));

vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (selector: any) => {
      if (selector.toString().includes('metadata')) {
        return { regions: {} }; // Mock metadata state
      }
      return selector({});
    },
  };
});

// Mock the useUserHouseholds hook
const mockUserHouseholds = vi.fn();
vi.mock('@/hooks/useUserHousehold', () => ({
  useUserHouseholds: () => mockUserHouseholds(),
  isHouseholdMetadataWithAssociation: (pop: any) => pop && pop.household && pop.association,
}));

// Mock the useUserGeographics hook
const mockUserGeographics = vi.fn();
vi.mock('@/hooks/useUserGeographic', () => ({
  useUserGeographics: () => mockUserGeographics(),
  isGeographicMetadataWithAssociation: (pop: any) => pop && pop.geography && pop.association,
}));

// Mock HouseholdAdapter
vi.mock('@/adapters', () => ({
  HouseholdAdapter: {
    fromAPI: (household: any) => ({
      id: household.id,
      countryId: household.country_id,
      householdData: household.household_json || {},
    }),
    fromMetadata: (household: any) => ({
      id: household.id,
      countryId: household.country_id,
      householdData: household.household_json || {},
    }),
  },
}));

describe('SimulationSelectExistingPopulationFrame', () => {
  const mockFlowProps = {
    onNavigate: mockOnNavigate,
    onReturn: vi.fn(),
    flowConfig: {
      component: 'SimulationSelectExistingPopulationFrame' as any,
      on: {},
    },
    isInSubflow: false,
    flowDepth: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnNavigate.mockClear();
    mockDispatch.mockClear();
    mockSelectCurrentPosition.mockClear();
    mockUserHouseholds.mockClear();
    mockUserGeographics.mockClear();
  });

  test('given populations are loading then displays loading message', () => {
    // Given
    mockSelectCurrentPosition.mockReturnValue(0);
    mockUserHouseholds.mockReturnValue(mockLoadingResponse);
    mockUserGeographics.mockReturnValue(mockLoadingResponse);

    // When
    render(<SimulationSelectExistingPopulationFrame {...mockFlowProps} />);

    // Then
    expect(screen.getByText('Loading households...')).toBeInTheDocument();
  });

  test('given error loading populations then displays error message', () => {
    // Given
    mockSelectCurrentPosition.mockReturnValue(0);
    mockUserHouseholds.mockReturnValue(mockErrorResponse('Failed to fetch households'));
    mockUserGeographics.mockReturnValue(mockSuccessResponse([]));

    // When
    render(<SimulationSelectExistingPopulationFrame {...mockFlowProps} />);

    // Then
    expect(screen.getByText(/Error: Failed to fetch households/)).toBeInTheDocument();
  });

  test('given no populations exist then displays empty state message', () => {
    // Given
    mockSelectCurrentPosition.mockReturnValue(0);
    mockUserHouseholds.mockReturnValue(mockSuccessResponse([]));
    mockUserGeographics.mockReturnValue(mockSuccessResponse([]));

    // When
    render(<SimulationSelectExistingPopulationFrame {...mockFlowProps} />);

    // Then
    expect(
      screen.getByText('No households available. Please create new household(s).')
    ).toBeInTheDocument();
  });

  test('given user selects household and submits then creates population at position with household data', async () => {
    // Given
    const user = userEvent.setup();
    mockSelectCurrentPosition.mockReturnValue(1); // Report mode, position 1
    mockUserHouseholds.mockReturnValue(mockSuccessResponse(mockHouseholdData));
    mockUserGeographics.mockReturnValue(mockSuccessResponse([]));

    render(<SimulationSelectExistingPopulationFrame {...mockFlowProps} />);

    // When
    const householdCard = screen.getByText('My Family');
    await user.click(householdCard);

    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(
      populationReducer.createPopulationAtPosition({
        position: 1,
        population: expect.objectContaining({
          label: 'My Family',
          isCreated: true,
        }),
      })
    );

    expect(mockDispatch).toHaveBeenCalledWith(
      populationReducer.setHouseholdAtPosition({
        position: 1,
        household: expect.objectContaining({
          id: '123',
          countryId: 'us',
        }),
      })
    );

    expect(mockOnNavigate).toHaveBeenCalledWith('next');
  });

  test('given user selects geography and submits then creates population at position with geography data', async () => {
    // Given
    const user = userEvent.setup();
    mockSelectCurrentPosition.mockReturnValue(0); // Standalone mode
    mockUserHouseholds.mockReturnValue(mockSuccessResponse([]));
    mockUserGeographics.mockReturnValue(mockSuccessResponse(mockGeographicData));

    render(<SimulationSelectExistingPopulationFrame {...mockFlowProps} />);

    // When
    const geographyCard = screen.getByText('US National');
    await user.click(geographyCard);

    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(
      populationReducer.createPopulationAtPosition({
        position: 0,
        population: expect.objectContaining({
          label: 'US National',
          isCreated: true,
        }),
      })
    );

    expect(mockDispatch).toHaveBeenCalledWith(
      populationReducer.setGeographyAtPosition({
        position: 0,
        geography: expect.objectContaining({
          id: 'mock-geography',
          countryId: 'us',
        }),
      })
    );

    expect(mockOnNavigate).toHaveBeenCalledWith('next');
  });
});
