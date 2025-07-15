import { Button } from '@mantine/core';
import { FlowComponentProps } from '@/types/flow';

export default function PolicyTestView({ onNavigate }: FlowComponentProps) {
  function handleNext() {
    console.log('Navigating to next view');
    onNavigate('next');
  }

  return (
    <div>
      <h1>Policy Test View</h1>
      <p>This is a test view from the policy flow.</p>
      <Button variant="default" onClick={handleNext}>
        Next
      </Button>
    </div>
  );
}
