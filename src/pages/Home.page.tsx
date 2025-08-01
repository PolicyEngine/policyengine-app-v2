// import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button } from '@mantine/core';
import FlowContainer from '@/components/FlowContainer';
import { PolicyCreationFlow } from '@/flows/policyCreationFlow';
import { PolicyViewFlow } from '@/flows/policyViewFlow';
import { SimulationCreationFlow } from '@/flows/simulationCreationFlow';
import { clearFlow, setFlow } from '../reducers/flowReducer';

// import PoliciesPage from './Policies.page';

export function HomePage() {
  const dispatch = useDispatch();
  // const [showPolicyView, setShowPolicyView] = useState(false);
  // Note: Below is for testing purposes only
  return (
    <>
      <h1>TODO: Home Page</h1>
      <Button variant="default" onClick={() => dispatch(clearFlow())}>
        Clear all flows
      </Button>
      <Button variant="default" onClick={() => dispatch(setFlow(PolicyCreationFlow))}>
        Execute policy creation flow
      </Button>
      <Button variant="default" onClick={() => dispatch(setFlow(PolicyViewFlow))}>
        Show Policy View
      </Button>
      <Button variant="default" onClick={() => dispatch(setFlow(SimulationCreationFlow))}>
        Execute simulation creation flow
      </Button>
      {/* {showPolicyView && <PoliciesPage />} */}
      <FlowContainer />
    </>
  );
}
