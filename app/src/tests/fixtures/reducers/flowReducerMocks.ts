import { ComponentKey } from '@/flows/registry';
import { Flow } from '@/types/flow';

// Define FlowState interface to match the reducer
interface FlowState {
  currentFlow: Flow | null;
  currentFrame: ComponentKey | null;
  flowStack: Array<{
    flow: Flow;
    frame: ComponentKey;
    frameHistory: ComponentKey[];
  }>;
  frameHistory: ComponentKey[];
}

// Test constants for flow names
export const FLOW_NAMES = {
  MAIN_FLOW: 'mainFlow',
  SUB_FLOW: 'subFlow',
  NESTED_FLOW: 'nestedFlow',
  EMPTY_FLOW: 'emptyFlow',
} as const;

// Test constants for frame/component names
export const FRAME_NAMES = {
  INITIAL_FRAME: 'initialFrame' as ComponentKey,
  SECOND_FRAME: 'secondFrame' as ComponentKey,
  THIRD_FRAME: 'thirdFrame' as ComponentKey,
  RETURN_FRAME: 'returnFrame' as ComponentKey,
  SUB_INITIAL_FRAME: 'subInitialFrame' as ComponentKey,
  SUB_SECOND_FRAME: 'subSecondFrame' as ComponentKey,
  NESTED_INITIAL_FRAME: 'nestedInitialFrame' as ComponentKey,
  NULL_FRAME: null,
} as const;

// Test constants for action types
export const ACTION_TYPES = {
  CLEAR_FLOW: 'flow/clearFlow',
  SET_FLOW: 'flow/setFlow',
  NAVIGATE_TO_FRAME: 'flow/navigateToFrame',
  NAVIGATE_TO_FLOW: 'flow/navigateToFlow',
  RETURN_FROM_FLOW: 'flow/returnFromFlow',
} as const;

// Mock flows
export const mockMainFlow: Flow = {
  initialFrame: FRAME_NAMES.INITIAL_FRAME,
  frames: {
    [FRAME_NAMES.INITIAL_FRAME]: {
      component: FRAME_NAMES.INITIAL_FRAME,
      on: {
        next: FRAME_NAMES.SECOND_FRAME,
        submit: '__return__',
      },
    },
    [FRAME_NAMES.SECOND_FRAME]: {
      component: FRAME_NAMES.SECOND_FRAME,
      on: {
        next: FRAME_NAMES.THIRD_FRAME,
        back: FRAME_NAMES.INITIAL_FRAME,
      },
    },
    [FRAME_NAMES.THIRD_FRAME]: {
      component: FRAME_NAMES.THIRD_FRAME,
      on: {
        back: FRAME_NAMES.SECOND_FRAME,
        submit: '__return__',
      },
    },
  },
};

export const mockSubFlow: Flow = {
  initialFrame: FRAME_NAMES.SUB_INITIAL_FRAME,
  frames: {
    [FRAME_NAMES.SUB_INITIAL_FRAME]: {
      component: FRAME_NAMES.SUB_INITIAL_FRAME,
      on: {
        next: FRAME_NAMES.SUB_SECOND_FRAME,
        cancel: '__return__',
      },
    },
    [FRAME_NAMES.SUB_SECOND_FRAME]: {
      component: FRAME_NAMES.SUB_SECOND_FRAME,
      on: {
        back: FRAME_NAMES.SUB_INITIAL_FRAME,
        submit: '__return__',
      },
    },
  },
};

export const mockNestedFlow: Flow = {
  initialFrame: FRAME_NAMES.NESTED_INITIAL_FRAME,
  frames: {
    [FRAME_NAMES.NESTED_INITIAL_FRAME]: {
      component: FRAME_NAMES.NESTED_INITIAL_FRAME,
      on: {
        done: '__return__',
      },
    },
  },
};

export const mockFlowWithoutInitialFrame: Flow = {
  initialFrame: null,
  frames: {},
};

export const mockFlowWithNonStringInitialFrame: Flow = {
  initialFrame: { someObject: 'value' } as any,
  frames: {
    [FRAME_NAMES.INITIAL_FRAME]: {
      component: FRAME_NAMES.INITIAL_FRAME,
      on: {},
    },
  },
};

// Initial state constant
export const INITIAL_STATE: FlowState = {
  currentFlow: null,
  currentFrame: null,
  flowStack: [],
  frameHistory: [],
};

// Helper function to create a flow state
export const createFlowState = (overrides: Partial<FlowState> = {}): FlowState => ({
  ...INITIAL_STATE,
  ...overrides,
});

