import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { updateSimulationLabel } from '@/reducers/simulationReducer';
import { 
  createSimulation, 
  updateSimulationLabel as updateSimulationLabelNew 
} from '@/reducers/simulationsReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';

export default function SimulationCreationFrame({ onNavigate }: FlowComponentProps) {
  const [localLabel, setLocalLabel] = useState('');
  const dispatch = useDispatch();
  
  // Get the active simulation ID from the new reducer (if it exists)
  const activeSimulationId = useSelector((state: RootState) => state.simulations?.activeId);

  // TODO: Make sure this effect hook is compatible with how we want to set up ingredients
  useEffect(() => {
    // If there's no active simulation in the new reducer, create one
    // This ensures we have a simulation to work with in the new structure
    if (!activeSimulationId) {
      dispatch(createSimulation());
    }
  }, [activeSimulationId, dispatch]);

  function handleLocalLabelChange(value: string) {
    setLocalLabel(value);
  }

  function submissionHandler() {
    // Dispatch to old reducer (for backward compatibility)
    dispatch(updateSimulationLabel(localLabel));
    
    // Dispatch to new reducer (for forward compatibility)
    if (activeSimulationId) {
      dispatch(updateSimulationLabelNew({ label: localLabel }));
    }
    
    onNavigate('next');
  }

  const formInputs = (
    <TextInput
      label="Simulation name"
      placeholder="Enter simulation name"
      value={localLabel}
      onChange={(e) => handleLocalLabelChange(e.currentTarget.value)}
    />
  );

  const primaryAction = {
    label: 'Create simulation',
    onClick: submissionHandler,
  };

  return <FlowView title="Create simulation" content={formInputs} primaryAction={primaryAction} />;
}
