import { Button, Container, Grid } from '@mantine/core';

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
        <Grid>
          <Grid.Col span={6}>
            <Button variant="default" onClick={close} fullWidth>
              Cancel
            </Button>
          </Grid.Col>
          <Grid.Col span={6}>
            <Button variant="filled" fullWidth onClick={() => submissionHandler()}>
              {submitButtonText || title}
            </Button>
          </Grid.Col>
        </Grid>
      </Container>
      {/*</Modal>*/}
    </>
  );
}
