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
      <Button variant="default" onClick={() => dispatch(setFlow({ flow: PolicyCreationFlow }))}>
        Execute policy creation flow
      </Button>
      <Button variant="default" onClick={() => dispatch(setFlow({ flow: PolicyViewFlow }))}>
        Show Policy View
      </Button>
      <Button variant="default" onClick={() => dispatch(setFlow({ flow: SimulationCreationFlow }))}>
        Execute simulation creation flow
      </Button>
      <Button variant="default" onClick={() => dispatch(setFlow({ flow: SimulationViewFlow }))}>
        Show Simulation View
      </Button>
      <Button variant="default" onClick={() => dispatch(setFlow({ flow: PopulationCreationFlow }))}>
        Execute Population Flow
      </Button>
      <Button variant="default" onClick={() => dispatch(setFlow({ flow: PopulationViewFlow }))}>
        View Populations
      </Button>
      <Button variant="default" onClick={() => dispatch(setFlow({ flow: ReportCreationFlow }))}>
        Execute Report Creation Flow (TEST)
      </Button>
      <Button variant="default" onClick={() => dispatch(setFlow({ flow: ReportViewFlow }))}>
        Show Report View
      </Button>
      <Button variant="default" onClick={() => navigate('/us/report-output-demo')}>
        View Society-Wide Report Output (Demo)
      </Button>
      <Button variant="default" onClick={() => navigate('/us/household-output-demo')}>
        View Household Report Output (Demo)
      </Button>
      <h2>Policy Tab Designs</h2>
      <h3>Card-Based Views</h3>
      <Button variant="default" onClick={() => navigate('/us/policy-design-1')}>
        Design 1: Left-Hand Tabs (Card View)
      </Button>
      <Button variant="default" onClick={() => navigate('/us/policy-design-2')}>
        Design 2: Separate Ribbon Tabs (Card View)
      </Button>
      <Button variant="default" onClick={() => navigate('/us/policy-design-3')}>
        Design 3: Side-by-Side Comparison (Card View)
      </Button>
      <h3>Table & List Views</h3>
      <Button variant="default" onClick={() => navigate('/us/policy-design-4')}>
        Design 4: Table Comparison (Current Law, Baseline, Reform)
      </Button>
      <Button variant="default" onClick={() => navigate('/us/policy-design-5')}>
        Design 5: Compact List with Left-Hand Tabs
      </Button>
      <Button variant="default" onClick={() => navigate('/us/policy-design-6')}>
        Design 6: Compact List with Separate Ribbon Tabs
      </Button>
      <Button variant="default" onClick={() => navigate('/us/policy-design-7')}>
        Design 7: Borderless List with Left-Hand Tabs
      </Button>
      <Button variant="default" onClick={() => navigate('/us/policy-design-8')}>
        Design 8: Borderless List with Separate Ribbon Tabs
      </Button>
      <Button variant="default" onClick={() => navigate('/us/policy-design-9')}>
        Design 9: Ultra-Minimal List with Left-Hand Tabs
      </Button>
      <Button variant="default" onClick={() => navigate('/us/policy-design-10')}>
        Design 10: Ultra-Minimal List with Separate Ribbon Tabs
      </Button>
      <Button variant="default" onClick={() => navigate('/us/policy-design-11')}>
        Design 11: Ultra-Minimal Head-to-Head Comparison
      </Button>
      <FlowContainer />
    </>
  );
}
