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
    <Container>
      <Title order={2}>{title}</Title>
      <hr className="tw:my-2 tw:border-border-light" />
      <Stack gap="md" className="tw:pb-4">
        {formInputs}
      </Stack>
      <MultiButtonFooter buttons={buttonConfig} />
    </Container>
  );
}
