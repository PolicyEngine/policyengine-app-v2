import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import SimulationCreationFrame from '@/frames/simulation/SimulationCreationFrame';
import * as simulationsReducer from '@/reducers/simulationsReducer';
import {
  mockDispatch,
  mockOnNavigate,
  mockReportStateReportWithName,
  mockReportStateReportWithoutName,
  mockReportStateStandalone,
  mockSimulationEmpty,
} from '@/tests/fixtures/frames/simulationFrameMocks';
import {
  EXPECTED_BASELINE_SIMULATION_LABEL,
  EXPECTED_BASELINE_WITH_REPORT_LABEL,
  EXPECTED_REFORM_SIMULATION_LABEL,
  EXPECTED_REFORM_WITH_REPORT_LABEL,
} from '@/tests/fixtures/frames/SimulationCreationFrame';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock selectors
const mockSelectCurrentPosition = vi.fn();
const mockSelectSimulationAtPosition = vi.fn();
let mockReportState: any = mockReportStateStandalone;

vi.mock('@/reducers/activeSelectors', () => ({
  selectCurrentPosition: (_state: any) => mockSelectCurrentPosition(),
}));

vi.mock('@/reducers/simulationsReducer', async () => {
  const actual = (await vi.importActual('@/reducers/simulationsReducer')) as any;
  return {
    ...actual,
    selectSimulationAtPosition: (_state: any, position: number) =>
      mockSelectSimulationAtPosition(position),
    createSimulationAtPosition: actual.createSimulationAtPosition,
    updateSimulationAtPosition: actual.updateSimulationAtPosition,
  };
});

vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (selector: any) => {
      return selector({ report: mockReportState });
    },
  };
});

