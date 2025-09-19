import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import PolicySubmitFrame from '@/frames/policy/PolicySubmitFrame';
import * as policyReducer from '@/reducers/policyReducer';
import {
  createMockFlowProps,
  MOCK_EMPTY_POLICY,
  MOCK_POLICY_WITH_PARAMS,
  mockCreatePolicySuccessResponse,
  mockDispatch,
  mockOnReturn,
  mockSelectActivePolicy,
  mockSelectCurrentPosition,
  mockUseCreatePolicy,
} from '@/tests/fixtures/frames/policyFrameMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock selectors
vi.mock('@/reducers/activeSelectors', () => ({
  selectCurrentPosition: () => mockSelectCurrentPosition(),
  selectActivePolicy: () => mockSelectActivePolicy(),
}));

// Mock Redux
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (selector: any) => selector({}),
  };
});

// Mock useCreatePolicy hook
vi.mock('@/hooks/useCreatePolicy', () => ({
  useCreatePolicy: () => mockUseCreatePolicy,
}));

describe('PolicySubmitFrame', () => {
  const mockFlowProps = createMockFlowProps();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectCurrentPosition.mockReturnValue(0);
    mockSelectActivePolicy.mockReturnValue(MOCK_POLICY_WITH_PARAMS);
    mockUseCreatePolicy.createPolicy.mockClear();
    mockUseCreatePolicy.isPending = false;
  });

  test('given policy with parameters then displays all parameters in submission view', () => {
    // Given
    mockSelectActivePolicy.mockReturnValue(MOCK_POLICY_WITH_PARAMS);

    // When
    render(<PolicySubmitFrame {...mockFlowProps} />);

    // Then
    expect(screen.getByText('Review Policy')).toBeInTheDocument();
    expect(screen.getByText('income_tax_rate')).toBeInTheDocument();
    expect(screen.getByText(/0.25/)).toBeInTheDocument();
  });

  test('given empty policy then displays empty provisions list', () => {
    // Given
    mockSelectActivePolicy.mockReturnValue(MOCK_EMPTY_POLICY);

    // When
    render(<PolicySubmitFrame {...mockFlowProps} />);

    // Then
    expect(screen.getByText('Review Policy')).toBeInTheDocument();
    expect(screen.getByText('Provision')).toBeInTheDocument();
  });

  test('given user submits policy then creates policy and updates at position on success', async () => {
    // Given
    const user = userEvent.setup();
    mockSelectCurrentPosition.mockReturnValue(1);
    mockSelectActivePolicy.mockReturnValue(MOCK_POLICY_WITH_PARAMS);

    // Mock successful API call
    mockUseCreatePolicy.createPolicy.mockImplementation((_payload, options) => {
      options.onSuccess(mockCreatePolicySuccessResponse);
    });

    render(<PolicySubmitFrame {...mockFlowProps} />);

    // When
    const submitButton = screen.getByRole('button', { name: /Submit Policy/i });
    await user.click(submitButton);

    // Then
    expect(mockUseCreatePolicy.createPolicy).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith(
      policyReducer.updatePolicyAtPosition({
        position: 1,
        updates: {
          id: '123',
          isCreated: true,
        },
      })
    );
    expect(mockOnReturn).toHaveBeenCalled();
  });

  test('given standalone mode when policy submitted then clears policy at position after success', async () => {
    // Given
    const user = userEvent.setup();
    const flowProps = createMockFlowProps({ isInSubflow: false });
    mockSelectActivePolicy.mockReturnValue(MOCK_POLICY_WITH_PARAMS);

    // Mock successful API call
    mockUseCreatePolicy.createPolicy.mockImplementation((_payload, options) => {
      options.onSuccess(mockCreatePolicySuccessResponse);
    });

    render(<PolicySubmitFrame {...flowProps} />);

    // When
    const submitButton = screen.getByRole('button', { name: /Submit Policy/i });
    await user.click(submitButton);

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(policyReducer.clearPolicyAtPosition(0));
  });

  test('given subflow mode when policy submitted then does not clear policy', async () => {
    // Given
    const user = userEvent.setup();
    const flowProps = createMockFlowProps({ isInSubflow: true });
    mockSelectActivePolicy.mockReturnValue(MOCK_POLICY_WITH_PARAMS);

    // Mock successful API call
    mockUseCreatePolicy.createPolicy.mockImplementation((_payload, options) => {
      options.onSuccess(mockCreatePolicySuccessResponse);
    });

    render(<PolicySubmitFrame {...flowProps} />);

    // When
    const submitButton = screen.getByRole('button', { name: /Submit Policy/i });
    await user.click(submitButton);

    // Then
    expect(mockDispatch).not.toHaveBeenCalledWith(policyReducer.clearPolicyAtPosition(0));
  });

  test('given no policy at current position then does not submit', async () => {
    // Given
    const user = userEvent.setup();
    mockSelectActivePolicy.mockReturnValue(null);

    render(<PolicySubmitFrame {...mockFlowProps} />);

    // When
    const submitButton = screen.getByRole('button', { name: /Submit Policy/i });
    await user.click(submitButton);

    // Then
    expect(mockUseCreatePolicy.createPolicy).not.toHaveBeenCalled();
  });

  test('given policy submission is pending then shows loading state', () => {
    // Given
    mockUseCreatePolicy.isPending = true;

    // When
    render(<PolicySubmitFrame {...mockFlowProps} />);

    // Then
    const submitButton = screen.getByRole('button', { name: /Submit Policy/i });
    expect(submitButton).toHaveAttribute('data-loading', 'true');
  });
});
