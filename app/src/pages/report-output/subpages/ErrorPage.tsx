import { IconAlertCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Stack } from '@mantine/core';
import { spacing } from '@/designTokens';

interface ErrorPageProps {
  error?: any;
}

/**
 * Error page component displayed when report calculation fails
 */
export default function ErrorPage({ error }: ErrorPageProps) {
  const navigate = useNavigate();

  return (
    <Stack gap={spacing.md}>
      <Alert
        icon={<IconAlertCircle size={20} />}
        title="Calculation Failed"
        color="red"
        variant="light"
      >
        {typeof error === 'string'
          ? error
          : error?.message || 'An unexpected error occurred during calculation.'}
      </Alert>

      <Button variant="default" onClick={() => navigate(-1)} fullWidth>
        Go Back
      </Button>
    </Stack>
  );
}
