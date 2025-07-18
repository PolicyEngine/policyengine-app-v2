import { useDispatch } from 'react-redux';
import { Button, Group, Text } from '@mantine/core';
import { clearPolicy } from '@/reducers/policyReducer';
import { FlowComponentProps } from '@/types/flow';

export default function PolicyParameterSelectorHeader({
  onNavigate,
  onReturn,
}: FlowComponentProps) {
  // TODO: Determine how to handle policy number

  const dispatch = useDispatch();

  function handleNext() {
    // Dispatch an action to move to the next step
    onNavigate('next');
  }

  function handleCancel() {
    // Clear policy state and return to the previous step
    dispatch(clearPolicy());
    onReturn();
  }

  return (
    <Group justify="space-between" align="center">
      <Button variant="outline" onClick={handleCancel}>
        Cancel
      </Button>
      <Text fw={700}>Policy #NUMBER</Text>
      <Button variant="default" onClick={handleNext}>
        Next
      </Button>
    </Group>
  );
}
