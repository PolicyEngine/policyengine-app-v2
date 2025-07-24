import { useSelector } from 'react-redux';
import { Button, Container, Grid, Stack, Text } from '@mantine/core';
import { FOREVER } from '@/constants';
import { useCreatePolicy } from '@/hooks/useCreatePolicy';
import { RootState } from '@/store';

interface PolicySubmitFrameProps {
  onNavigate: (action: string) => void;
  onCancel?: () => void;
}

export default function PolicySubmitFrame({ onNavigate, onCancel }: PolicySubmitFrameProps) {
  //   const dispatch = useDispatch();
  const label = useSelector((state: RootState) => state.policy.label);
  const params = useSelector((state: RootState) => state.policy.policyParams);
  const { mutate: createPolicy, isPending } = useCreatePolicy();

  const wrappedParams = Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      // If value is already in correct shape (has a dotted key), pass it through
      const isWrapped =
        typeof value === 'object' && value !== null && Object.keys(value)[0]?.includes('.');

      if (isWrapped) {
        return [key, value];
      }

      // If value is like { startDate, endDate, value }, unwrap it
      if (
        typeof value === 'object' &&
        'startDate' in value &&
        'endDate' in value &&
        'value' in value
      ) {
        const dateKey = `${value.startDate}..${value.endDate}`;
        return [key, { [dateKey]: value.value }];
      }

      // Otherwise fallback to default FOREVER case
      return [key, { [`2025-01-01..${FOREVER}`]: value }];
    })
  );

  function handleSubmit() {
    createPolicy({ data: wrappedParams });
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
