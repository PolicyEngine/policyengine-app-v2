import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CURRENT_YEAR } from '@/constants';
import SimulationSelectExistingPolicyFrame from '@/frames/simulation/SimulationSelectExistingPolicyFrame';
import * as policyReducer from '@/reducers/policyReducer';
import { mockDispatch, mockOnNavigate } from '@/tests/fixtures/frames/simulationFrameMocks';
// Import mock data separately after mocks are set up
import {
  mockErrorResponse,
  mockLoadingResponse,
  mockPolicyData,
  mockSuccessResponse,
} from '@/tests/fixtures/frames/simulationSelectExistingMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock selector function
const mockSelectCurrentPosition = vi.fn();

// Mock selectors
vi.mock('@/reducers/activeSelectors', () => ({
  selectCurrentPosition: () => mockSelectCurrentPosition(),
}));

vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (selector: any) => selector({}),
  };
});

// Mock the useUserPolicies hook
const mockUserPolicies = vi.fn();
vi.mock('@/hooks/useUserPolicy', () => ({
  useUserPolicies: () => mockUserPolicies(),
  isPolicyMetadataWithAssociation: (policy: any) => policy && policy.policy && policy.association,
}));

// Mock useBackButton hook
const mockHandleBack = vi.fn();
vi.mock('@/hooks/useBackButton', () => ({
  useBackButton: vi.fn(() => ({ handleBack: mockHandleBack, canGoBack: false })),
}));

// Mock useCancelFlow
const mockHandleCancel = vi.fn();
vi.mock('@/hooks/useCancelFlow', () => ({
  useCancelFlow: vi.fn(() => ({ handleCancel: mockHandleCancel })),
}));

describe('SimulationSelectExistingPolicyFrame', () => {
  const mockFlowProps = {
    onNavigate: mockOnNavigate,
    onReturn: vi.fn(),
    flowConfig: {
      component: 'SimulationSelectExistingPolicyFrame' as any,
      on: {},
    },
    isInSubflow: false,
    flowDepth: 0,
  };

  beforeEach(() => {
    mockHandleCancel.mockClear();
    vi.clearAllMocks();
    mockOnNavigate.mockClear();
    mockDispatch.mockClear();
    mockSelectCurrentPosition.mockClear();
    mockUserPolicies.mockClear();
  });

  test('given policies are loading then displays loading message', () => {
    // Given
    mockSelectCurrentPosition.mockReturnValue(0);
    mockUserPolicies.mockReturnValue(mockLoadingResponse);

    // When
    render(<SimulationSelectExistingPolicyFrame {...mockFlowProps} />);

    // Then
    expect(screen.getByText('Loading policies...')).toBeInTheDocument();
  });

  test('given error loading policies then displays error message', () => {
    // Given
    mockSelectCurrentPosition.mockReturnValue(0);
    mockUserPolicies.mockReturnValue(mockErrorResponse('Failed to fetch'));

    // When
    render(<SimulationSelectExistingPolicyFrame {...mockFlowProps} />);

    // Then
    expect(screen.getByText(/Error: Failed to fetch/)).toBeInTheDocument();
  });

  test('given no policies exist then displays empty state message', () => {
    // Given
    mockSelectCurrentPosition.mockReturnValue(0);
    mockUserPolicies.mockReturnValue(mockSuccessResponse([]));

    // When
    render(<SimulationSelectExistingPolicyFrame {...mockFlowProps} />);

    // Then
    expect(
      screen.getByText('No policies available. Please create a new policy.')
    ).toBeInTheDocument();
  });

  test('given user selects policy with parameters and submits then creates policy at position and adds parameters', async () => {
    // Given
    const user = userEvent.setup();
    mockSelectCurrentPosition.mockReturnValue(1); // Report mode, position 1
    mockUserPolicies.mockReturnValue(mockSuccessResponse(mockPolicyData));

    render(<SimulationSelectExistingPolicyFrame {...mockFlowProps} />);

    // When
    const policyCard = screen.getByText('My Tax Reform');
    await user.click(policyCard);

    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(
      policyReducer.createPolicyAtPosition({
        position: 1,
        policy: expect.objectContaining({
          id: '123',
          label: 'My Tax Reform',
          isCreated: true,
        }),
      })
    );

    expect(mockDispatch).toHaveBeenCalledWith(
      policyReducer.addPolicyParamAtPosition({
        position: 1,
        name: 'income_tax_rate',
        valueInterval: {
          startDate: `${CURRENT_YEAR}-01-01`,
          endDate: `${CURRENT_YEAR}-12-31`,
          value: 0.25,
        },
      })
    );

    expect(mockOnNavigate).toHaveBeenCalledWith('next');
  });

  test('given standalone mode when user selects policy then creates policy at position 0', async () => {
    // Given
    const user = userEvent.setup();
    mockSelectCurrentPosition.mockReturnValue(0); // Standalone mode
    mockUserPolicies.mockReturnValue(mockSuccessResponse(mockPolicyData));

    render(<SimulationSelectExistingPolicyFrame {...mockFlowProps} />);

    // When
    const policyCard = screen.getByText('Empty Policy');
    await user.click(policyCard);

    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(
      policyReducer.createPolicyAtPosition({
        position: 0,
        policy: expect.objectContaining({
          id: '456',
        }),
      })
    );
  });
});
