import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { 
  createSimulation, 
  updateSimulationLabel,
  selectActiveSimulationId 
} from '@/reducers/simulationsReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';

export default function SimulationCreationFrame({ onNavigate }: FlowComponentProps) {
  const [localLabel, setLocalLabel] = useState('');
  const dispatch = useDispatch();
  
  // Get the active simulation ID from the reducer
  const activeSimulationId = useSelector((state: RootState) => selectActiveSimulationId(state));

  useEffect(() => {
    // If there's no active simulation, create one
    if (!activeSimulationId) {
      dispatch(createSimulation());
    }
  }, [activeSimulationId, dispatch]);

  function handleLocalLabelChange(value: string) {
    setLocalLabel(value);
  }

  function submissionHandler() {
    // Dispatch to the simulations reducer
    if (activeSimulationId) {
      dispatch(updateSimulationLabel({ label: localLabel }));
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
