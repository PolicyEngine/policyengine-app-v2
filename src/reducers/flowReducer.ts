import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Flow } from '../flows/types';
import { ComponentKey } from '../flows/registry';

interface FlowState {
  currentFlow: Flow | null;
  currentFrame: ComponentKey | null;
  // Stack to track nested flows - when we enter a subflow, we push the current state
  flowStack: Array<{
    flow: Flow;
    frame: ComponentKey;
  }>;
}

const initialState: FlowState = {
  currentFlow: null,
  currentFrame: null,
  flowStack: [],
}

export const flowSlice = createSlice({
  name: 'flow',
  initialState,
  reducers: {
    clearFlow: (state) => {
      state.currentFlow = null;
      state.currentFrame = null;
      state.flowStack = [];
    },
    setFlow: (state, action: PayloadAction<Flow>) => {
      state.currentFlow = action.payload;
      // Set initial frame - if it's a component, use it; if it's a flow, handle separately
      if (action.payload.initialFrame && typeof action.payload.initialFrame === 'string') {
        state.currentFrame = action.payload.initialFrame as ComponentKey;
      }
      state.flowStack = [];
    },
    navigateToFrame: (state, action: PayloadAction<ComponentKey>) => {
      state.currentFrame = action.payload;
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
      if (action.payload.flow.initialFrame && typeof action.payload.flow.initialFrame === 'string') {
        state.currentFrame = action.payload.flow.initialFrame as ComponentKey;
      }
    },
    // Return from a subflow - pops from stack
    returnFromFlow: (state) => {
      if (state.flowStack.length > 0) {
        const previousState = state.flowStack.pop()!;
        state.currentFlow = previousState.flow;
        state.currentFrame = previousState.frame;
      }
    },
  }
});

export const { 
  clearFlow, 
  setFlow, 
  navigateToFrame, 
  navigateToFlow, 
  returnFromFlow 
} = flowSlice.actions;

export default flowSlice.reducer;