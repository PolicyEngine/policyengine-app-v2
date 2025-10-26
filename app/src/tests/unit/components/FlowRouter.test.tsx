import { render } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
// Import after mocks are set up
import FlowRouter from '@/components/FlowRouter';
import { setFlow } from '@/reducers/flowReducer';
import {
  ABSOLUTE_RETURN_PATH,
  createMockFlowState,
  mockDispatch,
  mockUseParams,
  mockUseSelector,
  TEST_COUNTRY_ID,
  TEST_FLOW,
  TEST_RETURN_PATH,
} from '@/tests/fixtures/components/FlowRouterMocks';

// Mock dependencies - must be hoisted before imports
vi.mock('@/components/FlowContainer', () => ({
  default: vi.fn(() => null),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  const mocks = await import('@/tests/fixtures/components/FlowRouterMocks');
  return {
    ...actual,
    useParams: () => mocks.mockUseParams(),
  };
});

vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  const mocks = await import('@/tests/fixtures/components/FlowRouterMocks');
  return {
    ...actual,
    useDispatch: () => mocks.mockDispatch,
    useSelector: (selector: any) => mocks.mockUseSelector(selector),
  };
});

describe('FlowRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ countryId: TEST_COUNTRY_ID });
  });

  test('given no current flow then initializes flow with setFlow', () => {
    // Given
    mockUseSelector.mockImplementation((selector: any) => selector(createMockFlowState()));

    // When
    render(<FlowRouter flow={TEST_FLOW} returnPath={TEST_RETURN_PATH} />);

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(
      setFlow({ flow: TEST_FLOW, returnPath: ABSOLUTE_RETURN_PATH })
    );
  });

  test('given existing current flow then does not call setFlow', () => {
    // Given
    mockUseSelector.mockImplementation((selector: any) =>
      selector(createMockFlowState({ currentFlow: TEST_FLOW }))
    );

    // When
    render(<FlowRouter flow={TEST_FLOW} returnPath={TEST_RETURN_PATH} />);

    // Then
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('given countryId and returnPath then constructs correct absolute path', () => {
    // Given
    mockUseParams.mockReturnValue({ countryId: 'uk' });
    mockUseSelector.mockImplementation((selector: any) => selector(createMockFlowState()));

    // When
    render(<FlowRouter flow={TEST_FLOW} returnPath="policies" />);

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(
      setFlow({ flow: TEST_FLOW, returnPath: '/uk/policies' })
    );
  });

  test('given component remounts with existing flow then does not reset flow', () => {
    // Given - First mount with no flow
    mockUseSelector.mockImplementation((selector: any) => selector(createMockFlowState()));
    const { unmount } = render(<FlowRouter flow={TEST_FLOW} returnPath={TEST_RETURN_PATH} />);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    vi.clearAllMocks();

    // Given - Flow now exists (simulating mid-flow remount)
    mockUseSelector.mockImplementation((selector: any) =>
      selector(createMockFlowState({ currentFlow: TEST_FLOW }))
    );

    // When - Component remounts
    unmount();
    render(<FlowRouter flow={TEST_FLOW} returnPath={TEST_RETURN_PATH} />);

    // Then - setFlow should not be called again
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
