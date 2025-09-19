import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent } from '@test-utils';
import ReportSetupFrame from '@/frames/report/ReportSetupFrame';
import {
  mockReportFlowProps,
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
    selectSimulationAtPosition: (_state: any, position: number) => mockSelectSimulationAtPosition(position),
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
    mockReportFlowProps.onNavigate.mockClear();
    mockSelectSimulationAtPosition.mockClear();
  });

  test('given component mounts then sets mode to report', () => {
    // Given
    mockSelectSimulationAtPosition.mockImplementation(() => null);

    // When
    render(<ReportSetupFrame {...mockReportFlowProps} />);

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(
      reportReducer.setMode('report')
    );
  });

  test('given both simulations configured then shows comparison view', () => {
    // Given
    mockSelectSimulationAtPosition
      .mockImplementationOnce(() => mockSimulation1)
      .mockImplementationOnce(() => mockSimulation2);

    // When
    render(<ReportSetupFrame {...mockReportFlowProps} />);

    // Then
    expect(screen.getByText(/Baseline Simulation/i)).toBeInTheDocument();
    expect(screen.getByText(/Reform Simulation/i)).toBeInTheDocument();
  });

  test('given first simulation not configured then shows add simulation option', () => {
    // Given
    mockSelectSimulationAtPosition.mockImplementation(() => null);

    // When
    render(<ReportSetupFrame {...mockReportFlowProps} />);

    // Then
    expect(screen.getByText('Add a first simulation')).toBeInTheDocument();
    expect(screen.getByText('Add a second simulation')).toBeInTheDocument();
  });

  test('given first configured but second not then shows both simulations', () => {
    // Given
    mockSelectSimulationAtPosition
      .mockImplementationOnce(() => mockSimulation1)
      .mockImplementationOnce(() => null);

    // When
    render(<ReportSetupFrame {...mockReportFlowProps} />);

    // Then
    // First simulation shows as configured
    expect(screen.getByText(/Simulation 1.*Baseline Simulation/i)).toBeInTheDocument();
    // Second simulation shows as not configured
    expect(screen.getByText('Add a second simulation')).toBeInTheDocument();
  });

  test.skip('given user clicks swap positions then dispatches swap action', async () => {
    // Given
    const user = userEvent.setup();
    mockSelectSimulationAtPosition
      .mockImplementationOnce(() => mockSimulation1)
      .mockImplementationOnce(() => mockSimulation2);
    render(<ReportSetupFrame {...mockReportFlowProps} />);

    // When
    const swapButton = screen.getByRole('button', { name: /swap/i });
    await user.click(swapButton);

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(
      simulationsReducer.swapSimulations()
    );
  });

  test.skip('given user clicks edit first simulation then sets position and navigates', async () => {
    // Given
    const user = userEvent.setup();
    mockSelectSimulationAtPosition
      .mockImplementationOnce(() => mockSimulation1)
      .mockImplementationOnce(() => mockSimulation2);
    render(<ReportSetupFrame {...mockReportFlowProps} />);

    // When
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(
      reportReducer.setActiveSimulationPosition(0)
    );
    expect(mockReportFlowProps.onNavigate).toHaveBeenCalledWith('editSimulation');
  });

  test.skip('given user clicks edit second simulation then sets position and navigates', async () => {
    // Given
    const user = userEvent.setup();
    mockSelectSimulationAtPosition
      .mockImplementationOnce(() => mockSimulation1)
      .mockImplementationOnce(() => mockSimulation2);
    render(<ReportSetupFrame {...mockReportFlowProps} />);

    // When
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[1]);

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(
      reportReducer.setActiveSimulationPosition(1)
    );
    expect(mockReportFlowProps.onNavigate).toHaveBeenCalledWith('editSimulation');
  });

  test.skip('given user clicks generate report then navigates to submit', async () => {
    // Given
    const user = userEvent.setup();
    mockSelectSimulationAtPosition
      .mockImplementationOnce(() => mockSimulation1)
      .mockImplementationOnce(() => mockSimulation2);
    render(<ReportSetupFrame {...mockReportFlowProps} />);

    // When
    const generateButton = screen.getByRole('button', { name: /generate report/i });
    await user.click(generateButton);

    // Then
    expect(mockReportFlowProps.onNavigate).toHaveBeenCalledWith('submit');
  });
});