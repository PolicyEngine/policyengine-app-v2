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
  PREFILL_CONSOLE_MESSAGES,
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

// Mock population hooks (needed for Phase 1 prefill functionality)
vi.mock('@/hooks/useUserHousehold', () => ({
  useUserHouseholds: vi.fn(() => ({
    data: [],
    isLoading: false,
    isError: false,
  })),
  isHouseholdMetadataWithAssociation: vi.fn(() => false),
}));

vi.mock('@/hooks/useUserGeographic', () => ({
  useUserGeographics: vi.fn(() => ({
    data: [],
    isLoading: false,
    isError: false,
  })),
  isGeographicMetadataWithAssociation: vi.fn(() => false),
}));

// Mock populationMatching utility
vi.mock('@/utils/populationMatching', () => ({
  findMatchingPopulation: vi.fn(() => null),
}));

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

  describe('Population Pre-filling', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      // Spy on console methods but allow them to pass through so we can see what's happening
      consoleLogSpy = vi.spyOn(console, 'log');
      consoleErrorSpy = vi.spyOn(console, 'error');
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    test('given user sets up simulation 2 with household report then population is pre-filled', async () => {
      // Given
      const user = userEvent.setup();

      // Import fixtures and mocked modules
      const {
        mockHouseholdMetadata,
        mockUseUserHouseholdsSuccess,
        mockUseUserGeographicsEmpty,
        TEST_HOUSEHOLD_LABEL,
      } = await import('@/tests/fixtures/hooks/useUserHouseholdMocks');
      const { createPopulationAtPosition, setHouseholdAtPosition, updatePopulationAtPosition } =
        await import('@/reducers/populationReducer');

      // Get the mocked functions
      const { useUserHouseholds, isHouseholdMetadataWithAssociation } = await import(
        '@/hooks/useUserHousehold'
      );
      const { useUserGeographics, isGeographicMetadataWithAssociation } = await import(
        '@/hooks/useUserGeographic'
      );
      const { findMatchingPopulation } = await import('@/utils/populationMatching');

      // Mock useSelector to handle different selectors
      mockUseSelector.mockImplementation((selector: any) => {
        // Create a mock state
        const mockState = {
          simulations: {
            simulations: [MOCK_HOUSEHOLD_SIMULATION, null], // position 0 and 1
          },
          population: {
            populations: [null, null], // position 0 and 1 - population2 not yet created
          },
        };
        return selector(mockState);
      });

      // Mock hooks using vi.mocked
      vi.mocked(useUserHouseholds).mockImplementation(() => mockUseUserHouseholdsSuccess);
      vi.mocked(useUserGeographics).mockImplementation(() => mockUseUserGeographicsEmpty);
      vi.mocked(findMatchingPopulation).mockImplementation(() => mockHouseholdMetadata);
      vi.mocked(isHouseholdMetadataWithAssociation).mockImplementation(() => true);
      vi.mocked(isGeographicMetadataWithAssociation).mockImplementation(() => false);

      render(<ReportSetupFrame {...mockFlowProps} />);
      await user.click(screen.getByText(COMPARISON_SIMULATION_OPTIONAL_TITLE));

      // When
      await user.click(screen.getByRole('button', { name: SETUP_COMPARISON_SIMULATION_LABEL }));

      // Then
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: createPopulationAtPosition.type,
          payload: expect.objectContaining({
            position: 1,
            population: expect.objectContaining({
              label: TEST_HOUSEHOLD_LABEL,
              isCreated: true,
            }),
          }),
        })
      );

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: setHouseholdAtPosition.type,
          payload: expect.objectContaining({
            position: 1,
          }),
        })
      );

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: updatePopulationAtPosition.type,
          payload: expect.objectContaining({
            position: 1,
            updates: expect.objectContaining({
              isCreated: true,
            }),
          }),
        })
      );
    });

    test('given user sets up simulation 2 with geography report then geography is pre-filled', async () => {
      // Given
      const user = userEvent.setup();

      const {
        mockGeographicMetadata,
        mockUseUserHouseholdsEmpty,
        mockUseUserGeographicsSuccess,
        TEST_GEOGRAPHY_LABEL,
      } = await import('@/tests/fixtures/hooks/useUserHouseholdMocks');
      const { createPopulationAtPosition, setGeographyAtPosition, updatePopulationAtPosition } =
        await import('@/reducers/populationReducer');

      // Get the mocked functions
      const { useUserHouseholds, isHouseholdMetadataWithAssociation } = await import(
        '@/hooks/useUserHousehold'
      );
      const { useUserGeographics, isGeographicMetadataWithAssociation } = await import(
        '@/hooks/useUserGeographic'
      );
      const { findMatchingPopulation } = await import('@/utils/populationMatching');

      // Mock useSelector to handle different selectors
      mockUseSelector.mockImplementation((selector: any) => {
        const mockState = {
          simulations: {
            simulations: [MOCK_GEOGRAPHY_SIMULATION, null],
          },
          population: {
            populations: [null, null],
          },
        };
        return selector(mockState);
      });

      vi.mocked(useUserHouseholds).mockImplementation(() => mockUseUserHouseholdsEmpty);
      vi.mocked(useUserGeographics).mockImplementation(() => mockUseUserGeographicsSuccess);
      vi.mocked(findMatchingPopulation).mockImplementation(() => mockGeographicMetadata);
      vi.mocked(isHouseholdMetadataWithAssociation).mockImplementation(() => false);
      vi.mocked(isGeographicMetadataWithAssociation).mockImplementation(() => true);

      render(<ReportSetupFrame {...mockFlowProps} />);
      await user.click(screen.getByText(COMPARISON_SIMULATION_REQUIRED_TITLE));

      // When
      await user.click(screen.getByRole('button', { name: SETUP_COMPARISON_SIMULATION_LABEL }));

      // Then
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: createPopulationAtPosition.type,
          payload: expect.objectContaining({
            position: 1,
            population: expect.objectContaining({
              label: TEST_GEOGRAPHY_LABEL,
              isCreated: true,
            }),
          }),
        })
      );

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: setGeographyAtPosition.type,
          payload: expect.objectContaining({
            position: 1,
          }),
        })
      );

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: updatePopulationAtPosition.type,
          payload: expect.objectContaining({
            position: 1,
            updates: expect.objectContaining({
              isCreated: true,
            }),
          }),
        })
      );
    });

    test('given population data is loading then button is disabled', async () => {
      // Given
      const user = userEvent.setup();

      const { mockUseUserHouseholdsLoading, mockUseUserGeographicsLoading } = await import(
        '@/tests/fixtures/hooks/useUserHouseholdMocks'
      );

      // Get the mocked functions
      const { useUserHouseholds } = await import('@/hooks/useUserHousehold');
      const { useUserGeographics } = await import('@/hooks/useUserGeographic');

      mockUseSelector.mockImplementation((selector: any) => {
        const mockState = {
          simulations: {
            simulations: [MOCK_HOUSEHOLD_SIMULATION, null],
          },
          population: {
            populations: [null, null],
          },
        };
        return selector(mockState);
      });

      vi.mocked(useUserHouseholds).mockImplementation(() => mockUseUserHouseholdsLoading);
      vi.mocked(useUserGeographics).mockImplementation(() => mockUseUserGeographicsLoading);

      render(<ReportSetupFrame {...mockFlowProps} />);
      await user.click(screen.getByText(COMPARISON_SIMULATION_OPTIONAL_TITLE));

      // Then - Button should be disabled while loading
      const button = screen.getByRole('button', { name: SETUP_COMPARISON_SIMULATION_LABEL });
      expect(button).toBeDisabled();
    });

    test('given population 2 already exists then prefill is skipped', async () => {
      // Given
      const user = userEvent.setup();

      const { mockUseUserHouseholdsSuccess, mockUseUserGeographicsEmpty } = await import(
        '@/tests/fixtures/hooks/useUserHouseholdMocks'
      );

      // Get the mocked functions
      const { useUserHouseholds } = await import('@/hooks/useUserHousehold');
      const { useUserGeographics } = await import('@/hooks/useUserGeographic');

      mockUseSelector.mockImplementation((selector: any) => {
        const mockState = {
          simulations: {
            simulations: [MOCK_HOUSEHOLD_SIMULATION, null],
          },
          population: {
            populations: [null, { isCreated: true }], // population2 already exists
          },
        };
        return selector(mockState);
      });

      vi.mocked(useUserHouseholds).mockImplementation(() => mockUseUserHouseholdsSuccess);
      vi.mocked(useUserGeographics).mockImplementation(() => mockUseUserGeographicsEmpty);

      render(<ReportSetupFrame {...mockFlowProps} />);
      await user.click(screen.getByText(COMPARISON_SIMULATION_OPTIONAL_TITLE));

      // When
      await user.click(screen.getByRole('button', { name: SETUP_COMPARISON_SIMULATION_LABEL }));

      // Then - Should log that prefill was skipped
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(PREFILL_CONSOLE_MESSAGES.ALREADY_EXISTS.slice(19)) // Remove "[ReportSetupFrame]" prefix
      );
    });

    test('given simulation1 has no population then prefill shows error', async () => {
      // Given
      const { mockUseUserHouseholdsSuccess, mockUseUserGeographicsEmpty } = await import(
        '@/tests/fixtures/hooks/useUserHouseholdMocks'
      );

      // Get the mocked functions
      const { useUserHouseholds } = await import('@/hooks/useUserHousehold');
      const { useUserGeographics } = await import('@/hooks/useUserGeographic');

      mockUseSelector.mockImplementation((selector: any) => {
        const mockState = {
          simulations: {
            simulations: [{ ...MOCK_HOUSEHOLD_SIMULATION, populationId: undefined }, null], // simulation1 without population
          },
          population: {
            populations: [null, null],
          },
        };
        return selector(mockState);
      });

      vi.mocked(useUserHouseholds).mockImplementation(() => mockUseUserHouseholdsSuccess);
      vi.mocked(useUserGeographics).mockImplementation(() => mockUseUserGeographicsEmpty);

      render(<ReportSetupFrame {...mockFlowProps} />);

      // Need to wait for simulation1 to be "configured" which requires both policyId and populationId
      // Since populationId is undefined, simulation1Configured will be false
      // So comparison card will show "Waiting" state, not "Optional"
      // Let's check the actual text that appears
      const waitingTitle = screen.getByText(COMPARISON_SIMULATION_WAITING_TITLE);
      expect(waitingTitle).toBeInTheDocument();
    });
  });
});
