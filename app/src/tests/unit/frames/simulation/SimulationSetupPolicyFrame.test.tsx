import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import SimulationSetupPolicyFrame from '@/frames/simulation/SimulationSetupPolicyFrame';
import { createPolicyAtPosition } from '@/reducers/policyReducer';
import {
  BUTTON_ORDER,
  BUTTON_TEXT,
  createMockSimulationSetupPolicyState,
  expectedCurrentLawPolicyUK,
  expectedCurrentLawPolicyUS,
  mockDispatch,
  mockOnNavigate,
  TEST_COUNTRIES,
  TEST_CURRENT_LAW_IDS,
} from '@/tests/fixtures/frames/SimulationSetupPolicyFrameMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock useCurrentCountry hook
const mockUseCurrentCountry = vi.fn();
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: () => mockUseCurrentCountry(),
}));

// Mock useCancelFlow hook
const mockHandleCancel = vi.fn();
vi.mock('@/hooks/useCancelFlow', () => ({
  useCancelFlow: () => ({ handleCancel: mockHandleCancel }),
}));

// Mock Redux
const mockUseSelector = vi.fn();
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (selector: any) => mockUseSelector(selector),
  };
});

describe('SimulationSetupPolicyFrame', () => {
  const mockFlowProps = {
    onNavigate: mockOnNavigate,
    onReturn: vi.fn(),
    flowConfig: {
      component: 'SimulationSetupPolicyFrame' as any,
      on: {},
    },
    isInSubflow: false,
    flowDepth: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnNavigate.mockClear();
    mockDispatch.mockClear();
    mockUseCurrentCountry.mockClear();
    mockUseSelector.mockClear();
  });

  describe('Button rendering', () => {
    test('given frame loads then all three policy options are visible', () => {
      // Given
      const mockState = createMockSimulationSetupPolicyState();
      mockUseSelector.mockImplementation((selector: any) => selector(mockState));
      mockUseCurrentCountry.mockReturnValue(TEST_COUNTRIES.US);

      // When
      render(<SimulationSetupPolicyFrame {...mockFlowProps} />);

      // Then
      expect(screen.getByText('Load Existing Policy')).toBeInTheDocument();
      expect(screen.getByText('Create New Policy')).toBeInTheDocument();
      expect(screen.getByText('Current Law')).toBeInTheDocument();
    });

    test('given frame loads then current law description is correct', () => {
      // Given
      const mockState = createMockSimulationSetupPolicyState();
      mockUseSelector.mockImplementation((selector: any) => selector(mockState));
      mockUseCurrentCountry.mockReturnValue(TEST_COUNTRIES.US);

      // When
      render(<SimulationSetupPolicyFrame {...mockFlowProps} />);

      // Then
      expect(
        screen.getByText('Use the baseline tax-benefit system with no reforms')
      ).toBeInTheDocument();
    });

    test('given frame loads then Current Law appears first in button order', () => {
      // Given
      const mockState = createMockSimulationSetupPolicyState();
      mockUseSelector.mockImplementation((selector: any) => selector(mockState));
      mockUseCurrentCountry.mockReturnValue(TEST_COUNTRIES.US);

      // When
      const { container } = render(<SimulationSetupPolicyFrame {...mockFlowProps} />);

      // Then
      const buttons = container.querySelectorAll('button[class*="Card"]');
      expect(buttons.length).toBe(3);

      // First button should be Current Law
      expect(buttons[BUTTON_ORDER.CURRENT_LAW]).toHaveTextContent(BUTTON_TEXT.CURRENT_LAW.title);
      expect(buttons[BUTTON_ORDER.CURRENT_LAW]).toHaveTextContent(
        BUTTON_TEXT.CURRENT_LAW.description
      );

      // Second button should be Load Existing Policy
      expect(buttons[BUTTON_ORDER.LOAD_EXISTING]).toHaveTextContent(
        BUTTON_TEXT.LOAD_EXISTING.title
      );
      expect(buttons[BUTTON_ORDER.LOAD_EXISTING]).toHaveTextContent(
        BUTTON_TEXT.LOAD_EXISTING.description
      );

      // Third button should be Create New Policy
      expect(buttons[BUTTON_ORDER.CREATE_NEW]).toHaveTextContent(BUTTON_TEXT.CREATE_NEW.title);
      expect(buttons[BUTTON_ORDER.CREATE_NEW]).toHaveTextContent(
        BUTTON_TEXT.CREATE_NEW.description
      );
    });
  });

  describe('User interactions', () => {
    test('given user selects load existing and clicks next then navigates to loadExisting', async () => {
      // Given
      const user = userEvent.setup();
      const mockState = createMockSimulationSetupPolicyState();
      mockUseSelector.mockImplementation((selector: any) => selector(mockState));
      mockUseCurrentCountry.mockReturnValue(TEST_COUNTRIES.US);

      render(<SimulationSetupPolicyFrame {...mockFlowProps} />);

      // When
      const loadExistingButton = screen.getByText('Load Existing Policy');
      await user.click(loadExistingButton);

      const nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      // Then
      expect(mockOnNavigate).toHaveBeenCalledWith('loadExisting');
      expect(mockDispatch).not.toHaveBeenCalled(); // No policy creation for existing
    });

    test('given user selects create new and clicks next then navigates to createNew', async () => {
      // Given
      const user = userEvent.setup();
      const mockState = createMockSimulationSetupPolicyState();
      mockUseSelector.mockImplementation((selector: any) => selector(mockState));
      mockUseCurrentCountry.mockReturnValue(TEST_COUNTRIES.US);

      render(<SimulationSetupPolicyFrame {...mockFlowProps} />);

      // When
      const createNewButton = screen.getByText('Create New Policy');
      await user.click(createNewButton);

      const nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      // Then
      expect(mockOnNavigate).toHaveBeenCalledWith('createNew');
      expect(mockDispatch).not.toHaveBeenCalled(); // No policy creation for new
    });

    test('given no selection made then next button is disabled', () => {
      // Given
      const mockState = createMockSimulationSetupPolicyState();
      mockUseSelector.mockImplementation((selector: any) => selector(mockState));
      mockUseCurrentCountry.mockReturnValue(TEST_COUNTRIES.US);

      // When
      render(<SimulationSetupPolicyFrame {...mockFlowProps} />);

      // Then
      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Current Law selection - US', () => {
    test('given US user selects current law and clicks next then creates US current law policy', async () => {
      // Given
      const user = userEvent.setup();
      const mockState = createMockSimulationSetupPolicyState({
        countryId: TEST_COUNTRIES.US,
        currentLawId: TEST_CURRENT_LAW_IDS.US,
      });
      mockUseSelector.mockImplementation((selector: any) => selector(mockState));
      mockUseCurrentCountry.mockReturnValue(TEST_COUNTRIES.US);

      render(<SimulationSetupPolicyFrame {...mockFlowProps} />);

      // When
      const currentLawButton = screen.getByText('Current Law');
      await user.click(currentLawButton);

      const nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      // Then
      expect(mockDispatch).toHaveBeenCalledWith(
        createPolicyAtPosition({
          position: 0,
          policy: expectedCurrentLawPolicyUS,
        })
      );
      expect(mockOnNavigate).toHaveBeenCalledWith('selectCurrentLaw');
    });

    test('given US user in report mode at position 1 then creates policy at position 1', async () => {
      // Given
      const user = userEvent.setup();
      const mockState = createMockSimulationSetupPolicyState({
        countryId: TEST_COUNTRIES.US,
        currentLawId: TEST_CURRENT_LAW_IDS.US,
        mode: 'report',
        activeSimulationPosition: 1,
      });
      mockUseSelector.mockImplementation((selector: any) => selector(mockState));
      mockUseCurrentCountry.mockReturnValue(TEST_COUNTRIES.US);

      render(<SimulationSetupPolicyFrame {...mockFlowProps} />);

      // When
      const currentLawButton = screen.getByText('Current Law');
      await user.click(currentLawButton);

      const nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      // Then
      expect(mockDispatch).toHaveBeenCalledWith(
        createPolicyAtPosition({
          position: 1,
          policy: expectedCurrentLawPolicyUS,
        })
      );
    });
  });

  describe('Current Law selection - UK', () => {
    test('given UK user selects current law and clicks next then creates UK current law policy', async () => {
      // Given
      const user = userEvent.setup();
      const mockState = createMockSimulationSetupPolicyState({
        countryId: TEST_COUNTRIES.UK,
        currentLawId: TEST_CURRENT_LAW_IDS.UK,
      });
      mockUseSelector.mockImplementation((selector: any) => selector(mockState));
      mockUseCurrentCountry.mockReturnValue(TEST_COUNTRIES.UK);

      render(<SimulationSetupPolicyFrame {...mockFlowProps} />);

      // When
      const currentLawButton = screen.getByText('Current Law');
      await user.click(currentLawButton);

      const nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      // Then
      expect(mockDispatch).toHaveBeenCalledWith(
        createPolicyAtPosition({
          position: 0,
          policy: expectedCurrentLawPolicyUK,
        })
      );
      expect(mockOnNavigate).toHaveBeenCalledWith('selectCurrentLaw');
    });

    test('given UK user in report mode at position 1 then creates policy at position 1', async () => {
      // Given
      const user = userEvent.setup();
      const mockState = createMockSimulationSetupPolicyState({
        countryId: TEST_COUNTRIES.UK,
        currentLawId: TEST_CURRENT_LAW_IDS.UK,
        mode: 'report',
        activeSimulationPosition: 1,
      });
      mockUseSelector.mockImplementation((selector: any) => selector(mockState));
      mockUseCurrentCountry.mockReturnValue(TEST_COUNTRIES.UK);

      render(<SimulationSetupPolicyFrame {...mockFlowProps} />);

      // When
      const currentLawButton = screen.getByText('Current Law');
      await user.click(currentLawButton);

      const nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      // Then
      expect(mockDispatch).toHaveBeenCalledWith(
        createPolicyAtPosition({
          position: 1,
          policy: expectedCurrentLawPolicyUK,
        })
      );
    });
  });

  describe('Current Law policy structure', () => {
    test('given current law selected then policy has empty parameters array', async () => {
      // Given
      const user = userEvent.setup();
      const mockState = createMockSimulationSetupPolicyState();
      mockUseSelector.mockImplementation((selector: any) => selector(mockState));
      mockUseCurrentCountry.mockReturnValue(TEST_COUNTRIES.US);

      render(<SimulationSetupPolicyFrame {...mockFlowProps} />);

      // When
      await user.click(screen.getByText('Current Law'));
      await user.click(screen.getByRole('button', { name: /Next/i }));

      // Then
      const dispatchCall = mockDispatch.mock.calls[0][0];
      expect(dispatchCall.payload.policy.parameters).toEqual([]);
    });

    test('given current law selected then policy is marked as created', async () => {
      // Given
      const user = userEvent.setup();
      const mockState = createMockSimulationSetupPolicyState();
      mockUseSelector.mockImplementation((selector: any) => selector(mockState));
      mockUseCurrentCountry.mockReturnValue(TEST_COUNTRIES.US);

      render(<SimulationSetupPolicyFrame {...mockFlowProps} />);

      // When
      await user.click(screen.getByText('Current Law'));
      await user.click(screen.getByRole('button', { name: /Next/i }));

      // Then
      const dispatchCall = mockDispatch.mock.calls[0][0];
      expect(dispatchCall.payload.policy.isCreated).toBe(true);
    });

    test('given current law selected then policy has correct label', async () => {
      // Given
      const user = userEvent.setup();
      const mockState = createMockSimulationSetupPolicyState();
      mockUseSelector.mockImplementation((selector: any) => selector(mockState));
      mockUseCurrentCountry.mockReturnValue(TEST_COUNTRIES.US);

      render(<SimulationSetupPolicyFrame {...mockFlowProps} />);

      // When
      await user.click(screen.getByText('Current Law'));
      await user.click(screen.getByRole('button', { name: /Next/i }));

      // Then
      const dispatchCall = mockDispatch.mock.calls[0][0];
      expect(dispatchCall.payload.policy.label).toBe('Current law');
    });
  });
});
