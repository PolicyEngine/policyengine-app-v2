import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { selectCurrentPosition } from '@/reducers/activeSelectors';
import {
  createPolicyAtPosition,
  selectPolicyAtPosition,
  updatePolicyAtPosition,
} from '@/reducers/policyReducer';
import { setMode } from '@/reducers/reportReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';

export default function PolicyCreationFrame({ onNavigate, isInSubflow }: FlowComponentProps) {
  const dispatch = useDispatch();

  // Get the current position from the cross-cutting selector
  const currentPosition = useSelector((state: RootState) => selectCurrentPosition(state));
  const policy = useSelector((state: RootState) => selectPolicyAtPosition(state, currentPosition));

  // Get report state for auto-naming
  const reportState = useSelector((state: RootState) => state.report);

  // Generate default label based on context
  const getDefaultLabel = () => {
    if (reportState.mode === 'report' && reportState.label) {
      // Report mode WITH report name: prefix with report name
      const baseName = currentPosition === 0 ? 'baseline policy' : 'reform policy';
      return `${reportState.label} ${baseName}`;
    }
    // All other cases: use standalone label
    const baseName = currentPosition === 0 ? 'Baseline policy' : 'Reform policy';
    return baseName;
  };

  const [localLabel, setLocalLabel] = useState(getDefaultLabel());

  console.log('[PolicyCreationFrame] RENDER - currentPosition:', currentPosition);
  console.log('[PolicyCreationFrame] RENDER - policy:', policy);

  // Set mode to standalone if not in a subflow
  useEffect(() => {
    console.log('[PolicyCreationFrame] Mode effect - isInSubflow:', isInSubflow);
    if (!isInSubflow) {
      dispatch(setMode('standalone'));
    }

    return () => {
      console.log('[PolicyCreationFrame] Cleanup - mode effect');
    };
  }, [dispatch, isInSubflow]);

  useEffect(() => {
    console.log('[PolicyCreationFrame] Create policy effect - policy exists?:', !!policy);
    // If there's no policy at current position, create one
    if (!policy) {
      console.log('[PolicyCreationFrame] Creating policy at position', currentPosition);
      dispatch(createPolicyAtPosition({ position: currentPosition }));
    }

    return () => {
      console.log('[PolicyCreationFrame] Cleanup - create policy effect');
    };
  }, [currentPosition, policy, dispatch]);

  function handleLocalLabelChange(value: string) {
    setLocalLabel(value);
  }

  function submissionHandler() {
    console.log('[PolicyCreationFrame] ========== submissionHandler START ==========');
    console.log('[PolicyCreationFrame] Updating policy with label:', localLabel);
    // Update the policy at the current position with the label
    dispatch(
      updatePolicyAtPosition({
        position: currentPosition,
        updates: { label: localLabel },
      })
    );
    console.log('[PolicyCreationFrame] Calling onNavigate("next")');
    onNavigate('next');
    console.log('[PolicyCreationFrame] ========== submissionHandler END ==========');
  }

  const formInputs = (
    <TextInput
      label="Policy title"
      placeholder="Policy name"
      value={localLabel}
      onChange={(e) => handleLocalLabelChange(e.currentTarget.value)}
    />
  );

  const primaryAction = {
    label: 'Create a policy',
    onClick: submissionHandler,
  };

  return <FlowView title="Create a policy" content={formInputs} primaryAction={primaryAction} />;
}
