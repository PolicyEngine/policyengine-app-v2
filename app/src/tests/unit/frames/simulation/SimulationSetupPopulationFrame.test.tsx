import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import SimulationSetupPopulationFrame from '@/frames/simulation/SimulationSetupPopulationFrame';
import { mockOnNavigate } from '@/tests/fixtures/frames/simulationFrameMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock the user hooks to avoid API calls
vi.mock('@/hooks/useUserHousehold', () => ({
  useUserHouseholds: () => ({
    data: [],
    isLoading: false,
    isError: false,
  }),
  isHouseholdMetadataWithAssociation: () => false,
}));

vi.mock('@/hooks/useUserGeographic', () => ({
  useUserGeographics: () => ({
    data: [],
    isLoading: false,
    isError: false,
  }),
  isGeographicMetadataWithAssociation: () => false,
}));

describe('SimulationSetupPopulationFrame', () => {
  const mockFlowProps = {
    onNavigate: mockOnNavigate,
    onReturn: vi.fn(),
    flowConfig: {
      component: 'SimulationSetupPopulationFrame' as any,
      on: {},
    },
    isInSubflow: false,
    flowDepth: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnNavigate.mockClear();
  });

  test('given user selects load existing and clicks next then navigates to loadExisting', async () => {
    // Given
    const user = userEvent.setup();
    render(<SimulationSetupPopulationFrame {...mockFlowProps} />);

    // When
    const loadExistingButton = screen.getByText('Load Existing Population');
    await user.click(loadExistingButton);

    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    // Then
    expect(mockOnNavigate).toHaveBeenCalledWith('loadExisting');
  });

  test('given user selects create new and clicks next then navigates to createNew', async () => {
    // Given
    const user = userEvent.setup();
    render(<SimulationSetupPopulationFrame {...mockFlowProps} />);

    // When
    const createNewButton = screen.getByText('Create New Population');
    await user.click(createNewButton);

    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    // Then
    expect(mockOnNavigate).toHaveBeenCalledWith('createNew');
  });

  test('given no selection made then next button is disabled', () => {
    // Given
    render(<SimulationSetupPopulationFrame {...mockFlowProps} />);

    // When
    const nextButton = screen.getByRole('button', { name: /Next/i });

    // Then
    expect(nextButton).toBeDisabled();
  });
});
