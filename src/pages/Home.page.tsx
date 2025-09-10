import { useDispatch } from 'react-redux';
import { Button } from '@mantine/core';
import FlowContainer from '@/components/FlowContainer';
import { PolicyCreationFlow } from '@/flows/policyCreationFlow';
import { PolicyViewFlow } from '@/flows/policyViewFlow';
import { PopulationCreationFlow } from '@/flows/populationCreationFlow';
import { PopulationViewFlow } from '@/flows/populationViewFlow';
import { SimulationCreationFlow } from '@/flows/simulationCreationFlow';
import { SimulationViewFlow } from '@/flows/simulationViewFlow';
import { clearFlow, setFlow } from '../reducers/flowReducer';
import Embed from "../components/Embed/Embed";


export default function HomePage() {
  const dispatch = useDispatch();
  // Note: Below is for testing purposes only
  return (
    <>
      <h1>TODO: Home Page</h1>
      
      <Embed
        header="testing YouTube"
        embedType="youtube"
        src="https://www.youtube.com/watch?v=veyZNyurlwU"
      />

      <Embed
        header="testing Vimeo"
        embedType="vimeo"
        src="https://vimeo.com/524933864"
      />

      <Embed
        header="testing iFrame"
        embedType="iframe"
        src="https://maps.google.com/maps?q=Times%20Square%2C%20New%20York&output=embed"
      />

      <Embed
        header="testing image"
        embedType="image"
        src="https://i.natgeofe.com/k/9acd2bad-fb0e-43a8-935d-ec0aefc60c2f/monarch-butterfly-grass_square.jpg?wp=1&w=357&h=357"
        alt="Cute kitten"
      />
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
