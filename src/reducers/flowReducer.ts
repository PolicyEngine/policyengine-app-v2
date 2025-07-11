import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Flow } from '../flows/types';

const initialState: Flow = {
  name: '',
  initialFrame: null,
  frames: {},
}

export const flowSlice = createSlice({
  name: 'flow',
  initialState,
  reducers: {
    clearFlow: (state) => {
      state.name = '';
      state.initialFrame = null;
      state.frames = {};
    },
    setFlow: (state, action: PayloadAction<Flow>) => {
      state.name = action.payload.name;
      state.initialFrame = action.payload.initialFrame;
      state.frames = action.payload.frames;
    },
  }
});

// Action creators are generated for each case reducer function
export const { clearFlow, setFlow } = flowSlice.actions;

export default flowSlice.reducer;
