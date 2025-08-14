import { Container, Divider, Stack, Title } from '@mantine/core';
import MultiButtonFooter, { ButtonConfig } from './common/MultiButtonFooter';

interface IngredientSubmissionViewProps {
  title: string;
  submitButtonText?: string; // Defaults to title
  content?: React.ReactNode;
  submissionHandler: CallableFunction; // Function to handle form submission
  submitButtonLoading?: boolean;
}

export default function IngredientSubmissionView({
  title,
  content,
  submitButtonText,
  submissionHandler,
  submitButtonLoading,
}: IngredientSubmissionViewProps) {
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
      isLoading: submitButtonLoading,
    },
  ];

  return (
    <>
      <Container variant="guttered">
        <Title order={2} variant="colored">{title}</Title>
        <Divider my="sm" />
        {/*TODO: subtitle?*/}
        {/*break*/}
        {/*form labels and inputs*/}
        <Stack gap="md" pb="lg">
          {content}
        </Stack>
        {/*button panel: Cancel and Create X*/}
        <MultiButtonFooter buttons={buttonConfig} />
      </Container>
      {/*</Modal>*/}
    </>
  );
}
