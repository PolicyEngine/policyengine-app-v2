import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReportSetupFrame from '@/frames/report/ReportSetupFrame';
import * as reportReducer from '@/reducers/reportReducer';
import {
  mockReportFlowProps,
  mockSimulation1,
  mockSimulation2,
} from '@/tests/fixtures/frames/reportFrameMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock Redux dispatch
const mockDispatch = vi.fn();

// Mock simulation selector at the module level
const mockSelectSimulationAtPosition = vi.fn();
vi.mock('@/reducers/simulationsReducer', async () => {
  const actual = (await vi.importActual('@/reducers/simulationsReducer')) as any;
  return {
    ...actual,
    selectSimulationAtPosition: (_state: any, position: number) =>
      mockSelectSimulationAtPosition(position),
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

// Mock useCancelFlow
const mockHandleCancel = vi.fn();
vi.mock('@/hooks/useCancelFlow', () => ({
  useCancelFlow: vi.fn(() => ({ handleCancel: mockHandleCancel })),
}));

describe('ReportSetupFrame', () => {
  beforeEach(() => {
    mockHandleCancel.mockClear();
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
    expect(mockDispatch).toHaveBeenCalledWith(reportReducer.setMode('report'));
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

  test('given user clicks first simulation card when not configured then navigates to setup', async () => {
    // Given
    const user = userEvent.setup();
    mockSelectSimulationAtPosition
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => null);
    render(<ReportSetupFrame {...mockReportFlowProps} />);

    // When
    const firstCard = screen.getByText('Add a first simulation');
    await user.click(firstCard);
    const setupButton = screen.getByRole('button', { name: /Setup first simulation/i });
    await user.click(setupButton);

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(reportReducer.setActiveSimulationPosition(0));
    expect(mockReportFlowProps.onNavigate).toHaveBeenCalledWith('setupSimulation1');
  });

  test('given user clicks second simulation card when not configured then navigates to setup', async () => {
    // Given
    const user = userEvent.setup();
    mockSelectSimulationAtPosition
      .mockImplementationOnce(() => mockSimulation1)
      .mockImplementationOnce(() => null);
    render(<ReportSetupFrame {...mockReportFlowProps} />);

    // When
    const secondCard = screen.getByText('Add a second simulation');
    await user.click(secondCard);
    const setupButton = screen.getByRole('button', { name: /Setup second simulation/i });
    await user.click(setupButton);

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(reportReducer.setActiveSimulationPosition(1));
    expect(mockReportFlowProps.onNavigate).toHaveBeenCalledWith('setupSimulation2');
  });

  test('given user clicks first simulation card when already configured then can re-setup', async () => {
    // Given
    const user = userEvent.setup();
    mockSelectSimulationAtPosition
      .mockImplementationOnce(() => mockSimulation1)
      .mockImplementationOnce(() => mockSimulation2);
    render(<ReportSetupFrame {...mockReportFlowProps} />);

    // When
    const firstCard = screen.getByText(/Simulation 1:/i);
    await user.click(firstCard);
    const setupButton = screen.getByRole('button', { name: /Setup first simulation/i });
    await user.click(setupButton);

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(reportReducer.setActiveSimulationPosition(0));
    expect(mockReportFlowProps.onNavigate).toHaveBeenCalledWith('setupSimulation1');
  });

  test('given both simulations configured when user clicks next then navigates forward', async () => {
    // Given
    const user = userEvent.setup();
    mockSelectSimulationAtPosition
      .mockImplementationOnce(() => mockSimulation1)
      .mockImplementationOnce(() => mockSimulation2);
    render(<ReportSetupFrame {...mockReportFlowProps} />);

    // When
    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    // Then
    expect(mockReportFlowProps.onNavigate).toHaveBeenCalledWith('next');
  });
});
