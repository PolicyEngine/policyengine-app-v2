import { useDispatch, useSelector } from 'react-redux';
import { Button, Container, Grid, Stack, Text } from '@mantine/core';
import { useCreatePolicy } from '@/hooks/useCreatePolicy';
import { clearPolicy, markPolicyAsCreated, updatePolicyId } from '@/reducers/policyReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Policy } from '@/types/policy';
import { PolicyCreationPayload, serializePolicyCreationPayload } from '@/types/policyPayloads';

export default function PolicyParameterSelectorFrame({
  onReturn,
  isInSubflow,
}: FlowComponentProps) {
  const dispatch = useDispatch();
  const label = useSelector((state: RootState) => state.policy.label);
  const params = useSelector((state: RootState) => state.policy.params);
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
          dispatch(clearPolicy());
        }
        onReturn();
      },
    });
  }

  return (
    <Container size="sm" py="xl">
      <Stack>
        <Text fw={700}>Review Policy</Text>
        <Text>Label: {label}</Text>
        <Text>Params: {Object.keys(params).length} added</Text>

        <Grid>
          <Grid.Col span={6}>
            <Button variant="default" fullWidth onClick={onReturn}>
              Cancel
            </Button>
          </Grid.Col>
          <Grid.Col span={6}>
            <Button variant="filled" fullWidth loading={isPending} onClick={handleSubmit}>
              Submit
            </Button>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
