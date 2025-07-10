import { configureStore } from '@reduxjs/toolkit';
import policyReducer from './reducers/policyReducer';
import flowReducer from './reducers/flowReducer';

export const store = configureStore({
  reducer: {
    policy: policyReducer,
    flow: flowReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
