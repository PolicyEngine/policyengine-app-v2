import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import PolicyCreationFrame from '@/frames/policy/PolicyCreationFrame';
import * as policyReducer from '@/reducers/policyReducer';
import * as reportReducer from '@/reducers/reportReducer';
import {
  createMockFlowProps,
  EXPECTED_BASELINE_POLICY_LABEL,
  EXPECTED_BASELINE_WITH_REPORT_LABEL,
  EXPECTED_REFORM_POLICY_LABEL,
  EXPECTED_REFORM_WITH_REPORT_LABEL,
  mockDispatch,
  mockOnNavigate,
  mockReportStateReportWithName,
  mockReportStateReportWithoutName,
  mockReportStateStandalone,
  mockSelectCurrentPosition,
} from '@/tests/fixtures/frames/policyFrameMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock selectors
let mockReportState: any = mockReportStateStandalone;

vi.mock('@/reducers/activeSelectors', () => ({
  selectCurrentPosition: () => mockSelectCurrentPosition(),
}));

const mockSelectPolicyAtPosition = vi.fn();

vi.mock('@/reducers/policyReducer', async () => {
  const actual = await vi.importActual('@/reducers/policyReducer');
  return {
    ...actual,
    selectPolicyAtPosition: (_state: any, position: number) => mockSelectPolicyAtPosition(position),
  };
});

// Mock Redux
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (selector: any) => selector({ report: mockReportState }),
  };
});

