import { useSelector, useDispatch } from 'react-redux';
import { Button, Container, Grid, Text, Stack } from '@mantine/core';
import { RootState } from '@/store';
import { useCreatePolicy } from '@/hooks/useCreatePolicy';
import { clearFlow } from '@/reducers/flowReducer';

interface PolicySubmitFrameProps {
  onNavigate: (action: string) => void;
  onCancel?: () => void;
}

export default function PolicySubmitFrame({ onNavigate, onCancel }: PolicySubmitFrameProps) {
  const dispatch = useDispatch();
  const label = useSelector((state: RootState) => state.policy.label);
  const params = useSelector((state: RootState) => state.policy.policyParams);

  const { mutate: createPolicy, isPending } = useCreatePolicy();

  function handleSubmit() {
    createPolicy({ label, params }, {
      onSuccess: () => {
        dispatch(clearFlow());
        onNavigate('next');
      },
    });
  }

  return (
    <Container size="sm" py="xl">
      <Stack>
        <Text fw={700}>Review Policy</Text>
        <Text>Label: {label}</Text>
        <Text>Params: {params.length} added</Text>

        <Grid>
          <Grid.Col span={6}>
            <Button variant="default" fullWidth onClick={onCancel || (() => onNavigate('__return__'))}>
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
