import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent } from '@test-utils';
import { useSelector } from 'react-redux';

const mockDispatch = vi.fn();

vi.mock('@/flows/registry', async () => {
  const mocks = await import('@/tests/fixtures/components/FlowContainerMocks');
  return {
    componentRegistry: mocks.mockComponentRegistry,
    flowRegistry: mocks.mockFlowRegistry,
  };
});

vi.mock('@/reducers/flowReducer', () => ({
  default: vi.fn((state = {}) => state),
  navigateToFlow: vi.fn((payload) => ({ type: 'flow/navigateToFlow', payload })),
  navigateToFrame: vi.fn((payload) => ({ type: 'flow/navigateToFrame', payload })),
  returnFromFlow: vi.fn(() => ({ type: 'flow/returnFromFlow' })),
}));

vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: vi.fn(),
  };
});

vi.mock('@/types/flow', async () => {
  const actual = await vi.importActual('@/types/flow');
  const mocks = await import('@/tests/fixtures/components/FlowContainerMocks');
  return {
    ...actual,
    isFlowKey: vi.fn((target: string) => {
      return target === mocks.TEST_FLOW_NAMES.ANOTHER_FLOW || target === mocks.TEST_FLOW_NAMES.TEST_FLOW;
    }),
    isComponentKey: vi.fn((target: string) => {
      return target === mocks.TEST_FRAME_NAMES.TEST_FRAME || 
             target === mocks.TEST_FRAME_NAMES.NEXT_FRAME || 
             target === mocks.TEST_FRAME_NAMES.NON_EXISTENT_COMPONENT;
    }),
  };
});

import FlowContainer from '@/components/FlowContainer';
import {
  mockFlow,
  mockSubflowStack,
  TestComponent,
  mockFlowRegistry,
  createMockState,
  TEST_STRINGS,
  TEST_FRAME_NAMES,
  TEST_FLOW_NAMES,
  TEST_EVENTS,
  addEventToMockFlow,
  cleanupDynamicEvents,
} from '@/tests/fixtures/components/FlowContainerMocks';
import { navigateToFlow, navigateToFrame, returnFromFlow } from '@/reducers/flowReducer';

