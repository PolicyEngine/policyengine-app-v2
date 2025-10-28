import { useDispatch, useSelector } from 'react-redux';
import { Button, Group } from '@mantine/core';
import { selectCurrentPosition } from '@/reducers/activeSelectors';
import { clearPolicyAtPosition } from '@/reducers/policyReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';

export default function PolicyParameterSelectorFooter({
  onNavigate,
  onReturn,
}: FlowComponentProps) {
  const dispatch = useDispatch();

  // Get the current position from the cross-cutting selector
  const currentPosition = useSelector((state: RootState) => selectCurrentPosition(state));

  function handleNext() {
    // Dispatch an action to move to the next step
    onNavigate('next');
  }

  function handleCancel() {
    // Clear policy at current position and return to the previous step
    dispatch(clearPolicyAtPosition(currentPosition));
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
