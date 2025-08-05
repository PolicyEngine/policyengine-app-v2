import { Button, Container, Grid, Space } from '@mantine/core';
import TwoButtonFooter from './common/TwoButtonFooter';

interface IngredientCreationStartViewProps {
  title: string;
  submitButtonText?: string; // Defaults to title
  formInputs?: React.ReactNode;
  submissionHandler: CallableFunction; // Function to handle form submission
}

export default function IngredientCreationStartView({
  title,
  formInputs,
  submitButtonText,
  submissionHandler,
}: IngredientCreationStartViewProps) {
  return (
    <>
      {/*<Modal opened={opened} onClose={close} title={title} centered>*/}
      <Container>
        {/*icon*/}
        {/*subtitle*/}
        {/*break*/}
        {/*form labels and inputs*/}
        {formInputs}
        {/*button panel: Cancel and Create X*/}
        <Space h="xs" />
        <TwoButtonFooter
          onPrimaryClick={() => submissionHandler()}
          onSecondaryClick={() => console.log('Cancel clicked')}
          primaryLabel={submitButtonText || title}
          secondaryLabel="Cancel"
        />
      </Container>
      {/*</Modal>*/}
    </>
  );
}
