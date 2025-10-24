import { Button, Group } from '@mantine/core';
import { useCancelFlow } from '@/hooks/useCancelFlow';
import { FlowComponentProps } from '@/types/flow';

export default function PolicyParameterSelectorFooter({ onNavigate }: FlowComponentProps) {
  const { handleCancel } = useCancelFlow('policy');

  function handleNext() {
    // Dispatch an action to move to the next step
    onNavigate('next');
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
