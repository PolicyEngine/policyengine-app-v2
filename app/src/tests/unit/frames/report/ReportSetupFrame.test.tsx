import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReportSetupFrame from '@/frames/report/ReportSetupFrame';
import { setActiveSimulationPosition } from '@/reducers/reportReducer';
import { createSimulationAtPosition } from '@/reducers/simulationsReducer';
import {
  BASELINE_CONFIGURED_TITLE_PREFIX,
  BASELINE_SIMULATION_DESCRIPTION,
  BASELINE_SIMULATION_TITLE,
  COMPARISON_CONFIGURED_TITLE_PREFIX,
  COMPARISON_SIMULATION_OPTIONAL_DESCRIPTION,
  COMPARISON_SIMULATION_OPTIONAL_TITLE,
  COMPARISON_SIMULATION_REQUIRED_DESCRIPTION,
  COMPARISON_SIMULATION_REQUIRED_TITLE,
  COMPARISON_SIMULATION_WAITING_DESCRIPTION,
  COMPARISON_SIMULATION_WAITING_TITLE,
  MOCK_COMPARISON_SIMULATION,
  MOCK_GEOGRAPHY_SIMULATION,
  MOCK_HOUSEHOLD_SIMULATION,
  REVIEW_REPORT_LABEL,
  SETUP_BASELINE_SIMULATION_LABEL,
  SETUP_COMPARISON_SIMULATION_LABEL,
} from '@/tests/fixtures/frames/ReportSetupFrame';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock Redux
const mockDispatch = vi.fn();
const mockUseSelector = vi.fn();
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (selector: any) => mockUseSelector(selector),
  };
});

