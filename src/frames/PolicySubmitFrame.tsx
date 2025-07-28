import { useSelector } from 'react-redux';
import { Button, Container, Grid, Stack, Text } from '@mantine/core';
import { useCreatePolicy } from '@/hooks/useCreatePolicy';
import { PolicyState } from '@/reducers/policyReducer';
import { RootState } from '@/store';

interface PolicySubmitFrameProps {
  onNavigate: (action: string) => void;
  onCancel?: () => void;
}

interface PolicyCreationPayload {
  label?: string;
  data: Record<string, any>;
}

export function serializePolicyCreationPayload(policy: PolicyState): PolicyCreationPayload {
  const { label, params } = policy;

  // Fill payload with keys we already know
  const payload = {
    label,
    data: {} as Record<string, any>,
  };

  // Convert params and their valueIntervals into expected JSON format
  params.forEach((param) => {
    payload.data[param.name] = param.values.reduce((acc, cur) => {
      return { ...acc, [`${cur.startDate}..${cur.endDate}`]: cur.value };
    }, {});
  });

  return payload;
}

export default function PolicySubmitFrame({ onNavigate, onCancel }: PolicySubmitFrameProps) {
  //   const dispatch = useDispatch();
  const label = useSelector((state: RootState) => state.policy.label);
  const params = useSelector((state: RootState) => state.policy.params);
  const { mutate: createPolicy, isPending } = useCreatePolicy();

  const policy: PolicyState = useSelector((state: RootState) => state.policy);

  function handleSubmit() {
    const serializedPolicyCreationPayload: Record<string, any> =
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