describe('PolicyCreationFrame', () => {
  const mockFlowProps = createMockFlowProps();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectCurrentPosition.mockReturnValue(0);
    mockSelectPolicyAtPosition.mockReturnValue(null);
  });

  test('given component mounts in standalone mode with no existing policy then sets mode and creates policy', () => {
    // Given
    const flowProps = createMockFlowProps({ isInSubflow: false });
    mockSelectPolicyAtPosition.mockReturnValue(null);

    // When
    render(<PolicyCreationFrame {...flowProps} />);

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(reportReducer.setMode('standalone'));
    expect(mockDispatch).toHaveBeenCalledWith(
      policyReducer.createPolicyAtPosition({ position: 0 })
    );
  });

  test('given component mounts in subflow with no existing policy then does not set mode but creates policy', () => {
    // Given
    const flowProps = createMockFlowProps({ isInSubflow: true });
    mockSelectCurrentPosition.mockReturnValue(1);
    mockSelectPolicyAtPosition.mockReturnValue(null);

    // When
    render(<PolicyCreationFrame {...flowProps} />);

    // Then
    expect(mockDispatch).not.toHaveBeenCalledWith(reportReducer.setMode('standalone'));
    expect(mockDispatch).toHaveBeenCalledWith(
      policyReducer.createPolicyAtPosition({ position: 1 })
    );
  });

  test('given component mounts with existing policy then does not create policy', () => {
    // Given
    const existingPolicy = { id: '123', label: 'Existing Policy', parameters: [] };
    mockSelectPolicyAtPosition.mockReturnValue(existingPolicy);

    // When
    render(<PolicyCreationFrame {...mockFlowProps} />);

    // Then
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: expect.stringContaining('createPolicyAtPosition') })
    );
  });

  test('given user enters policy label and submits then updates policy at position and navigates', async () => {
    // Given
    const user = userEvent.setup();
    mockReportState = mockReportStateStandalone;
    mockSelectCurrentPosition.mockReturnValue(0);
    render(<PolicyCreationFrame {...mockFlowProps} />);

    // When - Clear prefilled label and type new one
    const input = screen.getByLabelText('Policy title');
    await user.clear(input);
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

  test('given user clears label and submits then updates with empty label and navigates', async () => {
    // Given
    const user = userEvent.setup();
    mockReportState = mockReportStateStandalone;
    mockSelectCurrentPosition.mockReturnValue(0);
    render(<PolicyCreationFrame {...mockFlowProps} />);

    // When - Clear the prefilled label
    const input = screen.getByLabelText('Policy title');
    await user.clear(input);

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

  describe('Auto-naming behavior', () => {
    test('given standalone mode at position 0 then prefills with baseline policy label', () => {
      // Given
      mockReportState = mockReportStateStandalone;
      mockSelectCurrentPosition.mockReturnValue(0);
      mockSelectPolicyAtPosition.mockReturnValue(null);

      // When
      render(<PolicyCreationFrame {...mockFlowProps} />);

      // Then
      const input = screen.getByLabelText('Policy title') as HTMLInputElement;
      expect(input.value).toBe(EXPECTED_BASELINE_POLICY_LABEL);
    });

    test('given standalone mode at position 1 then prefills with reform policy label', () => {
      // Given
      mockReportState = mockReportStateStandalone;
      mockSelectCurrentPosition.mockReturnValue(1);
      mockSelectPolicyAtPosition.mockReturnValue(null);

      // When
      render(<PolicyCreationFrame {...mockFlowProps} />);

      // Then
      const input = screen.getByLabelText('Policy title') as HTMLInputElement;
      expect(input.value).toBe(EXPECTED_REFORM_POLICY_LABEL);
    });

    test('given report mode with report name at position 0 then prefills with report name and baseline', () => {
      // Given
      mockReportState = mockReportStateReportWithName;
      mockSelectCurrentPosition.mockReturnValue(0);
      mockSelectPolicyAtPosition.mockReturnValue(null);

      // When
      render(<PolicyCreationFrame {...mockFlowProps} />);

      // Then
      const input = screen.getByLabelText('Policy title') as HTMLInputElement;
      expect(input.value).toBe(EXPECTED_BASELINE_WITH_REPORT_LABEL);
    });

    test('given report mode with report name at position 1 then prefills with report name and reform', () => {
      // Given
      mockReportState = mockReportStateReportWithName;
      mockSelectCurrentPosition.mockReturnValue(1);
      mockSelectPolicyAtPosition.mockReturnValue(null);

      // When
      render(<PolicyCreationFrame {...mockFlowProps} />);

      // Then
      const input = screen.getByLabelText('Policy title') as HTMLInputElement;
      expect(input.value).toBe(EXPECTED_REFORM_WITH_REPORT_LABEL);
    });

    test('given report mode without report name at position 0 then prefills with baseline policy', () => {
      // Given
      mockReportState = mockReportStateReportWithoutName;
      mockSelectCurrentPosition.mockReturnValue(0);
      mockSelectPolicyAtPosition.mockReturnValue(null);

      // When
      render(<PolicyCreationFrame {...mockFlowProps} />);

      // Then
      const input = screen.getByLabelText('Policy title') as HTMLInputElement;
      expect(input.value).toBe(EXPECTED_BASELINE_POLICY_LABEL);
    });

    test('given report mode without report name at position 1 then prefills with reform policy', () => {
      // Given
      mockReportState = mockReportStateReportWithoutName;
      mockSelectCurrentPosition.mockReturnValue(1);
      mockSelectPolicyAtPosition.mockReturnValue(null);

      // When
      render(<PolicyCreationFrame {...mockFlowProps} />);

      // Then
      const input = screen.getByLabelText('Policy title') as HTMLInputElement;
      expect(input.value).toBe(EXPECTED_REFORM_POLICY_LABEL);
    });

    test('given user edits prefilled label then custom label is used', async () => {
      // Given
      const user = userEvent.setup();
      mockReportState = mockReportStateReportWithName;
      mockSelectCurrentPosition.mockReturnValue(0);
      mockSelectPolicyAtPosition.mockReturnValue(null);

      render(<PolicyCreationFrame {...mockFlowProps} />);

      // When - Clear and type new label
      const input = screen.getByLabelText('Policy title');
      await user.clear(input);
      await user.type(input, 'Custom Tax Reform');

      const submitButton = screen.getByRole('button', { name: /Create a policy/i });
      await user.click(submitButton);

      // Then
      expect(mockDispatch).toHaveBeenCalledWith(
        policyReducer.updatePolicyAtPosition({
          position: 0,
          updates: { label: 'Custom Tax Reform' },
        })
      );
    });
  });
});