describe('SimulationCreationFrame', () => {
  const mockFlowProps = {
    onNavigate: mockOnNavigate,
    onReturn: vi.fn(),
    flowConfig: {
      component: 'SimulationCreationFrame' as any,
      on: {},
    },
    isInSubflow: false,
    flowDepth: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDispatch.mockClear();
    mockOnNavigate.mockClear();
    mockSelectCurrentPosition.mockClear();
    mockSelectSimulationAtPosition.mockClear();
  });

  test('given no simulation exists then creates one at current position', () => {
    // Given
    mockSelectCurrentPosition.mockReturnValue(0);
    mockSelectSimulationAtPosition.mockReturnValue(null);

    // When
    render(<SimulationCreationFrame {...mockFlowProps} />);

    // Then - should create simulation at position 0
    expect(mockDispatch).toHaveBeenCalledWith(
      simulationsReducer.createSimulationAtPosition({ position: 0 })
    );
  });

  test('given simulation exists then does not create new one', () => {
    // Given
    mockSelectCurrentPosition.mockReturnValue(0);
    mockSelectSimulationAtPosition.mockReturnValue(mockSimulationEmpty);

    // When
    render(<SimulationCreationFrame {...mockFlowProps} />);

    // Then - should NOT create simulation
    expect(mockDispatch).not.toHaveBeenCalledWith(
      simulationsReducer.createSimulationAtPosition({ position: 0 })
    );
  });

  test('given user enters label and submits then updates simulation', async () => {
    // Given
    const user = userEvent.setup();
    mockReportState = mockReportStateStandalone;
    mockSelectCurrentPosition.mockReturnValue(1);
    mockSelectSimulationAtPosition.mockReturnValue(mockSimulationEmpty);

    render(<SimulationCreationFrame {...mockFlowProps} />);

    // When - Clear prefilled label and type new one
    const input = screen.getByLabelText('Simulation name');
    await user.clear(input);
    await user.type(input, 'My Custom Simulation');

    const submitButton = screen.getByRole('button', { name: /Create simulation/i });
    await user.click(submitButton);

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(
      simulationsReducer.updateSimulationAtPosition({
        position: 1,
        updates: { label: 'My Custom Simulation' },
      })
    );
    expect(mockOnNavigate).toHaveBeenCalledWith('next');
  });

  test('given report mode then uses activeSimulationPosition', () => {
    // Given
    mockSelectCurrentPosition.mockReturnValue(1); // Report mode, position 1
    mockSelectSimulationAtPosition.mockReturnValue(null);

    // When
    render(<SimulationCreationFrame {...mockFlowProps} />);

    // Then - should create simulation at position 1
    expect(mockDispatch).toHaveBeenCalledWith(
      simulationsReducer.createSimulationAtPosition({ position: 1 })
    );
  });

  test('given standalone mode then uses position 0', () => {
    // Given
    mockSelectCurrentPosition.mockReturnValue(0); // Standalone mode always returns 0
    mockSelectSimulationAtPosition.mockReturnValue(null);

    // When
    render(<SimulationCreationFrame {...mockFlowProps} />);

    // Then - should create simulation at position 0
    expect(mockDispatch).toHaveBeenCalledWith(
      simulationsReducer.createSimulationAtPosition({ position: 0 })
    );
  });

  describe('Auto-naming behavior', () => {
    test('given standalone mode at position 0 then prefills with baseline simulation label', () => {
      // Given
      mockReportState = mockReportStateStandalone;
      mockSelectCurrentPosition.mockReturnValue(0);
      mockSelectSimulationAtPosition.mockReturnValue(mockSimulationEmpty);

      // When
      render(<SimulationCreationFrame {...mockFlowProps} />);

      // Then
      const input = screen.getByLabelText('Simulation name') as HTMLInputElement;
      expect(input.value).toBe(EXPECTED_BASELINE_SIMULATION_LABEL);
    });

    test('given standalone mode at position 1 then prefills with reform simulation label', () => {
      // Given
      mockReportState = mockReportStateStandalone;
      mockSelectCurrentPosition.mockReturnValue(1);
      mockSelectSimulationAtPosition.mockReturnValue(mockSimulationEmpty);

      // When
      render(<SimulationCreationFrame {...mockFlowProps} />);

      // Then
      const input = screen.getByLabelText('Simulation name') as HTMLInputElement;
      expect(input.value).toBe(EXPECTED_REFORM_SIMULATION_LABEL);
    });

    test('given report mode with report name at position 0 then prefills with report name and baseline', () => {
      // Given
      mockReportState = mockReportStateReportWithName;
      mockSelectCurrentPosition.mockReturnValue(0);
      mockSelectSimulationAtPosition.mockReturnValue(mockSimulationEmpty);

      // When
      render(<SimulationCreationFrame {...mockFlowProps} />);

      // Then
      const input = screen.getByLabelText('Simulation name') as HTMLInputElement;
      expect(input.value).toBe(EXPECTED_BASELINE_WITH_REPORT_LABEL);
    });

    test('given report mode with report name at position 1 then prefills with report name and reform', () => {
      // Given
      mockReportState = mockReportStateReportWithName;
      mockSelectCurrentPosition.mockReturnValue(1);
      mockSelectSimulationAtPosition.mockReturnValue(mockSimulationEmpty);

      // When
      render(<SimulationCreationFrame {...mockFlowProps} />);

      // Then
      const input = screen.getByLabelText('Simulation name') as HTMLInputElement;
      expect(input.value).toBe(EXPECTED_REFORM_WITH_REPORT_LABEL);
    });

    test('given report mode without report name at position 0 then prefills with baseline simulation', () => {
      // Given
      mockReportState = mockReportStateReportWithoutName;
      mockSelectCurrentPosition.mockReturnValue(0);
      mockSelectSimulationAtPosition.mockReturnValue(mockSimulationEmpty);

      // When
      render(<SimulationCreationFrame {...mockFlowProps} />);

      // Then
      const input = screen.getByLabelText('Simulation name') as HTMLInputElement;
      expect(input.value).toBe(EXPECTED_BASELINE_SIMULATION_LABEL);
    });

    test('given report mode without report name at position 1 then prefills with reform simulation', () => {
      // Given
      mockReportState = mockReportStateReportWithoutName;
      mockSelectCurrentPosition.mockReturnValue(1);
      mockSelectSimulationAtPosition.mockReturnValue(mockSimulationEmpty);

      // When
      render(<SimulationCreationFrame {...mockFlowProps} />);

      // Then
      const input = screen.getByLabelText('Simulation name') as HTMLInputElement;
      expect(input.value).toBe(EXPECTED_REFORM_SIMULATION_LABEL);
    });

    test('given user edits prefilled label then custom label is used', async () => {
      // Given
      const user = userEvent.setup();
      mockReportState = mockReportStateReportWithName;
      mockSelectCurrentPosition.mockReturnValue(0);
      mockSelectSimulationAtPosition.mockReturnValue(mockSimulationEmpty);

      render(<SimulationCreationFrame {...mockFlowProps} />);

      // When - Clear and type new label
      const input = screen.getByLabelText('Simulation name');
      await user.clear(input);
      await user.type(input, 'Custom User Label');

      const submitButton = screen.getByRole('button', { name: /Create simulation/i });
      await user.click(submitButton);

      // Then
      expect(mockDispatch).toHaveBeenCalledWith(
        simulationsReducer.updateSimulationAtPosition({
          position: 0,
          updates: { label: 'Custom User Label' },
        })
      );
    });
  });
});
