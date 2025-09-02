import { vi } from 'vitest';

// Test constants
export const TEST_STRINGS = {
  NO_FLOW_MESSAGE: 'No flow available',
  TEST_COMPONENT_TEXT: 'Test Component',
  ANOTHER_COMPONENT_TEXT: 'Another Test Component',
  IN_SUBFLOW_TEXT: 'In Subflow',
  FLOW_DEPTH_PREFIX: 'Flow Depth:',
  PARENT_PREFIX: 'Parent:',
  COMPONENT_NOT_FOUND_PREFIX: 'Component not found:',
  AVAILABLE_COMPONENTS_PREFIX: 'Available components:',
} as const;

export const TEST_FLOW_NAMES = {
  TEST_FLOW: 'testFlow',
  ANOTHER_FLOW: 'anotherFlow',
  PARENT_FLOW: 'parentFlow',
  FLOW_WITHOUT_EVENTS: 'flowWithoutEvents',
} as const;

export const TEST_FRAME_NAMES = {
  TEST_FRAME: 'testFrame',
  NEXT_FRAME: 'nextFrame',
  START_FRAME: 'startFrame',
  PARENT_FRAME: 'parentFrame',
  FRAME_WITH_NO_EVENTS: 'frameWithNoEvents',
  NON_EXISTENT_COMPONENT: 'nonExistentComponent',
  RETURN_FRAME: 'returnFrame',
  UNKNOWN_TARGET: 'unknownTargetValue',
} as const;

export const TEST_EVENTS = {
  NEXT: 'next',
  SUBMIT: 'submit',
  GO_TO_FLOW: 'goToFlow',
  BACK: 'back',
  INVALID_EVENT: 'invalidEvent',
  NON_EXISTENT_EVENT: 'nonExistentEvent',
  DIRECT_FLOW: 'directFlow',
  UNKNOWN_TARGET: 'unknownTarget',
} as const;

export const NAVIGATION_TARGETS = {
  RETURN_KEYWORD: '__return__',
} as const;

export const mockFlow = {
  name: TEST_FLOW_NAMES.TEST_FLOW,
  initialFrame: TEST_FRAME_NAMES.TEST_FRAME as any,
  frames: {
    [TEST_FRAME_NAMES.TEST_FRAME]: {
      component: TEST_FRAME_NAMES.TEST_FRAME as any,
      on: {
        [TEST_EVENTS.NEXT]: TEST_FRAME_NAMES.NEXT_FRAME,
        [TEST_EVENTS.SUBMIT]: NAVIGATION_TARGETS.RETURN_KEYWORD,
        [TEST_EVENTS.GO_TO_FLOW]: { 
          flow: TEST_FLOW_NAMES.ANOTHER_FLOW, 
          returnTo: TEST_FRAME_NAMES.RETURN_FRAME as any,
        },
        [TEST_EVENTS.INVALID_EVENT]: null,
      },
    },
    [TEST_FRAME_NAMES.NEXT_FRAME]: {
      component: TEST_FRAME_NAMES.NEXT_FRAME as any,
      on: {
        [TEST_EVENTS.BACK]: TEST_FRAME_NAMES.TEST_FRAME,
      },
    },
  },
};

export const mockFlowWithoutEvents = {
  name: TEST_FLOW_NAMES.FLOW_WITHOUT_EVENTS,
  initialFrame: TEST_FRAME_NAMES.FRAME_WITH_NO_EVENTS as any,
  frames: {
    [TEST_FRAME_NAMES.FRAME_WITH_NO_EVENTS]: {
      component: TEST_FRAME_NAMES.FRAME_WITH_NO_EVENTS as any,
      on: {},
    },
  },
};

export const mockSubflowStack = [
  {
    flow: { 
      name: TEST_FLOW_NAMES.PARENT_FLOW,
      initialFrame: TEST_FRAME_NAMES.PARENT_FRAME as any,
    },
    frame: TEST_FRAME_NAMES.PARENT_FRAME,
  },
];

export const TestComponent = vi.fn(({ onNavigate, onReturn, flowConfig, isInSubflow, flowDepth, parentFlowContext }: any) => {
  return (
    <div>
      <p>{TEST_STRINGS.TEST_COMPONENT_TEXT}</p>
      <button onClick={() => onNavigate(TEST_EVENTS.NEXT)}>Navigate Next</button>
      <button onClick={() => onNavigate(TEST_EVENTS.SUBMIT)}>Submit</button>
      <button onClick={() => onNavigate(TEST_EVENTS.GO_TO_FLOW)}>Go to Flow</button>
      <button onClick={() => onReturn()}>Return</button>
      {isInSubflow && <p>{TEST_STRINGS.IN_SUBFLOW_TEXT}</p>}
      {flowDepth > 0 && <p>{TEST_STRINGS.FLOW_DEPTH_PREFIX} {flowDepth}</p>}
      {parentFlowContext && <p>{TEST_STRINGS.PARENT_PREFIX} {parentFlowContext.flowName}</p>}
    </div>
  );
});

export const AnotherTestComponent = vi.fn(() => {
  return <div>{TEST_STRINGS.ANOTHER_COMPONENT_TEXT}</div>;
});

export const mockComponentRegistry = {
  [TEST_FRAME_NAMES.TEST_FRAME]: TestComponent,
  [TEST_FRAME_NAMES.NEXT_FRAME]: AnotherTestComponent,
};

export const mockFlowRegistry = {
  [TEST_FLOW_NAMES.TEST_FLOW]: mockFlow,
  [TEST_FLOW_NAMES.ANOTHER_FLOW]: {
    name: TEST_FLOW_NAMES.ANOTHER_FLOW,
    initialFrame: TEST_FRAME_NAMES.START_FRAME as any,
    frames: {
      [TEST_FRAME_NAMES.START_FRAME]: {
        component: TEST_FRAME_NAMES.START_FRAME as any,
        on: {},
      },
    },
  },
};

export const createMockState = (overrides = {}) => ({
  flow: {
    currentFlow: mockFlow,
    currentFrame: TEST_FRAME_NAMES.TEST_FRAME,
    flowStack: [],
    ...overrides,
  },
});

// Additional mock functions for dynamic test scenarios
export const addEventToMockFlow = (eventName: string, target: any) => {
  const testFrame = mockFlow.frames[TEST_FRAME_NAMES.TEST_FRAME];
  if (testFrame && testFrame.on) {
    (testFrame.on as any)[eventName] = target;
  }
};

export const cleanupDynamicEvents = () => {
  // Reset to original state
  const testFrame = mockFlow.frames[TEST_FRAME_NAMES.TEST_FRAME];
  if (testFrame && testFrame.on) {
    testFrame.on = {
      [TEST_EVENTS.NEXT]: TEST_FRAME_NAMES.NEXT_FRAME,
      [TEST_EVENTS.SUBMIT]: NAVIGATION_TARGETS.RETURN_KEYWORD,
      [TEST_EVENTS.GO_TO_FLOW]: { 
        flow: TEST_FLOW_NAMES.ANOTHER_FLOW, 
        returnTo: TEST_FRAME_NAMES.RETURN_FRAME as any,
      },
      [TEST_EVENTS.INVALID_EVENT]: null,
    };
  }
};