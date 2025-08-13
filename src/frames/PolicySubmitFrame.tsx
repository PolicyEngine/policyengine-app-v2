import { useDispatch, useSelector } from 'react-redux';
import { Stack, Text } from '@mantine/core';
import { useCreatePolicy } from '@/hooks/useCreatePolicy';
import { useIngredientReset } from '@/hooks/useIngredientReset';
import { markPolicyAsCreated, updatePolicyId } from '@/reducers/policyReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Policy } from '@/types/policy';
import { PolicyCreationPayload, serializePolicyCreationPayload } from '@/types/policyPayloads';
import FlowView, { ButtonConfig } from '@/components/common/FlowView';

export default function PolicySubmitFrame({
  onReturn,
  isInSubflow,
}: FlowComponentProps) {
  const label = useSelector((state: RootState) => state.policy.label);
  const params = useSelector((state: RootState) => state.policy.params);
  const dispatch = useDispatch();
  const { resetIngredient } = useIngredientReset();
  const { createPolicy, isPending } = useCreatePolicy();

  const policy: Policy = useSelector((state: RootState) => state.policy);

  function handleSubmit() {
    const serializedPolicyCreationPayload: PolicyCreationPayload =
      serializePolicyCreationPayload(policy);
    console.log('serializedPolicyCreationPayload', serializedPolicyCreationPayload);
    createPolicy(serializedPolicyCreationPayload, {
      onSuccess: (data) => {
        console.log('Policy created successfully:', data);
        dispatch(updatePolicyId(data.result.policy_id));
        dispatch(markPolicyAsCreated());
        // If we've created this policy as part of a standalone policy creation flow,
        // we're done; clear the policy reducer
        if (!isInSubflow) {
          resetIngredient('policy');
        }
        onReturn();
      },
    });
  }

  const content = (
    <Stack>
      <Text>Label: {label}</Text>
      <Text>Params: {Object.keys(params).length} added</Text>
    </Stack>
  );

  const buttons: ButtonConfig[] = [
    {
      label: 'Cancel',
      variant: 'default',
      onClick: () => console.log('Cancel clicked'), // Placeholder for cancel action
    },
    {
      label: 'Submit',
      variant: 'filled',
      onClick: handleSubmit,
      isLoading: isPending,
    },
  ];

  return (
    <FlowView
      title="Review policy"
      content={content}
      buttons={buttons}
    />
  );
}
