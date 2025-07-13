import { useState } from 'react';
import { Button } from '@mantine/core';
import PolicyCreationView from '../policyFlow/PolicyCreationView';
import { useDispatch } from 'react-redux';
import { setFlow, clearFlow } from '../reducers/flowReducer';
import FlowContainer from '@/components/FlowContainer';
import { PolicyCreationFlow, TestCompleteFlow, TestFlow } from '@/flows/policyCreationFlow';

export function HomePage() {
  const dispatch = useDispatch();
  // Note: Below is for testing purposes only
  return (
    <>
      <h1>TODO: Home Page</h1>
      <Button variant="default" onClick={() => dispatch(clearFlow())}>
        Clear all flows
      </Button>
      <Button variant="default" onClick={() => dispatch(setFlow(PolicyCreationFlow))}
      >
        Execute policy creation flow
      </Button>
      <Button variant="default" onClick={() => dispatch(setFlow(TestFlow))}
      >
        Execute test flow
      </Button>
      <Button variant="default" onClick={() => dispatch(setFlow(TestCompleteFlow))}
      >
        Execute "complete" testing flow
      </Button>
      <FlowContainer />
    </>
  );
}
