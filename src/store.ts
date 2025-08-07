import { configureStore } from '@reduxjs/toolkit';
import flowReducer from './reducers/flowReducer';
import policyReducer from './reducers/policyReducer';
import simulationReducer from './reducers/simulationReducer';

export const store = configureStore({
  reducer: {
    policy: policyReducer,
    flow: flowReducer,
    simulation: simulationReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
