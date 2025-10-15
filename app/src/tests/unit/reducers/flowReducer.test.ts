import { describe, expect, test } from 'vitest';
import flowReducer, {
  clearFlow,
  navigateToFlow,
  navigateToFrame,
  navigateToPreviousFrame,
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
      expect(state.frameHistory).toEqual([]);
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
      const state = flowReducer(INITIAL_STATE, setFlow(mockMainFlow));

      expect(state).toEqual(expectedStateAfterSetFlow);
      expect(state.currentFlow).toEqual(mockMainFlow);
      expect(state.currentFrame).toEqual(FRAME_NAMES.INITIAL_FRAME);
      expect(state.flowStack).toEqual(mockEmptyStack);
    });

    test('given flow without initial frame then sets flow but not frame', () => {
      const state = flowReducer(INITIAL_STATE, setFlow(mockFlowWithoutInitialFrame));

      expect(state.currentFlow).toEqual(mockFlowWithoutInitialFrame);
      expect(state.currentFrame).toBeNull();
      expect(state.flowStack).toEqual(mockEmptyStack);
    });

    test('given flow with non-string initial frame then sets flow but not frame', () => {
      const state = flowReducer(INITIAL_STATE, setFlow(mockFlowWithNonStringInitialFrame));

      expect(state.currentFlow).toEqual(mockFlowWithNonStringInitialFrame);
      expect(state.currentFrame).toBeNull();
      expect(state.flowStack).toEqual(mockEmptyStack);
    });

    test('given existing flow state then replaces with new flow and clears stack', () => {
      const state = flowReducer(mockStateWithNestedFlow, setFlow(mockMainFlow));

      expect(state).toEqual(expectedStateAfterSetFlow);
      expect(state.flowStack).toEqual(mockEmptyStack);
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

    test('given return frame then saves both actual frame and return frame in stack', () => {
      const state = flowReducer(
        mockStateWithMainFlow,
        navigateToFlow({
          flow: mockSubFlow,
          returnFrame: FRAME_NAMES.RETURN_FRAME,
        })
      );

      expect(state).toEqual(expectedStateAfterNavigateToFlowWithReturn);
      expect(state.flowStack[0].frame).toEqual(FRAME_NAMES.INITIAL_FRAME); // Actual frame (for Back button)
      expect(state.flowStack[0].returnFrame).toEqual(FRAME_NAMES.RETURN_FRAME); // Return frame (for completion)
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
      let state = flowReducer(INITIAL_STATE, setFlow(mockMainFlow));

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

    test('given empty stack then does nothing', () => {
      const state = flowReducer(mockStateWithMainFlow, returnFromFlow());

      expect(state).toEqual(mockStateWithMainFlow);
      expect(state.currentFlow).toEqual(mockMainFlow);
      expect(state.currentFrame).toEqual(FRAME_NAMES.INITIAL_FRAME);
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

    test('given useReturnFrame true with returnFrame defined then uses returnFrame', () => {
      const stateWithBothFrames = createFlowState({
        currentFlow: mockSubFlow,
        currentFrame: FRAME_NAMES.SUB_INITIAL_FRAME,
        flowStack: [
          createFlowStackEntry(
            mockMainFlow,
            FRAME_NAMES.SECOND_FRAME, // Actual frame
            [],
            FRAME_NAMES.THIRD_FRAME // Return frame
          ),
        ],
      });

      const state = flowReducer(stateWithBothFrames, returnFromFlow({ useReturnFrame: true }));

      expect(state.currentFlow).toEqual(mockMainFlow);
      expect(state.currentFrame).toEqual(FRAME_NAMES.THIRD_FRAME); // Uses returnFrame
      expect(state.flowStack).toEqual(mockEmptyStack);
    });

    test('given useReturnFrame false then uses actual frame', () => {
      const stateWithBothFrames = createFlowState({
        currentFlow: mockSubFlow,
        currentFrame: FRAME_NAMES.SUB_INITIAL_FRAME,
        flowStack: [
          createFlowStackEntry(
            mockMainFlow,
            FRAME_NAMES.SECOND_FRAME, // Actual frame
            [],
            FRAME_NAMES.THIRD_FRAME // Return frame
          ),
        ],
      });

      const state = flowReducer(stateWithBothFrames, returnFromFlow());

      expect(state.currentFlow).toEqual(mockMainFlow);
      expect(state.currentFrame).toEqual(FRAME_NAMES.SECOND_FRAME); // Uses actual frame
      expect(state.flowStack).toEqual(mockEmptyStack);
    });
  });

  describe('Complex Scenarios', () => {
    test('given sequence of navigations then maintains correct state', () => {
      let state = flowReducer(undefined, { type: 'init' });

      // Set initial flow
      state = flowReducer(state, setFlow(mockMainFlow));
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
      expect(state.flowStack[0].frame).toEqual(FRAME_NAMES.SECOND_FRAME); // Actual frame (for Back button)
      expect(state.flowStack[0].returnFrame).toEqual(FRAME_NAMES.THIRD_FRAME); // Return frame (for completion)

      // Navigate within sub flow
      state = flowReducer(state, navigateToFrame(FRAME_NAMES.SUB_SECOND_FRAME));
      expect(state.currentFrame).toEqual(FRAME_NAMES.SUB_SECOND_FRAME);

      // Return from sub flow (Back button - no useReturnFrame)
      state = flowReducer(state, returnFromFlow());
      expect(state.currentFlow).toEqual(mockMainFlow);
      expect(state.currentFrame).toEqual(FRAME_NAMES.SECOND_FRAME); // Goes to actual frame, not returnFrame
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

      state = flowReducer(state, setFlow(mockMainFlow));

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

      // First return - should work
      state = flowReducer(state, returnFromFlow());
      expect(state.flowStack).toEqual(mockEmptyStack);

      // Second return - should do nothing
      state = flowReducer(state, returnFromFlow());
      expect(state.currentFlow).toEqual(mockMainFlow);
      expect(state.currentFrame).toEqual(FRAME_NAMES.SECOND_FRAME);

      // Third return - should still do nothing
      state = flowReducer(state, returnFromFlow());
      expect(state.currentFlow).toEqual(mockMainFlow);
      expect(state.currentFrame).toEqual(FRAME_NAMES.SECOND_FRAME);
    });
  });

  describe('Frame History (navigateToPreviousFrame)', () => {
    test('given frame history exists then navigates to previous frame', () => {
      // Given - State with frame history (simulating previous navigations)
      const stateWithHistory = createFlowState({
        currentFlow: mockMainFlow,
        currentFrame: FRAME_NAMES.THIRD_FRAME,
        flowStack: mockEmptyStack,
        frameHistory: [FRAME_NAMES.INITIAL_FRAME, FRAME_NAMES.SECOND_FRAME],
      });

      // When
      const state = flowReducer(stateWithHistory, navigateToPreviousFrame());

      // Then
      expect(state.currentFrame).toEqual(FRAME_NAMES.SECOND_FRAME);
      expect(state.frameHistory).toEqual([FRAME_NAMES.INITIAL_FRAME]);
      expect(state.currentFlow).toEqual(mockMainFlow);
    });

    test('given single item in frame history then navigates and empties history', () => {
      // Given
      const stateWithSingleHistory = createFlowState({
        currentFlow: mockMainFlow,
        currentFrame: FRAME_NAMES.SECOND_FRAME,
        flowStack: mockEmptyStack,
        frameHistory: [FRAME_NAMES.INITIAL_FRAME],
      });

      // When
      const state = flowReducer(stateWithSingleHistory, navigateToPreviousFrame());

      // Then
      expect(state.currentFrame).toEqual(FRAME_NAMES.INITIAL_FRAME);
      expect(state.frameHistory).toEqual([]);
    });

    test('given empty frame history then does nothing', () => {
      // Given
      const stateWithoutHistory = createFlowState({
        currentFlow: mockMainFlow,
        currentFrame: FRAME_NAMES.INITIAL_FRAME,
        flowStack: mockEmptyStack,
        frameHistory: [],
      });

      // When
      const state = flowReducer(stateWithoutHistory, navigateToPreviousFrame());

      // Then
      expect(state.currentFrame).toEqual(FRAME_NAMES.INITIAL_FRAME);
      expect(state.frameHistory).toEqual([]);
      expect(state).toEqual(stateWithoutHistory);
    });

    test('given initial state then does nothing', () => {
      // Given
      const state = flowReducer(INITIAL_STATE, navigateToPreviousFrame());

      // Then
      expect(state).toEqual(INITIAL_STATE);
      expect(state.frameHistory).toEqual([]);
    });
  });

  describe('Frame History Management', () => {
    test('given navigateToFrame then pushes current frame to history', () => {
      // Given
      const state = flowReducer(mockStateWithMainFlow, navigateToFrame(FRAME_NAMES.SECOND_FRAME));

      // Then
      expect(state.frameHistory).toEqual([FRAME_NAMES.INITIAL_FRAME]);
      expect(state.currentFrame).toEqual(FRAME_NAMES.SECOND_FRAME);
    });

    test('given navigateToFrame from null frame then history remains empty', () => {
      // Given - State with no current frame
      const stateWithNullFrame = createFlowState({
        currentFlow: mockMainFlow,
        currentFrame: null,
        flowStack: mockEmptyStack,
        frameHistory: [],
      });

      // When
      const state = flowReducer(stateWithNullFrame, navigateToFrame(FRAME_NAMES.INITIAL_FRAME));

      // Then
      expect(state.frameHistory).toEqual([]);
      expect(state.currentFrame).toEqual(FRAME_NAMES.INITIAL_FRAME);
    });

    test('given multiple navigateToFrame then builds history stack', () => {
      // Given - Start with main flow
      let state = mockStateWithMainFlow;

      // When - Navigate through multiple frames
      state = flowReducer(state, navigateToFrame(FRAME_NAMES.SECOND_FRAME));
      expect(state.frameHistory).toEqual([FRAME_NAMES.INITIAL_FRAME]);

      state = flowReducer(state, navigateToFrame(FRAME_NAMES.THIRD_FRAME));
      expect(state.frameHistory).toEqual([FRAME_NAMES.INITIAL_FRAME, FRAME_NAMES.SECOND_FRAME]);

      // Then - Current frame is the latest
      expect(state.currentFrame).toEqual(FRAME_NAMES.THIRD_FRAME);
    });

    test('given clearFlow then clears frame history', () => {
      // Given - State with frame history
      const stateWithHistory = createFlowState({
        currentFlow: mockMainFlow,
        currentFrame: FRAME_NAMES.THIRD_FRAME,
        flowStack: mockEmptyStack,
        frameHistory: [FRAME_NAMES.INITIAL_FRAME, FRAME_NAMES.SECOND_FRAME],
      });

      // When
      const state = flowReducer(stateWithHistory, clearFlow());

      // Then
      expect(state.frameHistory).toEqual([]);
      expect(state).toEqual(INITIAL_STATE);
    });

    test('given setFlow then clears frame history', () => {
      // Given - State with frame history
      const stateWithHistory = createFlowState({
        currentFlow: mockMainFlow,
        currentFrame: FRAME_NAMES.THIRD_FRAME,
        flowStack: mockEmptyStack,
        frameHistory: [FRAME_NAMES.INITIAL_FRAME, FRAME_NAMES.SECOND_FRAME],
      });

      // When
      const state = flowReducer(stateWithHistory, setFlow(mockSubFlow));

      // Then
      expect(state.frameHistory).toEqual([]);
      expect(state.currentFlow).toEqual(mockSubFlow);
    });

    test('given navigateToFlow then saves current frame history to stack and starts fresh', () => {
      // Given - State with frame history
      const stateWithHistory = createFlowState({
        currentFlow: mockMainFlow,
        currentFrame: FRAME_NAMES.THIRD_FRAME,
        flowStack: mockEmptyStack,
        frameHistory: [FRAME_NAMES.INITIAL_FRAME, FRAME_NAMES.SECOND_FRAME],
      });

      // When
      const state = flowReducer(stateWithHistory, navigateToFlow({ flow: mockSubFlow }));

      // Then - Current history cleared, but saved in stack
      expect(state.frameHistory).toEqual([]);
      expect(state.currentFlow).toEqual(mockSubFlow);
      expect(state.flowStack).toHaveLength(1);
      expect(state.flowStack[0].frameHistory).toEqual([
        FRAME_NAMES.INITIAL_FRAME,
        FRAME_NAMES.SECOND_FRAME,
      ]);
    });

    test('given returnFromFlow then restores frame history from stack', () => {
      // Given - State in subflow with frame history, and parent has history in stack
      const stateInSubflowWithHistory = createFlowState({
        currentFlow: mockSubFlow,
        currentFrame: FRAME_NAMES.SUB_SECOND_FRAME,
        flowStack: [
          createFlowStackEntry(mockMainFlow, FRAME_NAMES.SECOND_FRAME, [FRAME_NAMES.INITIAL_FRAME]),
        ],
        frameHistory: [FRAME_NAMES.SUB_INITIAL_FRAME],
      });

      // When
      const state = flowReducer(stateInSubflowWithHistory, returnFromFlow());

      // Then - Frame history RESTORED from stack
      expect(state.frameHistory).toEqual([FRAME_NAMES.INITIAL_FRAME]);
      expect(state.currentFlow).toEqual(mockMainFlow);
      expect(state.currentFrame).toEqual(FRAME_NAMES.SECOND_FRAME);
    });
  });

  describe('Frame History Integration', () => {
    test('given forward and back navigation then maintains correct state', () => {
      // Given - Start with main flow
      let state = mockStateWithMainFlow;
      expect(state.currentFrame).toEqual(FRAME_NAMES.INITIAL_FRAME);
      expect(state.frameHistory).toEqual([]);

      // Navigate forward to second frame
      state = flowReducer(state, navigateToFrame(FRAME_NAMES.SECOND_FRAME));
      expect(state.currentFrame).toEqual(FRAME_NAMES.SECOND_FRAME);
      expect(state.frameHistory).toEqual([FRAME_NAMES.INITIAL_FRAME]);

      // Navigate forward to third frame
      state = flowReducer(state, navigateToFrame(FRAME_NAMES.THIRD_FRAME));
      expect(state.currentFrame).toEqual(FRAME_NAMES.THIRD_FRAME);
      expect(state.frameHistory).toEqual([FRAME_NAMES.INITIAL_FRAME, FRAME_NAMES.SECOND_FRAME]);

      // Navigate back to second frame
      state = flowReducer(state, navigateToPreviousFrame());
      expect(state.currentFrame).toEqual(FRAME_NAMES.SECOND_FRAME);
      expect(state.frameHistory).toEqual([FRAME_NAMES.INITIAL_FRAME]);

      // Navigate back to initial frame
      state = flowReducer(state, navigateToPreviousFrame());
      expect(state.currentFrame).toEqual(FRAME_NAMES.INITIAL_FRAME);
      expect(state.frameHistory).toEqual([]);

      // Try to navigate back again (should do nothing)
      state = flowReducer(state, navigateToPreviousFrame());
      expect(state.currentFrame).toEqual(FRAME_NAMES.INITIAL_FRAME);
      expect(state.frameHistory).toEqual([]);
    });

    test('given subflow navigation then frame history is per-flow and restored on return', () => {
      // Given - Start in main flow with some history
      let state = mockStateWithMainFlow;
      state = flowReducer(state, navigateToFrame(FRAME_NAMES.SECOND_FRAME));
      expect(state.frameHistory).toEqual([FRAME_NAMES.INITIAL_FRAME]);

      // When - Navigate to subflow
      state = flowReducer(state, navigateToFlow({ flow: mockSubFlow }));

      // Then - Frame history should be cleared for new flow, but saved in stack
      expect(state.frameHistory).toEqual([]);
      expect(state.currentFrame).toEqual(FRAME_NAMES.SUB_INITIAL_FRAME);
      expect(state.flowStack).toHaveLength(1);
      expect(state.flowStack[0].frameHistory).toEqual([FRAME_NAMES.INITIAL_FRAME]);

      // Navigate within subflow
      state = flowReducer(state, navigateToFrame(FRAME_NAMES.SUB_SECOND_FRAME));
      expect(state.frameHistory).toEqual([FRAME_NAMES.SUB_INITIAL_FRAME]);

      // Return from subflow
      state = flowReducer(state, returnFromFlow());

      // Then - Frame history RESTORED from parent flow
      expect(state.frameHistory).toEqual([FRAME_NAMES.INITIAL_FRAME]);
      expect(state.currentFrame).toEqual(FRAME_NAMES.SECOND_FRAME);
      expect(state.flowStack).toEqual(mockEmptyStack);
    });

    test('given user returns from subflow then can still go back in parent flow', () => {
      // Given - User navigates through policy flow: Initial → Second → Third
      let state = mockStateWithMainFlow;
      state = flowReducer(state, navigateToFrame(FRAME_NAMES.SECOND_FRAME));
      state = flowReducer(state, navigateToFrame(FRAME_NAMES.THIRD_FRAME));
      expect(state.currentFrame).toEqual(FRAME_NAMES.THIRD_FRAME);
      expect(state.frameHistory).toEqual([FRAME_NAMES.INITIAL_FRAME, FRAME_NAMES.SECOND_FRAME]);

      // When - User clicks "Add Population" button, entering population subflow
      state = flowReducer(state, navigateToFlow({ flow: mockSubFlow }));
      expect(state.currentFrame).toEqual(FRAME_NAMES.SUB_INITIAL_FRAME);
      expect(state.frameHistory).toEqual([]); // Fresh history in subflow

      // Navigate within subflow
      state = flowReducer(state, navigateToFrame(FRAME_NAMES.SUB_SECOND_FRAME));
      expect(state.frameHistory).toEqual([FRAME_NAMES.SUB_INITIAL_FRAME]);

      // User finishes population and returns to policy flow
      state = flowReducer(state, returnFromFlow());
      expect(state.currentFrame).toEqual(FRAME_NAMES.THIRD_FRAME);
      expect(state.frameHistory).toEqual([FRAME_NAMES.INITIAL_FRAME, FRAME_NAMES.SECOND_FRAME]);

      // Then - User should be able to click Back button to go to SECOND_FRAME
      state = flowReducer(state, navigateToPreviousFrame());
      expect(state.currentFrame).toEqual(FRAME_NAMES.SECOND_FRAME);
      expect(state.frameHistory).toEqual([FRAME_NAMES.INITIAL_FRAME]);

      // And back again to INITIAL_FRAME
      state = flowReducer(state, navigateToPreviousFrame());
      expect(state.currentFrame).toEqual(FRAME_NAMES.INITIAL_FRAME);
      expect(state.frameHistory).toEqual([]);
    });
  });
});
