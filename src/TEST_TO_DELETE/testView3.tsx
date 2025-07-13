import { Button } from '@mantine/core';
import { FlowComponentProps } from '@/flows/types';

export default function TestView3({ onNavigate, onReturn, flowConfig }: FlowComponentProps) {
  function handleNext() {
    console.log('Navigating to next view');
    onNavigate('next');
  }

  return (
    <div>
      <h1>Test View 3</h1>
      <p>This is another test view from the test flow.</p>
      <Button variant="default" onClick={handleNext}>
        Next
      </Button>
    </div>
  );
}
