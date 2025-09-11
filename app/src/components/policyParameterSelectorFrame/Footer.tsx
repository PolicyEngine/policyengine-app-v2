import { useDispatch } from 'react-redux';
import { Button, Group } from '@mantine/core';
import { clearPolicy } from '@/reducers/policyReducer';
import { FlowComponentProps } from '@/types/flow';

export default function PolicyParameterSelectorFooter({
  onNavigate,
  onReturn,
}: FlowComponentProps) {
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
      <Button variant="default" onClick={handleCancel}>
        Cancel
      </Button>
      <Button variant="filled" onClick={handleNext}>
        Next
      </Button>
    </Group>
  );
}