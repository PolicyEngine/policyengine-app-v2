import IngredientCreationModal from "../components/IngredientCreationModal";
import { useDispatch } from 'react-redux'
import { updateLabel } from '../reducers/policyReducer';
import { TextInput } from "@mantine/core";
import { useState } from "react";

export default function PolicyCreationModal() {
  const dispatch = useDispatch();

  // Manage instantaneous changes to the label input
  // locally, then emit the final to the reducer to avoid
  // visual lag in reducer updates
  const [localLabel, setLocalLabel] = useState("");

  function handleLocalLabelChange(value: string) {
    console.log("Updating local label:", value);
    setLocalLabel(value);
  }

  const formInputs = (
    <TextInput
      label="Reform title"
      placeholder="Policy name"
      value={localLabel}
      onChange={(e) => handleLocalLabelChange(e.currentTarget.value)}
    />
  )

  function submissionHandler() {
    dispatch(updateLabel(localLabel));
  }

  return (
    <IngredientCreationModal
      title="Create policy"
      formInputs={formInputs}
      submissionHandler={submissionHandler}
    />
  );
}