// Helper function to create a flow stack entry
export const createFlowStackEntry = (
  flow: Flow,
  frame: ComponentKey,
  frameHistory: ComponentKey[] = []
) => ({
  flow,
  frame,
  frameHistory,
});

// Mock flow stack scenarios
export const mockEmptyStack: Array<{
  flow: Flow;
  frame: ComponentKey;
  frameHistory: ComponentKey[];
}> = [];

export const mockSingleLevelStack: Array<{
  flow: Flow;
  frame: ComponentKey;
  frameHistory: ComponentKey[];
}> = [createFlowStackEntry(mockMainFlow, FRAME_NAMES.SECOND_FRAME)];

export const mockTwoLevelStack: Array<{
  flow: Flow;
  frame: ComponentKey;
  frameHistory: ComponentKey[];
}> = [
  createFlowStackEntry(mockMainFlow, FRAME_NAMES.SECOND_FRAME),
  createFlowStackEntry(mockSubFlow, FRAME_NAMES.SUB_INITIAL_FRAME), // This is the frame we'll return to
];

export const mockThreeLevelStack: Array<{
  flow: Flow;
  frame: ComponentKey;
  frameHistory: ComponentKey[];
}> = [
  createFlowStackEntry(mockMainFlow, FRAME_NAMES.SECOND_FRAME),
  createFlowStackEntry(mockSubFlow, FRAME_NAMES.SUB_SECOND_FRAME),
  createFlowStackEntry(mockNestedFlow, FRAME_NAMES.NESTED_INITIAL_FRAME),
];

// State scenarios for testing
export const mockStateWithMainFlow = createFlowState({
  currentFlow: mockMainFlow,
  currentFrame: FRAME_NAMES.INITIAL_FRAME,
  flowStack: mockEmptyStack,
});

export const mockStateWithSubFlow = createFlowState({
  currentFlow: mockSubFlow,
  currentFrame: FRAME_NAMES.SUB_INITIAL_FRAME,
  flowStack: mockSingleLevelStack,
});

export const mockStateWithNestedFlow = createFlowState({
  currentFlow: mockNestedFlow,
  currentFrame: FRAME_NAMES.NESTED_INITIAL_FRAME,
  flowStack: mockTwoLevelStack,
});

export const mockStateInMiddleFrame = createFlowState({
  currentFlow: mockMainFlow,
  currentFrame: FRAME_NAMES.SECOND_FRAME,
  flowStack: mockEmptyStack,
});

export const mockStateWithoutCurrentFlow = createFlowState({
  currentFlow: null,
  currentFrame: FRAME_NAMES.INITIAL_FRAME,
  flowStack: mockEmptyStack,
});

export const mockStateWithoutCurrentFrame = createFlowState({
  currentFlow: mockMainFlow,
  currentFrame: null,
  flowStack: mockEmptyStack,
});

// Action payloads
export const mockSetFlowPayload = mockMainFlow;

export const mockNavigateToFramePayload = FRAME_NAMES.SECOND_FRAME;

export const mockNavigateToFlowPayload = {
  flow: mockSubFlow,
  returnFrame: undefined,
};

export const mockNavigateToFlowWithReturnPayload = {
  flow: mockSubFlow,
  returnFrame: FRAME_NAMES.RETURN_FRAME,
};

// Expected states after actions
export const expectedStateAfterSetFlow: FlowState = {
  currentFlow: mockMainFlow,
  currentFrame: FRAME_NAMES.INITIAL_FRAME,
  flowStack: [],
  frameHistory: [],
};

export const expectedStateAfterNavigateToFrame: FlowState = {
  ...mockStateWithMainFlow,
  currentFrame: FRAME_NAMES.SECOND_FRAME,
  frameHistory: [FRAME_NAMES.INITIAL_FRAME],
};

export const expectedStateAfterNavigateToFlow: FlowState = {
  currentFlow: mockSubFlow,
  currentFrame: FRAME_NAMES.SUB_INITIAL_FRAME,
  flowStack: [createFlowStackEntry(mockMainFlow, FRAME_NAMES.INITIAL_FRAME)],
  frameHistory: [],
};

export const expectedStateAfterNavigateToFlowWithReturn: FlowState = {
  currentFlow: mockSubFlow,
  currentFrame: FRAME_NAMES.SUB_INITIAL_FRAME,
  flowStack: [createFlowStackEntry(mockMainFlow, FRAME_NAMES.RETURN_FRAME)],
  frameHistory: [],
};

export const expectedStateAfterReturnFromFlow: FlowState = {
  currentFlow: mockMainFlow,
  currentFrame: FRAME_NAMES.SECOND_FRAME,
  flowStack: [],
  frameHistory: [],
};

export const expectedStateAfterClearFlow: FlowState = INITIAL_STATE;
