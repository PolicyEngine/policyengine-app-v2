import IngredientCreationModal from "../components/IngredientCreationModal";
import { useDispatch } from 'react-redux'
import { updateLabel } from '../reducers/policyReducer';
import { TextInput } from "@mantine/core";
import { useState } from "react";

export default function PolicyCreationModal() {
  const dispatch = useDispatch();

  const [localPolicyLabel, setLocalPolicyLabel] = useState("");

  const formInputs = (
    <TextInput
      label="Reform title"
      placeholder="Policy name"
      value={localPolicyLabel}
      onChange={(e) => setLocalPolicyLabel(e.currentTarget.value)}
    />
  )

  function submissionHandler() {
    dispatch(updateLabel(localPolicyLabel));
  }

  return (
    <IngredientCreationModal
      title="Create policy"
      formInputs={formInputs}
      submissionHandler={submissionHandler}
    />
  );
}