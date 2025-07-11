import { useState } from 'react';
import { Button } from '@mantine/core';
import PolicyCreationView from '../policyFlow/PolicyCreationView';
import { useDispatch } from 'react-redux';
import { setFlow, clearFlow } from '../reducers/flowReducer';
import FlowContainer from '@/components/FlowContainer';
import { policyCreationFlow } from '@/flows/policyCreationFlow';

export function HomePage() {
  const dispatch = useDispatch();
  // Note: This pagination function is for testing purposes only.
  /*
  const pages = [
    { name: 'home', component: null },
    { name: 'policy-input-1', component: <PolicyCreationView /> },
  ];
  */

  /*
  const [currentPage, setCurrentPage] = useState(pages[0]);

  function updatePage(pageName: string) {
    setCurrentPage(pages.find((page) => page.name === pageName) || pages[0]);
  }
    */

  return (
    <>
      <h1>TODO: Home Page</h1>
      <Button variant="default" onClick={() => dispatch(clearFlow())}>
        Clear all flows
      </Button>
      <Button variant="default" onClick={() => dispatch(setFlow(policyCreationFlow))}
      >
        Add policy creation flow
      </Button>
      <FlowContainer />
    </>
  );
}