describe('ReportSetupFrame', () => {
  const mockOnNavigate = vi.fn();
  const mockFlowProps = {
    onNavigate: mockOnNavigate,
    onReturn: vi.fn(),
    flowConfig: {
      component: 'ReportSetupFrame' as any,
      on: {},
    },
    isInSubflow: false,
    flowDepth: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial state (no simulations)', () => {
    test('given no simulations configured then baseline card is enabled', () => {
      // Given
      mockUseSelector.mockReturnValue(null);

      // When
      render(<ReportSetupFrame {...mockFlowProps} />);

      // Then
      expect(screen.getByText(BASELINE_SIMULATION_TITLE)).toBeInTheDocument();
      expect(screen.getByText(BASELINE_SIMULATION_DESCRIPTION)).toBeInTheDocument();
    });

    test('given no simulations configured then comparison card shows waiting message', () => {
      // Given
      mockUseSelector.mockReturnValue(null);

      // When
      render(<ReportSetupFrame {...mockFlowProps} />);

      // Then
      expect(screen.getByText(COMPARISON_SIMULATION_WAITING_TITLE)).toBeInTheDocument();
      expect(screen.getByText(COMPARISON_SIMULATION_WAITING_DESCRIPTION)).toBeInTheDocument();
    });

    test('given no simulations configured then Review report button is disabled', () => {
      // Given
      mockUseSelector.mockReturnValue(null);

      // When
      render(<ReportSetupFrame {...mockFlowProps} />);

      // Then
      const reviewButton = screen.getByRole('button', { name: REVIEW_REPORT_LABEL });
      expect(reviewButton).toBeDisabled();
    });
  });

  describe('Household report (simulation1 configured)', () => {
    test('given household simulation configured then baseline card shows configured state', () => {
      // Given
      let callCount = 0;
      mockUseSelector.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? MOCK_HOUSEHOLD_SIMULATION : null;
      });

      // When
      render(<ReportSetupFrame {...mockFlowProps} />);

      // Then
      expect(
        screen.getByText(`${BASELINE_CONFIGURED_TITLE_PREFIX} ${MOCK_HOUSEHOLD_SIMULATION.label}`)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          `Policy #${MOCK_HOUSEHOLD_SIMULATION.policyId} • Population #${MOCK_HOUSEHOLD_SIMULATION.populationId}`
        )
      ).toBeInTheDocument();
    });

    test('given household simulation configured then comparison card shows optional', () => {
      // Given
      let callCount = 0;
      mockUseSelector.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? MOCK_HOUSEHOLD_SIMULATION : null;
      });

      // When
      render(<ReportSetupFrame {...mockFlowProps} />);

      // Then
      expect(screen.getByText(COMPARISON_SIMULATION_OPTIONAL_TITLE)).toBeInTheDocument();
      expect(screen.getByText(COMPARISON_SIMULATION_OPTIONAL_DESCRIPTION)).toBeInTheDocument();
    });

    test('given household simulation configured then Review report button is enabled', () => {
      // Given
      let callCount = 0;
      mockUseSelector.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? MOCK_HOUSEHOLD_SIMULATION : null;
      });

      // When
      render(<ReportSetupFrame {...mockFlowProps} />);

      // Then
      const reviewButton = screen.getByRole('button', { name: REVIEW_REPORT_LABEL });
      expect(reviewButton).toBeEnabled();
    });
  });

  describe('Geography report (simulation1 configured)', () => {
    test('given geography simulation configured then comparison card shows required', () => {
      // Given
      let callCount = 0;
      mockUseSelector.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? MOCK_GEOGRAPHY_SIMULATION : null;
      });

      // When
      render(<ReportSetupFrame {...mockFlowProps} />);

      // Then
      expect(screen.getByText(COMPARISON_SIMULATION_REQUIRED_TITLE)).toBeInTheDocument();
      expect(screen.getByText(COMPARISON_SIMULATION_REQUIRED_DESCRIPTION)).toBeInTheDocument();
    });

    test('given geography simulation configured but no comparison then Review report button is disabled', () => {
      // Given
      let callCount = 0;
      mockUseSelector.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? MOCK_GEOGRAPHY_SIMULATION : null;
      });

      // When
      render(<ReportSetupFrame {...mockFlowProps} />);

      // Then
      const reviewButton = screen.getByRole('button', { name: REVIEW_REPORT_LABEL });
      expect(reviewButton).toBeDisabled();
    });
  });

  describe('User interactions', () => {
    test('given user clicks baseline card when not configured then setup button appears', async () => {
      // Given
      const user = userEvent.setup();
      mockUseSelector.mockReturnValue(null);
      render(<ReportSetupFrame {...mockFlowProps} />);

      // When
      await user.click(screen.getByText(BASELINE_SIMULATION_TITLE));

      // Then
      expect(
        screen.getByRole('button', { name: SETUP_BASELINE_SIMULATION_LABEL })
      ).toBeInTheDocument();
    });

    test('given user clicks Setup baseline simulation then creates simulation and navigates', async () => {
      // Given
      const user = userEvent.setup();
      mockUseSelector.mockReturnValue(null);
      render(<ReportSetupFrame {...mockFlowProps} />);
      await user.click(screen.getByText(BASELINE_SIMULATION_TITLE));

      // When
      await user.click(screen.getByRole('button', { name: SETUP_BASELINE_SIMULATION_LABEL }));

      // Then
      expect(mockDispatch).toHaveBeenCalledWith(createSimulationAtPosition({ position: 0 }));
      expect(mockDispatch).toHaveBeenCalledWith(setActiveSimulationPosition(0));
      expect(mockOnNavigate).toHaveBeenCalledWith('setupSimulation1');
    });

    test('given user clicks comparison card when baseline configured then setup button appears', async () => {
      // Given
      const user = userEvent.setup();
      let callCount = 0;
      mockUseSelector.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? MOCK_HOUSEHOLD_SIMULATION : null;
      });
      render(<ReportSetupFrame {...mockFlowProps} />);

      // When
      await user.click(screen.getByText(COMPARISON_SIMULATION_OPTIONAL_TITLE));

      // Then
      expect(
        screen.getByRole('button', { name: SETUP_COMPARISON_SIMULATION_LABEL })
      ).toBeInTheDocument();
    });

    test('given user clicks Review report when household report ready then navigates to next', async () => {
      // Given
      const user = userEvent.setup();
      let callCount = 0;
      mockUseSelector.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? MOCK_HOUSEHOLD_SIMULATION : null;
      });
      render(<ReportSetupFrame {...mockFlowProps} />);

      // When
      await user.click(screen.getByRole('button', { name: REVIEW_REPORT_LABEL }));

      // Then
      expect(mockOnNavigate).toHaveBeenCalledWith('next');
    });
  });

  describe('Both simulations configured', () => {
    test('given both simulations configured then comparison card shows configured state', () => {
      // Given
      let callCount = 0;
      mockUseSelector.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? MOCK_HOUSEHOLD_SIMULATION : MOCK_COMPARISON_SIMULATION;
      });

      // When
      render(<ReportSetupFrame {...mockFlowProps} />);

      // Then
      expect(
        screen.getByText(
          `${COMPARISON_CONFIGURED_TITLE_PREFIX} ${MOCK_COMPARISON_SIMULATION.label}`
        )
      ).toBeInTheDocument();
    });

    test('given both geography simulations configured then Review report button is enabled', () => {
      // Given
      let callCount = 0;
      mockUseSelector.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return MOCK_GEOGRAPHY_SIMULATION;
        }
        if (callCount === 2) {
          return { ...MOCK_GEOGRAPHY_SIMULATION, id: '3', populationId: 'geography_2' };
        }
        return null;
      });

      // When
      render(<ReportSetupFrame {...mockFlowProps} />);

      // Then
      const reviewButton = screen.getByRole('button', { name: REVIEW_REPORT_LABEL });
      expect(reviewButton).toBeEnabled();
    });
  });
});
