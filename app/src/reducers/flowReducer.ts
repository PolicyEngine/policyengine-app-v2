import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ComponentKey } from '../flows/registry';
import { Flow } from '../types/flow';

interface FlowState {
  currentFlow: Flow | null;
  currentFrame: ComponentKey | null;
  // Stack to track nested flows - when we enter a subflow, we push the current state
  flowStack: Array<{
    flow: Flow;
    frame: ComponentKey;
  }>;
  // Path to navigate to when top-level flow completes
  returnPath: string | null;
}

const initialState: FlowState = {
  currentFlow: null,
  currentFrame: null,
  flowStack: [],
  returnPath: null,
};

export const flowSlice = createSlice({
  name: 'flow',
  initialState,
  reducers: {
    clearFlow: (state) => {
      state.currentFlow = null;
      state.currentFrame = null;
      state.flowStack = [];
      state.returnPath = null;
    },
    setFlow: (state, action: PayloadAction<{ flow: Flow; returnPath?: string }>) => {
      console.log('[FLOW REDUCER] ========== setFlow START ==========');
      console.log('[FLOW REDUCER] New flow initialFrame:', action.payload.flow.initialFrame);
      console.log('[FLOW REDUCER] returnPath:', action.payload.returnPath);
      console.log('[FLOW REDUCER] Current frame before:', state.currentFrame);

      state.currentFlow = action.payload.flow;
      state.returnPath = action.payload.returnPath || null;
      // Set initial frame - if it's a component, use it; if it's a flow, handle separately
      if (action.payload.flow.initialFrame && typeof action.payload.flow.initialFrame === 'string') {
        state.currentFrame = action.payload.flow.initialFrame as ComponentKey;
      }
      state.flowStack = [];

      console.log('[FLOW REDUCER] Current frame after:', state.currentFrame);
      console.log('[FLOW REDUCER] ========== setFlow END ==========');
    },
    navigateToFrame: (state, action: PayloadAction<ComponentKey>) => {
      console.log('[FLOW REDUCER] ========== navigateToFrame START ==========');
      console.log('[FLOW REDUCER] Current frame:', state.currentFrame);
      console.log('[FLOW REDUCER] New frame:', action.payload);
      state.currentFrame = action.payload;
      console.log('[FLOW REDUCER] Frame updated to:', state.currentFrame);
      console.log('[FLOW REDUCER] ========== navigateToFrame END ==========');
    },
    // Navigate to a subflow - pushes current state onto stack
    navigateToFlow: (state, action: PayloadAction<{ flow: Flow; returnFrame?: ComponentKey }>) => {
      if (state.currentFlow && state.currentFrame) {
        // Push current state onto stack
        state.flowStack.push({
          flow: state.currentFlow,
          frame: action.payload.returnFrame || state.currentFrame,
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
    },
    // Return from a subflow - pops from stack
    returnFromFlow: (state) => {
      if (state.flowStack.length > 0) {
        // In a subflow: pop back to parent flow
        const previousState = state.flowStack.pop()!;
        state.currentFlow = previousState.flow;
        state.currentFrame = previousState.frame;
      } else {
        // At top level: clear the flow entirely
        state.currentFlow = null;
        state.currentFrame = null;
        state.flowStack = [];
      }
    },
  },
});

export const { clearFlow, setFlow, navigateToFrame, navigateToFlow, returnFromFlow } =
  flowSlice.actions;

export default flowSlice.reducer;
