import { useSelector } from 'react-redux';
import { Button, Container, Grid, Stack, Text } from '@mantine/core';
import { useCreatePolicy } from '@/hooks/useCreatePolicy';
import { RootState } from '@/store';
import { Policy } from '@/types/policy';
import { PolicyCreationPayload, serializePolicyCreationPayload } from '@/types/policyPayloads';

interface PolicySubmitFrameProps {
  onNavigate: (action: string) => void;
  onCancel?: () => void;
}

export default function PolicySubmitFrame({ onNavigate, onCancel }: PolicySubmitFrameProps) {
  //   const dispatch = useDispatch();
  const label = useSelector((state: RootState) => state.policy.label);
  const params = useSelector((state: RootState) => state.policy.params);
  const { createPolicy, isPending } = useCreatePolicy();

  const policy: Policy = useSelector((state: RootState) => state.policy);

  function handleSubmit() {
    const serializedPolicyCreationPayload: PolicyCreationPayload =
      serializePolicyCreationPayload(policy);
    createPolicy(serializedPolicyCreationPayload);
  }

  return (
    <Container size="sm" py="xl">
      <Stack>
        <Text fw={700}>Review Policy</Text>
        <Text>Label: {label}</Text>
        <Text>Params: {Object.keys(params).length} added</Text>

        <Grid>
          <Grid.Col span={6}>
            <Button
              variant="default"
              fullWidth
              onClick={onCancel || (() => onNavigate('__return__'))}
            >
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
