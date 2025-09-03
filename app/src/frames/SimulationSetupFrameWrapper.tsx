import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { selectSimulationsMode } from '@/reducers/simulationsReducer';
import { FlowComponentProps } from '@/types/flow';
import SimulationSetupFrame from './SimulationSetupFrame';
import SimulationSetupFrameMulti from './SimulationSetupFrameMulti';

// @compat - this entire component
/**
 * Wrapper component that routes to the appropriate SimulationSetupFrame
 * based on the current simulations mode (single vs multi)
 */
export default function SimulationSetupFrameWrapper(props: FlowComponentProps) {
  const mode = useSelector((state: RootState) => selectSimulationsMode(state));
  
  // In multi mode, use the new normalized version
  if (mode === 'multi') {
    return <SimulationSetupFrameMulti {...props} />;
  }
  
  // In single mode (default), use the original component
  return <SimulationSetupFrame {...props} />;
}