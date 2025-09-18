import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import {
  createSimulationAtPosition,
  selectSimulationAtPosition,
  updateSimulationAtPosition,
} from '@/reducers/simulationsReducer';
import { selectCurrentPosition } from '@/reducers/activeSelectors';
import { setMode } from '@/reducers/reportReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';

export default function SimulationCreationFrame({ onNavigate, isInSubflow }: FlowComponentProps) {
  const [localLabel, setLocalLabel] = useState('');
  const dispatch = useDispatch();

  // Get the current position from the cross-cutting selector
  const currentPosition = useSelector((state: RootState) => selectCurrentPosition(state));
  const simulation = useSelector((state: RootState) => selectSimulationAtPosition(state, currentPosition));

  // Set mode to standalone if not in a subflow
  useEffect(() => {
    if (!isInSubflow) {
      dispatch(setMode('standalone'));
    }
  }, [dispatch, isInSubflow]);

  useEffect(() => {
    // If there's no simulation at current position, create one
    if (!simulation) {
      dispatch(createSimulationAtPosition({ position: currentPosition }));
    }
  }, [currentPosition, simulation, dispatch]);

  function handleLocalLabelChange(value: string) {
    setLocalLabel(value);
  }

  function submissionHandler() {
    // Update the simulation at the current position
    dispatch(updateSimulationAtPosition({
      position: currentPosition,
      updates: { label: localLabel }
    }));

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
