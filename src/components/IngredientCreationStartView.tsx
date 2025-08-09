import { Container, Space } from '@mantine/core';
import MultiButtonFooter, { ButtonConfig } from './common/MultiButtonFooter';

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
  const buttonConfig: ButtonConfig[] = [
    {
      label: 'Cancel',
      variant: 'default' as const,
      onClick: () => console.log('Cancel clicked'), // Placeholder for cancel action
    },
    {
      label: submitButtonText || title,
      variant: 'filled' as const,
      onClick: () => submissionHandler(),
    },
  ];

  return (
    <>
      {/*<Modal opened={opened} onClose={close} title={title} centered>*/}
      <Container variant="guttered">
        {/*icon*/}
        {/*subtitle*/}
        {/*break*/}
        {/*form labels and inputs*/}
        {formInputs}
        {/*button panel: Cancel and Create X*/}
        <Space h="xs" />
        <MultiButtonFooter buttons={buttonConfig} />
      </Container>
      {/*</Modal>*/}
    </>
  );
}
