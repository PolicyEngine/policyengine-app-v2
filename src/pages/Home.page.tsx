import { useDispatch } from 'react-redux';
import { Button } from '@mantine/core';
import FlowContainer from '@/components/FlowContainer';
import { PolicyCreationFlow } from '@/flows/policyCreationFlow';
import { PolicyViewFlow } from '@/flows/policyViewFlow';
import { PopulationCreationFlow } from '@/flows/populationCreationFlow';
import { PopulationViewFlow } from '@/flows/populationViewFlow';
import { SimulationCreationFlow } from '@/flows/simulationCreationFlow';
import { SimulationViewFlow } from '@/flows/simulationViewFlow';
import { useFetchMetadata } from '@/hooks/useMetadata';
import { clearFlow, setFlow } from '../reducers/flowReducer';

export default function HomePage() {
  const dispatch = useDispatch();

  // TODO: Replace with dynamic country from URL route parameter
  // When routing is implemented, this will become:
  // const { countryId } = useParams();
  // This approach ensures metadata is fetched when:
  // 1. Component mounts (initial load)
  // 2. countryId changes (when user navigates between countries)
  const countryId = 'us';
  useFetchMetadata(countryId);

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
