import { describe, expect, test } from 'vitest';
import flowReducer, {
  clearFlow,
  navigateToFlow,
  navigateToFrame,
  returnFromFlow,
  setFlow,
} from '@/reducers/flowReducer';
import {
  createFlowStackEntry,
  createFlowState,
  expectedStateAfterClearFlow,
  expectedStateAfterNavigateToFlow,
  expectedStateAfterNavigateToFlowWithReturn,
  expectedStateAfterNavigateToFrame,
  expectedStateAfterReturnFromFlow,
  expectedStateAfterSetFlow,
  FRAME_NAMES,
  INITIAL_STATE,
  mockEmptyStack,
  mockFlowWithNonStringInitialFrame,
  mockFlowWithoutInitialFrame,
  mockMainFlow,
  mockNestedFlow,
  mockSingleLevelStack,
  mockStateWithMainFlow,
  mockStateWithNestedFlow,
  mockStateWithoutCurrentFlow,
  mockStateWithoutCurrentFrame,
  mockStateWithSubFlow,
  mockSubFlow,
  mockTwoLevelStack,
} from '@/tests/fixtures/reducers/flowReducerMocks';

describe('flowReducer', () => {
  describe('Initial State', () => {
    test('given undefined state then returns initial state', () => {
      const state = flowReducer(undefined, { type: 'unknown' });

      expect(state).toEqual(INITIAL_STATE);
      expect(state.currentFlow).toBeNull();
      expect(state.currentFrame).toBeNull();
      expect(state.flowStack).toEqual(mockEmptyStack);
    });
  });

  describe('clearFlow Action', () => {
    test('given state with flow then clears all flow data', () => {
      const state = flowReducer(mockStateWithMainFlow, clearFlow());

      expect(state).toEqual(expectedStateAfterClearFlow);
      expect(state.currentFlow).toBeNull();
      expect(state.currentFrame).toBeNull();
      expect(state.flowStack).toEqual(mockEmptyStack);
    });

    test('given state with nested flows then clears entire stack', () => {
      const state = flowReducer(mockStateWithNestedFlow, clearFlow());

      expect(state).toEqual(expectedStateAfterClearFlow);
      expect(state.flowStack).toEqual(mockEmptyStack);
    });

    test('given already empty state then remains empty', () => {
      const state = flowReducer(INITIAL_STATE, clearFlow());

      expect(state).toEqual(expectedStateAfterClearFlow);
    });
  });

  describe('setFlow Action', () => {
    test('given flow with initial frame then sets flow and frame', () => {
      const state = flowReducer(INITIAL_STATE, setFlow({ flow: mockMainFlow }));

      expect(state).toEqual(expectedStateAfterSetFlow);
      expect(state.currentFlow).toEqual(mockMainFlow);
      expect(state.currentFrame).toEqual(FRAME_NAMES.INITIAL_FRAME);
      expect(state.flowStack).toEqual(mockEmptyStack);
    });

    test('given flow without initial frame then sets flow but not frame', () => {
      const state = flowReducer(INITIAL_STATE, setFlow({ flow: mockFlowWithoutInitialFrame }));

      expect(state.currentFlow).toEqual(mockFlowWithoutInitialFrame);
      expect(state.currentFrame).toBeNull();
      expect(state.flowStack).toEqual(mockEmptyStack);
    });

    test('given flow with non-string initial frame then sets flow but not frame', () => {
      const state = flowReducer(INITIAL_STATE, setFlow({ flow: mockFlowWithNonStringInitialFrame }));

      expect(state.currentFlow).toEqual(mockFlowWithNonStringInitialFrame);
      expect(state.currentFrame).toBeNull();
      expect(state.flowStack).toEqual(mockEmptyStack);
    });

    test('given existing flow state then replaces with new flow and clears stack', () => {
      const state = flowReducer(mockStateWithNestedFlow, setFlow({ flow: mockMainFlow }));

      expect(state).toEqual(expectedStateAfterSetFlow);
      expect(state.flowStack).toEqual(mockEmptyStack);
    });

    test('given flow with returnPath then sets returnPath', () => {
      const returnPath = '/us/reports';
      const state = flowReducer(INITIAL_STATE, setFlow({ flow: mockMainFlow, returnPath }));

      expect(state.currentFlow).toEqual(mockMainFlow);
      expect(state.currentFrame).toEqual(FRAME_NAMES.INITIAL_FRAME);
      expect(state.returnPath).toEqual(returnPath);
      expect(state.flowStack).toEqual(mockEmptyStack);
    });

    test('given flow without returnPath then sets returnPath to null', () => {
      const state = flowReducer(INITIAL_STATE, setFlow({ flow: mockMainFlow }));

      expect(state.currentFlow).toEqual(mockMainFlow);
      expect(state.returnPath).toBeNull();
    });
  });

  describe('navigateToFrame Action', () => {
    test('given current flow then navigates to specified frame', () => {
      const state = flowReducer(mockStateWithMainFlow, navigateToFrame(FRAME_NAMES.SECOND_FRAME));

      expect(state).toEqual(expectedStateAfterNavigateToFrame);
      expect(state.currentFrame).toEqual(FRAME_NAMES.SECOND_FRAME);
      expect(state.currentFlow).toEqual(mockMainFlow);
    });

    test('given nested flow state then only changes current frame', () => {
      const state = flowReducer(
        mockStateWithSubFlow,
        navigateToFrame(FRAME_NAMES.SUB_SECOND_FRAME)
      );

      expect(state.currentFrame).toEqual(FRAME_NAMES.SUB_SECOND_FRAME);
      expect(state.currentFlow).toEqual(mockSubFlow);
      expect(state.flowStack).toEqual(mockSingleLevelStack);
    });

    test('given no current flow then still updates frame', () => {
      const state = flowReducer(INITIAL_STATE, navigateToFrame(FRAME_NAMES.SECOND_FRAME));

      expect(state.currentFrame).toEqual(FRAME_NAMES.SECOND_FRAME);
      expect(state.currentFlow).toBeNull();
    });
  });

  describe('navigateToFlow Action', () => {
    test('given current flow and frame then pushes to stack and navigates', () => {
      const state = flowReducer(mockStateWithMainFlow, navigateToFlow({ flow: mockSubFlow }));

      expect(state).toEqual(expectedStateAfterNavigateToFlow);
      expect(state.currentFlow).toEqual(mockSubFlow);
      expect(state.currentFrame).toEqual(FRAME_NAMES.SUB_INITIAL_FRAME);
      expect(state.flowStack).toHaveLength(1);
      expect(state.flowStack[0]).toEqual(
        createFlowStackEntry(mockMainFlow, FRAME_NAMES.INITIAL_FRAME)
      );
    });

    test('given return frame then uses it in stack entry', () => {
      const state = flowReducer(
        mockStateWithMainFlow,
        navigateToFlow({
          flow: mockSubFlow,
          returnFrame: FRAME_NAMES.RETURN_FRAME,
        })
      );

      expect(state).toEqual(expectedStateAfterNavigateToFlowWithReturn);
      expect(state.flowStack[0].frame).toEqual(FRAME_NAMES.RETURN_FRAME);
    });

    test('given no current flow then does not push to stack', () => {
      const state = flowReducer(mockStateWithoutCurrentFlow, navigateToFlow({ flow: mockSubFlow }));

      expect(state.currentFlow).toEqual(mockSubFlow);
      expect(state.currentFrame).toEqual(FRAME_NAMES.SUB_INITIAL_FRAME);
      expect(state.flowStack).toEqual(mockEmptyStack);
    });

    test('given no current frame then does not push to stack', () => {
      const state = flowReducer(
        mockStateWithoutCurrentFrame,
        navigateToFlow({ flow: mockSubFlow })
      );

      expect(state.currentFlow).toEqual(mockSubFlow);
      expect(state.currentFrame).toEqual(FRAME_NAMES.SUB_INITIAL_FRAME);
      expect(state.flowStack).toEqual(mockEmptyStack);
    });

    test('given flow without initial frame then sets flow but keeps previous frame', () => {
      const state = flowReducer(
        mockStateWithMainFlow,
        navigateToFlow({ flow: mockFlowWithoutInitialFrame })
      );

      expect(state.currentFlow).toEqual(mockFlowWithoutInitialFrame);
      expect(state.currentFrame).toEqual(FRAME_NAMES.INITIAL_FRAME); // Frame stays the same
      expect(state.flowStack).toHaveLength(1);
    });

    test('given flow with non-string initial frame then sets flow but keeps previous frame', () => {
      const state = flowReducer(
        mockStateWithMainFlow,
        navigateToFlow({ flow: mockFlowWithNonStringInitialFrame })
      );

      expect(state.currentFlow).toEqual(mockFlowWithNonStringInitialFrame);
      expect(state.currentFrame).toEqual(FRAME_NAMES.INITIAL_FRAME); // Frame stays the same
      expect(state.flowStack).toHaveLength(1);
    });

    test('given nested navigation then creates multi-level stack', () => {
      // Start with main flow
      let state = flowReducer(INITIAL_STATE, setFlow({ flow: mockMainFlow }));

      // Navigate to sub flow
      state = flowReducer(state, navigateToFlow({ flow: mockSubFlow }));
      expect(state.flowStack).toHaveLength(1);
      expect(state.currentFlow).toEqual(mockSubFlow);

      // Navigate to nested flow
      state = flowReducer(state, navigateToFlow({ flow: mockNestedFlow }));
      expect(state.flowStack).toHaveLength(2);
      expect(state.currentFlow).toEqual(mockNestedFlow);
      expect(state.flowStack[0].flow).toEqual(mockMainFlow);
      expect(state.flowStack[1].flow).toEqual(mockSubFlow);
    });
  });

  describe('returnFromFlow Action', () => {
    test('given single level stack then returns to previous flow', () => {
      const state = flowReducer(mockStateWithSubFlow, returnFromFlow());

      expect(state).toEqual(expectedStateAfterReturnFromFlow);
      expect(state.currentFlow).toEqual(mockMainFlow);
      expect(state.currentFrame).toEqual(FRAME_NAMES.SECOND_FRAME);
      expect(state.flowStack).toEqual(mockEmptyStack);
    });

    test('given multi-level stack then returns one level', () => {
      const state = flowReducer(mockStateWithNestedFlow, returnFromFlow());

      expect(state.currentFlow).toEqual(mockSubFlow);
      expect(state.currentFrame).toEqual(FRAME_NAMES.SUB_INITIAL_FRAME); // Returns to the frame in the stack
      expect(state.flowStack).toHaveLength(1);
      expect(state.flowStack[0].flow).toEqual(mockMainFlow);
    });

    test('given empty stack then clears flow', () => {
      const state = flowReducer(mockStateWithMainFlow, returnFromFlow());

      expect(state.currentFlow).toBeNull();
      expect(state.currentFrame).toBeNull();
      expect(state.flowStack).toEqual(mockEmptyStack);
    });

    test('given initial state then does nothing', () => {
      const state = flowReducer(INITIAL_STATE, returnFromFlow());

      expect(state).toEqual(INITIAL_STATE);
    });

    test('given custom return frame then returns to specified frame', () => {
      const stateWithCustomReturn = createFlowState({
        currentFlow: mockSubFlow,
        currentFrame: FRAME_NAMES.SUB_INITIAL_FRAME,
        flowStack: [createFlowStackEntry(mockMainFlow, FRAME_NAMES.THIRD_FRAME)],
      });

      const state = flowReducer(stateWithCustomReturn, returnFromFlow());

      expect(state.currentFlow).toEqual(mockMainFlow);
      expect(state.currentFrame).toEqual(FRAME_NAMES.THIRD_FRAME);
      expect(state.flowStack).toEqual(mockEmptyStack);
    });
  });

  describe('Complex Scenarios', () => {
    test('given sequence of navigations then maintains correct state', () => {
      let state = flowReducer(undefined, { type: 'init' });

      // Set initial flow
      state = flowReducer(state, setFlow({ flow: mockMainFlow }));
      expect(state.currentFrame).toEqual(FRAME_NAMES.INITIAL_FRAME);

      // Navigate to second frame
      state = flowReducer(state, navigateToFrame(FRAME_NAMES.SECOND_FRAME));
      expect(state.currentFrame).toEqual(FRAME_NAMES.SECOND_FRAME);

      // Navigate to sub flow
      state = flowReducer(
        state,
        navigateToFlow({
          flow: mockSubFlow,
          returnFrame: FRAME_NAMES.THIRD_FRAME,
        })
      );
      expect(state.currentFlow).toEqual(mockSubFlow);
      expect(state.flowStack).toHaveLength(1);
      expect(state.flowStack[0].frame).toEqual(FRAME_NAMES.THIRD_FRAME);

      // Navigate within sub flow
      state = flowReducer(state, navigateToFrame(FRAME_NAMES.SUB_SECOND_FRAME));
      expect(state.currentFrame).toEqual(FRAME_NAMES.SUB_SECOND_FRAME);

      // Return from sub flow
      state = flowReducer(state, returnFromFlow());
      expect(state.currentFlow).toEqual(mockMainFlow);
      expect(state.currentFrame).toEqual(FRAME_NAMES.THIRD_FRAME);
      expect(state.flowStack).toEqual(mockEmptyStack);
    });

    test('given clear flow in middle of navigation then resets everything', () => {
      let state = createFlowState({
        currentFlow: mockNestedFlow,
        currentFrame: FRAME_NAMES.NESTED_INITIAL_FRAME,
        flowStack: mockTwoLevelStack,
      });

      state = flowReducer(state, clearFlow());

      expect(state).toEqual(INITIAL_STATE);
    });

    test('given set flow in middle of navigation then replaces everything', () => {
      let state = createFlowState({
        currentFlow: mockNestedFlow,
        currentFrame: FRAME_NAMES.NESTED_INITIAL_FRAME,
        flowStack: mockTwoLevelStack,
      });

      state = flowReducer(state, setFlow({ flow: mockMainFlow }));

      expect(state.currentFlow).toEqual(mockMainFlow);
      expect(state.currentFrame).toEqual(FRAME_NAMES.INITIAL_FRAME);
      expect(state.flowStack).toEqual(mockEmptyStack);
    });
  });

  describe('Edge Cases', () => {
    test('given unknown action then returns unchanged state', () => {
      const state = flowReducer(mockStateWithMainFlow, { type: 'unknown/action' } as any);

      expect(state).toEqual(mockStateWithMainFlow);
    });

    test('given multiple returns then handles gracefully', () => {
      let state = mockStateWithSubFlow;

      // First return - should work, returning to parent flow
      state = flowReducer(state, returnFromFlow());
      expect(state.flowStack).toEqual(mockEmptyStack);
      expect(state.currentFlow).toEqual(mockMainFlow);

      // Second return - empty stack, so clears flow
      state = flowReducer(state, returnFromFlow());
      expect(state.currentFlow).toBeNull();
      expect(state.currentFrame).toBeNull();

      // Third return - already null, stays null
      state = flowReducer(state, returnFromFlow());
      expect(state.currentFlow).toBeNull();
      expect(state.currentFrame).toBeNull();
    });
  });
});
