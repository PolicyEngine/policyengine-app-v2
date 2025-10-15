import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ComponentKey } from '../flows/registry';
import { Flow } from '../types/flow';

interface FlowState {
  currentFlow: Flow | null;
  currentFrame: ComponentKey | null;
  // Stack to track nested flows - when we enter a subflow, we push the current state
  flowStack: Array<{
    flow: Flow;
    frame: ComponentKey; // Frame to return to (for Back button - always the frame we were on)
    returnFrame?: ComponentKey; // Frame to return to on successful completion (from returnTo)
    frameHistory: ComponentKey[]; // Preserve frame history per flow
  }>;
  // Stack to track frame navigation history within the current flow
  frameHistory: ComponentKey[];
}

const initialState: FlowState = {
  currentFlow: null,
  currentFrame: null,
  flowStack: [],
  frameHistory: [],
};

export const flowSlice = createSlice({
  name: 'flow',
  initialState,
  reducers: {
    clearFlow: (state) => {
      state.currentFlow = null;
      state.currentFrame = null;
      state.flowStack = [];
      state.frameHistory = [];
    },
    setFlow: (state, action: PayloadAction<Flow>) => {
      state.currentFlow = action.payload;
      // Set initial frame - if it's a component, use it; if it's a flow, handle separately
      if (action.payload.initialFrame && typeof action.payload.initialFrame === 'string') {
        state.currentFrame = action.payload.initialFrame as ComponentKey;
      }
      state.flowStack = [];
      state.frameHistory = [];
    },
    navigateToFrame: (state, action: PayloadAction<ComponentKey>) => {
      // Push current frame to history before navigating to new frame
      if (state.currentFrame) {
        state.frameHistory.push(state.currentFrame);
      }
      state.currentFrame = action.payload;
    },
    // Navigate to a subflow - pushes current state onto stack
    navigateToFlow: (state, action: PayloadAction<{ flow: Flow; returnFrame?: ComponentKey }>) => {
      if (state.currentFlow && state.currentFrame) {
        // Push current state onto stack, including frame history
        state.flowStack.push({
          flow: state.currentFlow,
          frame: state.currentFrame, // Always save the actual current frame for Back button
          returnFrame: action.payload.returnFrame, // Save the desired return frame for completion
          frameHistory: state.frameHistory,
        });
      }

      // Set new flow as current
      state.currentFlow = action.payload.flow;
      if (
        action.payload.flow.initialFrame &&
        typeof action.payload.flow.initialFrame === 'string'
      ) {
        state.currentFrame = action.payload.flow.initialFrame as ComponentKey;
      }
      // Start fresh frame history for the new flow
      state.frameHistory = [];
    },
    // Return from a subflow - pops from stack
    // Uses returnFrame if specified (for successful completion), otherwise uses frame (for Back button)
    returnFromFlow: {
      reducer: (state, action: PayloadAction<{ useReturnFrame?: boolean } | undefined>) => {
        if (state.flowStack.length > 0) {
          const previousState = state.flowStack.pop()!;
          state.currentFlow = previousState.flow;

          // If useReturnFrame is true and returnFrame exists, use it; otherwise use the actual frame
          const shouldUseReturnFrame = action.payload?.useReturnFrame && previousState.returnFrame;
          state.currentFrame = shouldUseReturnFrame ? previousState.returnFrame! : previousState.frame;

          // Restore frame history from the parent flow
          state.frameHistory = previousState.frameHistory;
        }
      },
      prepare: (payload?: { useReturnFrame?: boolean }) => ({ payload }),
    },
    // Navigate to previous frame in history
    navigateToPreviousFrame: (state) => {
      if (state.frameHistory.length > 0) {
        state.currentFrame = state.frameHistory.pop()!;
      }
    },
  },
});

export const {
  clearFlow,
  setFlow,
  navigateToFrame,
  navigateToFlow,
  returnFromFlow,
  navigateToPreviousFrame,
} = flowSlice.actions;

export default flowSlice.reducer;
