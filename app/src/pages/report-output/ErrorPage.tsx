import { IconAlertCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle, Button, Stack } from '@/components/ui';

interface ErrorPageProps {
  error?: any;
}

/**
 * Error page component displayed when report calculation fails
 */
export default function ErrorPage({ error }: ErrorPageProps) {
  const navigate = useNavigate();

  return (
    <Stack className="tw:gap-md">
      <Alert variant="destructive">
        <IconAlertCircle size={20} />
        <AlertTitle>Calculation failed</AlertTitle>
        <AlertDescription>
          {typeof error === 'string'
            ? error
            : error?.message || 'An unexpected error occurred during calculation.'}
        </AlertDescription>
      </Alert>

      <Button variant="outline" onClick={() => navigate(-1)} className="tw:w-full">
        Go back
      </Button>
    </Stack>
  );
}
