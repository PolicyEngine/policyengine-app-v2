import { configureStore } from '@reduxjs/toolkit';
import flowReducer from './reducers/flowReducer';
import metadataReducer from './reducers/metadataReducer';
import policyReducer from './reducers/policyReducer';
import populationReducer from './reducers/populationReducer';
import simulationReducer from './reducers/simulationReducer';

export const store = configureStore({
  reducer: {
    policy: policyReducer,
    flow: flowReducer,
    household: populationReducer,
    simulation: simulationReducer,
    population: populationReducer,
    metadata: metadataReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
