import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import {
  createSimulationAtPosition,
  selectActivePosition,
  updateSimulationAtPosition,
} from '@/reducers/simulationsReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';

export default function SimulationCreationFrame({ onNavigate }: FlowComponentProps) {
  const [localLabel, setLocalLabel] = useState('');
  const dispatch = useDispatch();

  // Get the active position from the reducer
  const activePosition = useSelector((state: RootState) => selectActivePosition(state));

  useEffect(() => {
    // If there's no active simulation, create one at position 0
    if (activePosition === null) {
      dispatch(createSimulationAtPosition({ position: 0 }));
    }
  }, [activePosition, dispatch]);

  function handleLocalLabelChange(value: string) {
    setLocalLabel(value);
  }

  function submissionHandler() {
    // Dispatch to the simulations reducer
    if (activePosition !== null) {
      dispatch(updateSimulationAtPosition({
        position: activePosition,
        updates: { label: localLabel }
      }));
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
