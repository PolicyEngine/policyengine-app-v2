import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { selectCurrentPosition } from '@/reducers/activeSelectors';
import { createPolicyAtPosition, updatePolicyAtPosition } from '@/reducers/policyReducer';
import { setMode } from '@/reducers/reportReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';

export default function PolicyCreationFrame({ onNavigate, isInSubflow }: FlowComponentProps) {
  const dispatch = useDispatch();
  const [localLabel, setLocalLabel] = useState('');

  // Read position from report reducer via cross-cutting selector
  const currentPosition = useSelector((state: RootState) => selectCurrentPosition(state));

  // Set mode to standalone if accessed directly (not in subflow)
  useEffect(() => {
    if (!isInSubflow) {
      dispatch(setMode('standalone'));
    }
  }, [dispatch, isInSubflow]);

  // Create policy at current position when component mounts
  useEffect(() => {
    dispatch(createPolicyAtPosition({ position: currentPosition }));
  }, [dispatch, currentPosition]);

  function handleLocalLabelChange(value: string) {
    setLocalLabel(value);
  }

  function submissionHandler() {
    // Update the policy at the current position with the label
    dispatch(
      updatePolicyAtPosition({
        position: currentPosition,
        updates: { label: localLabel },
      })
    );
    onNavigate('next');
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

  const cancelAction = {
    ingredientType: 'policy' as const,
  };

  return (
    <FlowView
      title="Create a policy"
      content={formInputs}
      primaryAction={primaryAction}
      cancelAction={cancelAction}
    />
  );
}
