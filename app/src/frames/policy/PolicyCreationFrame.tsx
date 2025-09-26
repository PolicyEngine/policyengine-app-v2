import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import PolicyCreationModal from '@/components/policy/PolicyCreationModal';
import { selectCurrentPosition } from '@/reducers/activeSelectors';
import { createPolicyAtPosition, updatePolicyAtPosition } from '@/reducers/policyReducer';
import { setMode } from '@/reducers/reportReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';

interface PolicyCreationFrameProps extends FlowComponentProps {
  useModal?: boolean;
}

export default function PolicyCreationFrame({
  onNavigate,
  isInSubflow,
  useModal = false,
}: PolicyCreationFrameProps) {
  const dispatch = useDispatch();
  const [localLabel, setLocalLabel] = useState('');
  const [modalOpened, setModalOpened] = useState(useModal);

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

  function submissionHandler(label?: string) {
    const policyLabel = label || localLabel;
    // Update the policy at the current position with the label
    dispatch(
      updatePolicyAtPosition({
        position: currentPosition,
        updates: { label: policyLabel },
      })
    );
    setModalOpened(false);
    onNavigate('next');
  }

  function handleModalClose() {
    setModalOpened(false);
    // Optionally navigate back or handle cancellation
    onNavigate('back');
  }

  // If using modal, render modal instead
  if (useModal) {
    return (
      <PolicyCreationModal
        opened={modalOpened}
        onClose={handleModalClose}
        onSubmit={submissionHandler}
      />
    );
  }

  // Original flow view implementation
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
    onClick: () => submissionHandler(),
  };

  return <FlowView title="Create a policy" content={formInputs} primaryAction={primaryAction} />;
}
