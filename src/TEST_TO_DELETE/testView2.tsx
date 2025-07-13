import { Button } from "@mantine/core";

import { FlowComponentProps } from '@/flows/types';

export default function TestView2({ onNavigate, onReturn, flowConfig }: FlowComponentProps) {

  function handleNext() {
    console.log("Navigating to next view");
    onNavigate('next');
  }

  return (
    <div>
      <h1>Test View 2</h1>
      <p>This is a test view from the test flow.</p>
      <Button variant="default" onClick={handleNext}>
        Next
      </Button>
    </div>
  );
}