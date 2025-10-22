import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mantine/core';
import FlowContainer from '@/components/FlowContainer';
import { PolicyCreationFlow } from '@/flows/policyCreationFlow';
import { PolicyViewFlow } from '@/flows/policyViewFlow';
import { PopulationCreationFlow } from '@/flows/populationCreationFlow';
import { PopulationViewFlow } from '@/flows/populationViewFlow';
import { ReportCreationFlow } from '@/flows/reportCreationFlow';
import { ReportViewFlow } from '@/flows/reportViewFlow';
import { SimulationCreationFlow } from '@/flows/simulationCreationFlow';
import { SimulationViewFlow } from '@/flows/simulationViewFlow';
import { clearFlow, setFlow } from '../reducers/flowReducer';

export default function HomePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
      <Button variant="default" onClick={() => dispatch(setFlow(ReportCreationFlow))}>
        Execute Report Creation Flow (TEST)
      </Button>
      <Button variant="default" onClick={() => dispatch(setFlow(ReportViewFlow))}>
        Show Report View
      </Button>
      <Button variant="default" onClick={() => navigate('/us/report-output-demo')}>
        View Society-Wide Report Output (Demo)
      </Button>
      <Button variant="default" onClick={() => navigate('/us/household-output-demo')}>
        View Household Report Output (Demo)
      </Button>
      <FlowContainer />
    </>
  );
}
