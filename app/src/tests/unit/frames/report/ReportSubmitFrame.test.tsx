import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReportSubmitFrame from '@/frames/report/ReportSubmitFrame';
import { MOCK_HOUSEHOLD_SIMULATION } from '@/tests/fixtures/frames/ReportSetupFrame';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock useCreateReport hook
const mockCreateReport = vi.fn();
const mockIsPending = false;
vi.mock('@/hooks/useCreateReport', () => ({
  useCreateReport: () => ({
    createReport: mockCreateReport,
    isPending: mockIsPending,
  }),
}));

// Mock useIngredientReset hook
vi.mock('@/hooks/useIngredientReset', () => ({
  useIngredientReset: () => ({
    resetIngredient: vi.fn(),
  }),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock Redux
const mockUseSelector = vi.fn();
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useSelector: (selector: any) => mockUseSelector(selector),
  };
});

describe('ReportSubmitFrame', () => {
  const mockFlowProps = {
    onNavigate: vi.fn(),
    onReturn: vi.fn(),
    flowConfig: {
      component: 'ReportSubmitFrame' as any,
      on: {},
    },
    isInSubflow: false,
    flowDepth: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSelector.mockReturnValue(null);
  });

  describe('Validation', () => {
    test('given no simulation1 then does not submit report', async () => {
      // Given
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      let callCount = 0;
      mockUseSelector.mockImplementation(() => {
        callCount++;
        // Return report state on first call, null simulations after
        if (callCount === 1) {
          return { countryId: 'us', apiVersion: 'v1', label: 'Test Report' };
        }
        return null;
      });

      render(<ReportSubmitFrame {...mockFlowProps} />);

      // When
      await user.click(screen.getByRole('button', { name: /generate report/i }));

      // Then
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ReportSubmitFrame] Cannot submit report: no simulations configured'
      );
      expect(mockCreateReport).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('given simulation1 exists then allows submission', async () => {
      // Given
      const user = userEvent.setup();
      let callCount = 0;
      mockUseSelector.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { countryId: 'us', apiVersion: 'v1', label: 'Test Report' };
        }
        // First simulation selector call returns simulation
        if (callCount === 2) return MOCK_HOUSEHOLD_SIMULATION;
        // Second simulation selector call returns null
        return null;
      });

      render(<ReportSubmitFrame {...mockFlowProps} />);

      // When
      await user.click(screen.getByRole('button', { name: /generate report/i }));

      // Then
      expect(mockCreateReport).toHaveBeenCalled();
    });
  });

  describe('Display', () => {
    test('given one simulation then shows first simulation summary', () => {
      // Given
      let callCount = 0;
      mockUseSelector.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { countryId: 'us', apiVersion: 'v1', label: 'Test Report' };
        }
        if (callCount === 2) return MOCK_HOUSEHOLD_SIMULATION;
        return null;
      });

      // When
      render(<ReportSubmitFrame {...mockFlowProps} />);

      // Then
      expect(screen.getByText('First Simulation')).toBeInTheDocument();
      expect(screen.getByText(MOCK_HOUSEHOLD_SIMULATION.label!)).toBeInTheDocument();
    });

    test('given two simulations then shows both simulation summaries', () => {
      // Given
      const mockSim2 = { ...MOCK_HOUSEHOLD_SIMULATION, id: '2', label: 'Second Sim' };
      let callCount = 0;
      mockUseSelector.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { countryId: 'us', apiVersion: 'v1', label: 'Test Report' };
        }
        if (callCount === 2) return MOCK_HOUSEHOLD_SIMULATION;
        if (callCount === 3) return mockSim2;
        return null;
      });

      // When
      render(<ReportSubmitFrame {...mockFlowProps} />);

      // Then
      expect(screen.getByText(MOCK_HOUSEHOLD_SIMULATION.label!)).toBeInTheDocument();
      expect(screen.getByText(mockSim2.label!)).toBeInTheDocument();
    });
  });
});
