import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { selectCurrentPosition } from '@/reducers/activeSelectors';
import { setMode } from '@/reducers/reportReducer';
import {
  createSimulationAtPosition,
  selectSimulationAtPosition,
  updateSimulationAtPosition,
} from '@/reducers/simulationsReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';

export default function SimulationCreationFrame({ onNavigate, isInSubflow }: FlowComponentProps) {
  const dispatch = useDispatch();

  // Get the current position from the cross-cutting selector
  const currentPosition = useSelector((state: RootState) => selectCurrentPosition(state));
  const simulation = useSelector((state: RootState) =>
    selectSimulationAtPosition(state, currentPosition)
  );

  // Get report state for auto-naming
  const reportState = useSelector((state: RootState) => state.report);

  // Generate default label based on context
  const getDefaultLabel = () => {
    if (reportState.mode === 'report' && reportState.label) {
      // Report mode WITH report name: prefix with report name
      const baseName = currentPosition === 0 ? 'baseline simulation' : 'reform simulation';
      return `${reportState.label} ${baseName}`;
    }
    // All other cases: use standalone label
    const baseName = currentPosition === 0 ? 'Baseline simulation' : 'Reform simulation';
    return baseName;
  };

  const [localLabel, setLocalLabel] = useState(getDefaultLabel());

  console.log('[SimulationCreationFrame] RENDER - currentPosition:', currentPosition);
  console.log('[SimulationCreationFrame] RENDER - simulation:', simulation);

  // Set mode to standalone if not in a subflow
  useEffect(() => {
    console.log('[SimulationCreationFrame] Mode effect - isInSubflow:', isInSubflow);
    if (!isInSubflow) {
      dispatch(setMode('standalone'));
    }

    return () => {
      console.log('[SimulationCreationFrame] Cleanup - mode effect');
    };
  }, [dispatch, isInSubflow]);

  useEffect(() => {
    console.log(
      '[SimulationCreationFrame] Create simulation effect - simulation exists?:',
      !!simulation
    );
    // If there's no simulation at current position, create one
    if (!simulation) {
      console.log('[SimulationCreationFrame] Creating simulation at position', currentPosition);
      dispatch(createSimulationAtPosition({ position: currentPosition }));
    }

    return () => {
      console.log('[SimulationCreationFrame] Cleanup - create simulation effect');
    };
  }, [currentPosition, simulation, dispatch]);

  function handleLocalLabelChange(value: string) {
    setLocalLabel(value);
  }

  function submissionHandler() {
    console.log('[SimulationCreationFrame] ========== submissionHandler START ==========');
    console.log('[SimulationCreationFrame] Updating simulation with label:', localLabel);
    // Update the simulation at the current position
    dispatch(
      updateSimulationAtPosition({
        position: currentPosition,
        updates: { label: localLabel },
      })
    );
    console.log('[SimulationCreationFrame] Calling onNavigate("next")');
    onNavigate('next');
    console.log('[SimulationCreationFrame] ========== submissionHandler END ==========');
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
