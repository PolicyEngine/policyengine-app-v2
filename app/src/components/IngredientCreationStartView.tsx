import { Container, Stack, Title } from '@/components/ui';
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
      variant: 'disabled' as const,
      onClick: () => {},
    },
    {
      label: submitButtonText || title,
      variant: 'filled' as const,
      onClick: () => submissionHandler(),
    },
  ];

  return (
    <>
      <Container variant="guttered">
        <Title order={2} variant="colored">
          {title}
        </Title>
        <hr className="tw:my-2 tw:border-border-light" />
        {/*TODO: subtitle?*/}
        {/*break*/}
        {/*form labels and inputs*/}
        <Stack gap="md" className="tw:pb-4">
          {formInputs}
        </Stack>
        {/*button panel: Cancel and Create X*/}
        <MultiButtonFooter buttons={buttonConfig} />
      </Container>
    </>
  );
}
