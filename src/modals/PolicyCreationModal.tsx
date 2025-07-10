import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { TextInput } from '@mantine/core';
import IngredientCreationStartView from '../components/IngredientCreationStartView';
import { updateLabel } from '../reducers/policyReducer';

export default function PolicyCreationModal() {
  const dispatch = useDispatch();

  // Manage instantaneous changes to the label input
  // locally, then emit the final to the reducer to avoid
  // visual lag in reducer updates
  const [localLabel, setLocalLabel] = useState('');

  function handleLocalLabelChange(value: string) {
    console.log('Updating local label:', value);
    setLocalLabel(value);
  }

  const formInputs = (
    <TextInput
      label="Reform title"
      placeholder="Policy name"
      value={localLabel}
      onChange={(e) => handleLocalLabelChange(e.currentTarget.value)}
    />
  );

  function submissionHandler() {
    dispatch(updateLabel(localLabel));
  }

  return (
    <IngredientCreationStartView
      title="Create policy"
      formInputs={formInputs}
      submissionHandler={submissionHandler}
    />
  );
}
