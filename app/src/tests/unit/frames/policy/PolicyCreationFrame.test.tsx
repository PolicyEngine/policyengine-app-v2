import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import PolicyCreationFrame from '@/frames/policy/PolicyCreationFrame';
import * as policyReducer from '@/reducers/policyReducer';
import * as reportReducer from '@/reducers/reportReducer';
import {
  createMockFlowProps,
  mockDispatch,
  mockOnNavigate,
  mockSelectCurrentPosition,
} from '@/tests/fixtures/frames/policyFrameMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock selectors
vi.mock('@/reducers/activeSelectors', () => ({
  selectCurrentPosition: () => mockSelectCurrentPosition(),
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

describe('PolicyCreationFrame', () => {
  const mockFlowProps = createMockFlowProps();

  beforeEach(() => {
    mockHandleCancel.mockClear();
    vi.clearAllMocks();
    mockSelectCurrentPosition.mockReturnValue(0);
  });

  test('given component mounts in standalone mode then sets mode to standalone and creates policy at position', () => {
    // Given
    const flowProps = createMockFlowProps({ isInSubflow: false });

    // When
    render(<PolicyCreationFrame {...flowProps} />);

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(reportReducer.setMode('standalone'));
    expect(mockDispatch).toHaveBeenCalledWith(
      policyReducer.createPolicyAtPosition({ position: 0 })
    );
  });

  test('given component mounts in subflow then does not set mode and creates policy at current position', () => {
    // Given
    const flowProps = createMockFlowProps({ isInSubflow: true });
    mockSelectCurrentPosition.mockReturnValue(1);

    // When
    render(<PolicyCreationFrame {...flowProps} />);

    // Then
    expect(mockDispatch).not.toHaveBeenCalledWith(reportReducer.setMode('standalone'));
    expect(mockDispatch).toHaveBeenCalledWith(
      policyReducer.createPolicyAtPosition({ position: 1 })
    );
  });

  test('given user enters policy label and submits then updates policy at position and navigates', async () => {
    // Given
    const user = userEvent.setup();
    render(<PolicyCreationFrame {...mockFlowProps} />);

    // When
    const input = screen.getByLabelText('Policy title');
    await user.type(input, 'My New Tax Policy');

    const submitButton = screen.getByRole('button', { name: /Create a policy/i });
    await user.click(submitButton);

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(
      policyReducer.updatePolicyAtPosition({
        position: 0,
        updates: { label: 'My New Tax Policy' },
      })
    );
    expect(mockOnNavigate).toHaveBeenCalledWith('next');
  });

  test('given empty label and user submits then updates with empty label and navigates', async () => {
    // Given
    const user = userEvent.setup();
    render(<PolicyCreationFrame {...mockFlowProps} />);

    // When
    const submitButton = screen.getByRole('button', { name: /Create a policy/i });
    await user.click(submitButton);

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(
      policyReducer.updatePolicyAtPosition({
        position: 0,
        updates: { label: '' },
      })
    );
    expect(mockOnNavigate).toHaveBeenCalledWith('next');
  });

  test('given report mode position 1 then creates policy at position 1', () => {
    // Given
    mockSelectCurrentPosition.mockReturnValue(1);

    // When
    render(<PolicyCreationFrame {...mockFlowProps} />);

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(
      policyReducer.createPolicyAtPosition({ position: 1 })
    );
  });
});
