import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@mantine/core';
import FlowContainer from '@/components/FlowContainer';
import { PolicyCreationFlow } from '@/flows/policyCreationFlow';
import { PolicyViewFlow } from '@/flows/policyViewFlow';
import { PopulationCreationFlow } from '@/flows/populationCreationFlow';
import { PopulationViewFlow } from '@/flows/populationViewFlow';
import { SimulationCreationFlow } from '@/flows/simulationCreationFlow';
import { SimulationViewFlow } from '@/flows/simulationViewFlow';
import { fetchMetadataThunk } from '@/reducers/metadataReducer';
import { AppDispatch, RootState } from '@/store';
import { clearFlow, setFlow } from '../reducers/flowReducer';

export default function HomePage() {
  const dispatch = useDispatch<AppDispatch>();

  const currentCountryInState = useSelector((state: RootState) => state.metadata.currentCountry);
  // Mocking countryId since route not defined yet. TODO: useParams(countryId) instead
  const countryId = 'us';
  useEffect(() => {
    if (countryId !== currentCountryInState) {
      dispatch(fetchMetadataThunk(countryId));
    }
  }, [countryId, currentCountryInState]);

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
      <Button variant="default" onClick={() => dispatch(setFlow(SimulationViewFlow))}>
        Show Simulation View
      </Button>
      <Button variant="default" onClick={() => dispatch(setFlow(PopulationCreationFlow))}>
        Execute Population Flow
      </Button>
      <Button variant="default" onClick={() => dispatch(setFlow(PopulationViewFlow))}>
        View Populations
      </Button>
      <FlowContainer />
    </>
  );
}