describe('FlowContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.error = vi.fn();
    cleanupDynamicEvents();
  });

  describe('Error States', () => {
    test('given no current flow then displays no flow message', () => {
      vi.mocked(useSelector).mockImplementation((selector: any) => 
        selector({ flow: {
          currentFlow: null,
          currentFrame: null,
          flowStack: [],
        }})
      );

      render(<FlowContainer />);

      expect(screen.getByText(TEST_STRINGS.NO_FLOW_MESSAGE)).toBeInTheDocument();
    });

    test('given no current frame then displays no flow message', () => {
      vi.mocked(useSelector).mockImplementation((selector: any) => 
        selector({ flow: {
          currentFlow: mockFlow,
          currentFrame: null,
          flowStack: [],
        }})
      );

      render(<FlowContainer />);

      expect(screen.getByText(TEST_STRINGS.NO_FLOW_MESSAGE)).toBeInTheDocument();
    });

    test('given component not in registry then displays error message', () => {
      vi.mocked(useSelector).mockImplementation((selector: any) => 
        selector({ flow: {
          currentFlow: mockFlow,
          currentFrame: TEST_FRAME_NAMES.NON_EXISTENT_COMPONENT,
          flowStack: [],
        }})
      );

      render(<FlowContainer />);

      expect(screen.getByText(`${TEST_STRINGS.COMPONENT_NOT_FOUND_PREFIX} ${TEST_FRAME_NAMES.NON_EXISTENT_COMPONENT}`)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(TEST_STRINGS.AVAILABLE_COMPONENTS_PREFIX))).toBeInTheDocument();
    });
  });

  describe('Component Rendering', () => {
    test('given valid flow and frame then renders correct component', () => {
      vi.mocked(useSelector).mockImplementation((selector: any) => 
        selector({ flow: createMockState().flow })
      );

      render(<FlowContainer />);

      expect(screen.getByText(TEST_STRINGS.TEST_COMPONENT_TEXT)).toBeInTheDocument();
      expect(TestComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          onNavigate: expect.any(Function),
          onReturn: expect.any(Function),
          flowConfig: mockFlow,
          isInSubflow: false,
          flowDepth: 0,
          parentFlowContext: undefined,
        }),
        undefined
      );
    });

    test('given subflow context then passes correct props to component', () => {
      vi.mocked(useSelector).mockImplementation((selector: any) => 
        selector({ flow: createMockState({ flowStack: mockSubflowStack }).flow })
      );

      render(<FlowContainer />);

      expect(screen.getByText(TEST_STRINGS.IN_SUBFLOW_TEXT)).toBeInTheDocument();
      expect(screen.getByText(`${TEST_STRINGS.FLOW_DEPTH_PREFIX} 1`)).toBeInTheDocument();
      expect(screen.getByText(`${TEST_STRINGS.PARENT_PREFIX} ${TEST_FLOW_NAMES.PARENT_FLOW}`)).toBeInTheDocument();
      
      expect(TestComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          isInSubflow: true,
          flowDepth: 1,
          parentFlowContext: {
            flowName: TEST_FLOW_NAMES.PARENT_FLOW,
            parentFrame: TEST_FRAME_NAMES.PARENT_FRAME,
          },
        }),
        undefined
      );
    });
  });

  describe('Navigation Event Handling', () => {
    test('given user navigates to frame then dispatches navigateToFrame action', async () => {
      const user = userEvent.setup();
      vi.mocked(useSelector).mockImplementation((selector: any) => 
        selector({ flow: createMockState().flow })
      );

      render(<FlowContainer />);

      await user.click(screen.getByRole('button', { name: /navigate next/i }));

      expect(mockDispatch).toHaveBeenCalledWith(navigateToFrame(TEST_FRAME_NAMES.NEXT_FRAME as any));
    });

    test('given user navigates with return keyword then dispatches returnFromFlow action', async () => {
      const user = userEvent.setup();
      vi.mocked(useSelector).mockImplementation((selector: any) => 
        selector({ flow: createMockState().flow })
      );

      render(<FlowContainer />);

      await user.click(screen.getByRole('button', { name: /submit/i }));

      expect(mockDispatch).toHaveBeenCalledWith(returnFromFlow());
    });

    test('given user navigates to flow with navigation object then dispatches navigateToFlow with returnFrame', async () => {
      const user = userEvent.setup();
      vi.mocked(useSelector).mockImplementation((selector: any) => 
        selector({ flow: createMockState().flow })
      );

      render(<FlowContainer />);

      await user.click(screen.getByRole('button', { name: /go to flow/i }));

      expect(mockDispatch).toHaveBeenCalledWith(
        navigateToFlow({
          flow: mockFlowRegistry.anotherFlow,
          returnFrame: TEST_FRAME_NAMES.RETURN_FRAME as any,
        })
      );
    });

    test('given navigation event with no target defined then logs error', async () => {
      vi.mocked(useSelector).mockImplementation((selector: any) => 
        selector({ flow: createMockState().flow })
      );

      render(<FlowContainer />);

      const component = TestComponent.mock.calls[0][0];
      component.onNavigate(TEST_EVENTS.NON_EXISTENT_EVENT);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(`No target defined for event ${TEST_EVENTS.NON_EXISTENT_EVENT}`)
      );
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    test('given navigation to flow key then dispatches navigateToFlow action', () => {
      vi.mocked(useSelector).mockImplementation((selector: any) => 
        selector({ flow: createMockState().flow })
      );

      render(<FlowContainer />);

      const component = TestComponent.mock.calls[0][0];
      
      addEventToMockFlow(TEST_EVENTS.DIRECT_FLOW, TEST_FLOW_NAMES.ANOTHER_FLOW);
      component.onNavigate(TEST_EVENTS.DIRECT_FLOW);

      expect(mockDispatch).toHaveBeenCalledWith(
        navigateToFlow({ flow: mockFlowRegistry[TEST_FLOW_NAMES.ANOTHER_FLOW] })
      );
    });

    test('given navigation to unknown target type then logs error', () => {
      vi.mocked(useSelector).mockImplementation((selector: any) => 
        selector({ flow: createMockState().flow })
      );

      render(<FlowContainer />);

      const component = TestComponent.mock.calls[0][0];
      
      addEventToMockFlow(TEST_EVENTS.UNKNOWN_TARGET, TEST_FRAME_NAMES.UNKNOWN_TARGET);
      component.onNavigate(TEST_EVENTS.UNKNOWN_TARGET);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(`Unknown target type: ${TEST_FRAME_NAMES.UNKNOWN_TARGET}`)
      );
    });
  });

  describe('Return From Subflow', () => {
    test('given user returns from subflow then dispatches returnFromFlow action', async () => {
      const user = userEvent.setup();
      vi.mocked(useSelector).mockImplementation((selector: any) => 
        selector({ flow: createMockState({ flowStack: mockSubflowStack }).flow })
      );

      render(<FlowContainer />);

      await user.click(screen.getByRole('button', { name: /return/i }));

      expect(mockDispatch).toHaveBeenCalledWith(returnFromFlow());
    });
  });
});