import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { TextInput } from '@mantine/core';
import { FlowComponentProps } from '@/types/flow';
import IngredientCreationStartView from '../components/IngredientCreationStartView';
import { updateLabel } from '../reducers/policyReducer';

export default function PolicyCreationFrame({ onNavigate }: FlowComponentProps) {
  const dispatch = useDispatch();

  // Manage instantaneous changes to the label input
  // locally, then emit the final to the reducer to avoid
  // visual lag in reducer updates
  const [localLabel, setLocalLabel] = useState('');

  function handleLocalLabelChange(value: string) {
    setLocalLabel(value);
  }

  const formInputs = (
    <TextInput
      label="Policy title"
      placeholder="Policy name"
      value={localLabel}
      onChange={(e) => handleLocalLabelChange(e.currentTarget.value)}
    />
  );

  function submissionHandler() {
    dispatch(updateLabel(localLabel));
    onNavigate('next');
  }

  return (
    <IngredientCreationStartView
      title="Create a policy"
      formInputs={formInputs}
      submissionHandler={submissionHandler}
    />
  );
}
