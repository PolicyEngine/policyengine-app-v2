import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Flow, FlowCollection } from '../flows/types';

const initialState: FlowCollection = [];

export const flowSlice = createSlice({
  name: 'flow',
  initialState,
  reducers: {
    addFlow: (state, action: PayloadAction<Flow>) => {
      state.push(action.payload);
    },
    removeFlowByName: (state, action: PayloadAction<string>) => {
      return state.filter(flow => flow.name !== action.payload);
    },
    clearFlows: (state) => {
      state = [];
    }
  }
});

// Action creators are generated for each case reducer function
export const { addFlow, removeFlowByName } = flowSlice.actions;

export default flowSlice.reducer;
