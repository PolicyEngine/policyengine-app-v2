import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent } from '@test-utils';
import ReportSetupFrame from '@/frames/report/ReportSetupFrame';
import {
  mockOnNavigate,
  mockSimulation1,
  mockSimulation2
} from '@/tests/fixtures/frames/reportFrameMocks';
import * as reportReducer from '@/reducers/reportReducer';
import * as simulationsReducer from '@/reducers/simulationsReducer';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock Redux dispatch
const mockDispatch = vi.fn();

// Mock simulation selector at the module level
const mockSelectSimulationAtPosition = vi.fn();
vi.mock('@/reducers/simulationsReducer', async () => {
  const actual = await vi.importActual('@/reducers/simulationsReducer') as any;
  return {
    ...actual,
    selectSimulationAtPosition: (state: any, position: number) => mockSelectSimulationAtPosition(position),
    createSimulationAtPosition: actual.createSimulationAtPosition,
  };
});

vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (selector: any) => {
      // Call the selector with a fake state
      return selector({});
    },
  };
});

describe('ReportSetupFrame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDispatch.mockClear();
    mockOnNavigate.mockClear();
    mockSelectSimulationAtPosition.mockClear();
  });

  test('given component mounts then sets mode to report', () => {
    // Given
    mockSelectSimulationAtPosition.mockImplementation(() => null);

    // When
    render(<ReportSetupFrame onNavigate={mockOnNavigate} />);

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(
      reportReducer.setMode('report')
    );
  });

  test('given no simulations configured then shows add simulation cards', () => {
    // Given
    mockSelectSimulationAtPosition.mockImplementation(() => null);

    // When
    render(<ReportSetupFrame onNavigate={mockOnNavigate} />);

    // Then
    expect(screen.getByText('Add a first simulation')).toBeInTheDocument();
    expect(screen.getByText('Add a second simulation')).toBeInTheDocument();
  });

  test('given user clicks first simulation then sets position 0 and navigates', async () => {
    // Given
    const user = userEvent.setup();
    mockSelectSimulationAtPosition.mockImplementation(() => null);

    render(<ReportSetupFrame onNavigate={mockOnNavigate} />);

    // When
    await user.click(screen.getByText('Add a first simulation'));
    await user.click(screen.getByRole('button', { name: /Setup first simulation/i }));

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(
      simulationsReducer.createSimulationAtPosition({ position: 0 })
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      reportReducer.setActiveSimulationPosition(0)
    );
    expect(mockOnNavigate).toHaveBeenCalledWith('setupSimulation1');
  });

  test('given user clicks second simulation then sets position 1 and navigates', async () => {
    // Given
    const user = userEvent.setup();
    mockSelectSimulationAtPosition.mockImplementation(() => null);

    render(<ReportSetupFrame onNavigate={mockOnNavigate} />);

    // When
    await user.click(screen.getByText('Add a second simulation'));
    await user.click(screen.getByRole('button', { name: /Setup second simulation/i }));

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(
      simulationsReducer.createSimulationAtPosition({ position: 1 })
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      reportReducer.setActiveSimulationPosition(1)
    );
    expect(mockOnNavigate).toHaveBeenCalledWith('setupSimulation2');
  });

  test('given both simulations configured then next button is enabled', async () => {
    // Given - mock to return configured simulations
    mockSelectSimulationAtPosition.mockImplementation((position) => {
      return position === 0 ? mockSimulation1 : mockSimulation2;
    });

    const user = userEvent.setup();
    render(<ReportSetupFrame onNavigate={mockOnNavigate} />);

    // When - should have enabled Next button
    const nextButton = screen.getByRole('button', { name: /Next/i });

    // Then
    expect(nextButton).toBeEnabled();

    // When clicking next
    await user.click(nextButton);

    // Then navigates
    expect(mockOnNavigate).toHaveBeenCalledWith('next');
  });

  test('given only first simulation configured then shows mixed state', () => {
    // Given - return simulation for position 0, null for position 1
    mockSelectSimulationAtPosition.mockImplementation((position) => {
      return position === 0 ? mockSimulation1 : null;
    });

    // When
    render(<ReportSetupFrame onNavigate={mockOnNavigate} />);

    // Then - should show configured text for sim1 and "Add" text for sim2
    expect(screen.getByText(/Baseline Simulation/)).toBeInTheDocument();
    expect(screen.getByText('Add a second simulation')).toBeInTheDocument();
  });

  test('given one simulation configured then next button is disabled', () => {
    // Given - only first simulation configured
    mockSelectSimulationAtPosition.mockImplementation((position) => {
      return position === 0 ? mockSimulation1 : null;
    });

    // When
    render(<ReportSetupFrame onNavigate={mockOnNavigate} />);

    // Then - Next button should be disabled
    const nextButton = screen.getByRole('button', { name: /Next/i });
    expect(nextButton).toBeDisabled();
  });

  test('given existing simulation at position then displays correctly', () => {
    // Given - first simulation already exists, second doesn't
    mockSelectSimulationAtPosition.mockImplementation((position) => {
      return position === 0 ? mockSimulation1 : null;
    });

    // When
    render(<ReportSetupFrame onNavigate={mockOnNavigate} />);

    // Then - should show the configured sim1 and unconfigured sim2
    expect(screen.getByText(/Baseline Simulation/)).toBeInTheDocument();
    expect(screen.getByText('Add a second simulation')).toBeInTheDocument();

    // And Next button should be disabled since only one simulation is configured
    const nextButton = screen.getByRole('button', { name: /Next/i });
    expect(nextButton).toBeDisabled();
  });
});