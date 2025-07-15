import { Button } from '@mantine/core';
import { FlowComponentProps } from '@/types/flow';

export default function TestCompleteView({ onNavigate }: FlowComponentProps) {
  function handleNext() {
    console.log('Navigating to next view');
    onNavigate('next');
  }

  return (
    <div>
      <h1>Complete Flow View</h1>
      <p>
        This is a test component from the "complete" flow, which integrates the policy flow inside a
        dead-end loop that returns back to this component after completion.
      </p>
      <Button variant="default" onClick={handleNext}>
        Next
      </Button>
    </div>
  );
}
