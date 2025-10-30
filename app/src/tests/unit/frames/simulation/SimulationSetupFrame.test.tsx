import { render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import SimulationSetupFrame from '@/frames/simulation/SimulationSetupFrame';
import {
  createReportModeMockSelector,
  createStandaloneMockSelector,
  MOCK_GEOGRAPHY_POPULATION,
  MOCK_HOUSEHOLD_POPULATION,
  MOCK_UNFILLED_POPULATION,
  UI_TEXT,
} from '@/tests/fixtures/frames/SimulationSetupFrameMocks';

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

describe('SimulationSetupFrame', () => {
  const mockOnNavigate = vi.fn();
  const mockFlowProps = {
    onNavigate: mockOnNavigate,
    onReturn: vi.fn(),
    flowConfig: {
      component: 'SimulationSetupFrame' as any,
      on: {},
    },
    isInSubflow: false,
    flowDepth: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Simulation 1 in standalone mode', () => {
    test('given simulation 1 in standalone mode then population title is normal', () => {
      // Given
      mockUseSelector.mockImplementation(createStandaloneMockSelector(MOCK_HOUSEHOLD_POPULATION));

      // When
      render(<SimulationSetupFrame {...mockFlowProps} />);

      // Then
      expect(screen.getByText(MOCK_HOUSEHOLD_POPULATION.label)).toBeInTheDocument();
      expect(screen.queryByText(new RegExp(UI_TEXT.FROM_BASELINE_SUFFIX))).not.toBeInTheDocument();
    });
  });

  describe('Simulation 2 in report mode', () => {
    test('given simulation 2 in report mode then population title includes from baseline', () => {
      // Given
      mockUseSelector.mockImplementation(createReportModeMockSelector(MOCK_HOUSEHOLD_POPULATION));

      // When
      render(<SimulationSetupFrame {...mockFlowProps} />);

      // Then
      const expectedText = `${MOCK_HOUSEHOLD_POPULATION.label} ${UI_TEXT.FROM_BASELINE_SUFFIX}`;
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });

    test('given simulation 2 in report with household then description shows inherited household', () => {
      // Given
      mockUseSelector.mockImplementation(createReportModeMockSelector(MOCK_HOUSEHOLD_POPULATION));

      // When
      render(<SimulationSetupFrame {...mockFlowProps} />);

      // Then
      expect(
        screen.getByText(
          new RegExp(
            `${UI_TEXT.INHERITED_HOUSEHOLD_PREFIX}${MOCK_HOUSEHOLD_POPULATION.household.id}`
          )
        )
      ).toBeInTheDocument();
      expect(screen.getByText(new RegExp(UI_TEXT.INHERITED_SUFFIX))).toBeInTheDocument();
    });

    test('given simulation 2 in report with geography then description shows inherited geography', () => {
      // Given
      mockUseSelector.mockImplementation(createReportModeMockSelector(MOCK_GEOGRAPHY_POPULATION));

      // When
      render(<SimulationSetupFrame {...mockFlowProps} />);

      // Then
      expect(
        screen.getByText(
          new RegExp(
            `${UI_TEXT.INHERITED_GEOGRAPHY_PREFIX}${MOCK_GEOGRAPHY_POPULATION.geography!.id}`
          )
        )
      ).toBeInTheDocument();
      expect(screen.getByText(new RegExp(UI_TEXT.INHERITED_SUFFIX))).toBeInTheDocument();
    });

    test('given simulation 2 without population then shows add population prompt', () => {
      // Given
      mockUseSelector.mockImplementation(createReportModeMockSelector(MOCK_UNFILLED_POPULATION));

      // When
      render(<SimulationSetupFrame {...mockFlowProps} />);

      // Then
      expect(screen.getByText(UI_TEXT.ADD_POPULATION)).toBeInTheDocument();
      expect(screen.getByText(UI_TEXT.SELECT_GEOGRAPHIC_OR_HOUSEHOLD)).toBeInTheDocument();
    });
  });
});
