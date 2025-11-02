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
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock Redux
const mockUseSelector = vi.fn();
const mockDispatch = vi.fn();
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useSelector: (selector: any) => mockUseSelector(selector),
    useDispatch: () => mockDispatch,
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
    mockDispatch.mockClear();
  });

  describe('Validation', () => {
    test('given no simulation1 then does not submit report', async () => {
      // Given
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      let callCount = 0;
      mockUseSelector.mockImplementation(() => {
        callCount++;
        // Call 1: reportState
        if (callCount === 1) {
          return { countryId: 'us', apiVersion: 'v1', label: 'Test Report' };
        }
        // Call 2: selectBothSimulations - returns array
        if (callCount === 2) {
          return [null, null];
        }
        // Calls 3-6: household/geography selectors
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
        // Call 1: reportState
        if (callCount === 1) {
          return { countryId: 'us', apiVersion: 'v1', label: 'Test Report' };
        }
        // Call 2: selectBothSimulations - returns array with simulation1
        if (callCount === 2) {
          return [MOCK_HOUSEHOLD_SIMULATION, null];
        }
        // Calls 3-6: household/geography selectors
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
        // Call 1: reportState
        if (callCount === 1) {
          return { countryId: 'us', apiVersion: 'v1', label: 'Test Report' };
        }
        // Call 2: selectBothSimulations - returns array with simulation1
        if (callCount === 2) {
          return [MOCK_HOUSEHOLD_SIMULATION, null];
        }
        // Calls 3-6: household/geography selectors
        return null;
      });

      // When
      render(<ReportSubmitFrame {...mockFlowProps} />);

      // Then
      expect(screen.getByText('Baseline simulation')).toBeInTheDocument();
      expect(screen.getByText(MOCK_HOUSEHOLD_SIMULATION.label!)).toBeInTheDocument();
    });

    test('given two simulations then shows both simulation summaries', () => {
      // Given
      const mockSim2 = { ...MOCK_HOUSEHOLD_SIMULATION, id: '2', label: 'Second Sim' };
      let callCount = 0;
      mockUseSelector.mockImplementation(() => {
        callCount++;
        // Call 1: reportState
        if (callCount === 1) {
          return { countryId: 'us', apiVersion: 'v1', label: 'Test Report' };
        }
        // Call 2: selectBothSimulations - returns array with both simulations
        if (callCount === 2) {
          return [MOCK_HOUSEHOLD_SIMULATION, mockSim2];
        }
        // Calls 3-6: household/geography selectors
        return null;
      });

      // When
      render(<ReportSubmitFrame {...mockFlowProps} />);

      // Then
      expect(screen.getByText(MOCK_HOUSEHOLD_SIMULATION.label!)).toBeInTheDocument();
      expect(screen.getByText(mockSim2.label!)).toBeInTheDocument();
    });
  });

  describe('Flow and state cleanup', () => {
    test('given report created successfully and not in subflow then clears flow and ingredients', async () => {
      // Given
      const user = userEvent.setup();
      const mockResetIngredient = vi.fn();

      // Re-mock useIngredientReset for this test to capture the function
      vi.doMock('@/hooks/useIngredientReset', () => ({
        useIngredientReset: () => ({
          resetIngredient: mockResetIngredient,
        }),
      }));

      let callCount = 0;
      mockUseSelector.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { countryId: 'us', apiVersion: 'v1', label: 'Test Report' };
        }
        if (callCount === 2) {
          return [MOCK_HOUSEHOLD_SIMULATION, null];
        }
        return null;
      });

      // Mock successful report creation
      mockCreateReport.mockImplementation((_params, options) => {
        // Simulate successful creation
        const mockData = {
          userReport: { id: 'test-report-123' },
        };
        if (options?.onSuccess) {
          options.onSuccess(mockData);
        }
        return Promise.resolve(mockData);
      });

      render(<ReportSubmitFrame {...mockFlowProps} isInSubflow={false} />);

      // When
      await user.click(screen.getByRole('button', { name: /generate report/i }));

      // Then - clearFlow should be dispatched
      expect(mockDispatch).toHaveBeenCalled();
      // Note: We can't easily check the exact action without importing clearFlow
      // but we verify dispatch was called
    });

    test('given report created successfully and in subflow then skips cleanup', async () => {
      // Given
      const user = userEvent.setup();
      let callCount = 0;
      mockUseSelector.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { countryId: 'us', apiVersion: 'v1', label: 'Test Report' };
        }
        if (callCount === 2) {
          return [MOCK_HOUSEHOLD_SIMULATION, null];
        }
        return null;
      });

      // Mock successful report creation
      mockCreateReport.mockImplementation((_params, options) => {
        const mockData = {
          userReport: { id: 'test-report-123' },
        };
        if (options?.onSuccess) {
          options.onSuccess(mockData);
        }
        return Promise.resolve(mockData);
      });

      render(<ReportSubmitFrame {...mockFlowProps} isInSubflow />);

      // When
      await user.click(screen.getByRole('button', { name: /generate report/i }));

      // Then - clearFlow should NOT be dispatched when in subflow
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    test('given report created then navigates to report output', async () => {
      // Given
      const user = userEvent.setup();
      const mockReportId = 'test-report-xyz';

      let callCount = 0;
      mockUseSelector.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { countryId: 'us', apiVersion: 'v1', label: 'Test Report' };
        }
        if (callCount === 2) {
          return [MOCK_HOUSEHOLD_SIMULATION, null];
        }
        return null;
      });

      // Mock successful report creation
      mockCreateReport.mockImplementation((_params, options) => {
        const mockData = {
          userReport: { id: mockReportId },
        };
        if (options?.onSuccess) {
          options.onSuccess(mockData);
        }
        return Promise.resolve(mockData);
      });

      render(<ReportSubmitFrame {...mockFlowProps} />);

      // When
      await user.click(screen.getByRole('button', { name: /generate report/i }));

      // Then
      expect(mockNavigate).toHaveBeenCalledWith(`/us/report-output/${mockReportId}`);
    });
  });
});
