import { IconAlertCircle } from '@tabler/icons-react';
import { Alert, AlertDescription, AlertTitle, Button, Stack } from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';

interface ErrorPageProps {
  error?: any;
}

/**
 * Error page component displayed when report calculation fails
 */
export default function ErrorPage({ error }: ErrorPageProps) {
  const nav = useAppNavigate();

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

      <Button variant="outline" onClick={() => nav.back()} className="tw:w-full">
        Go back
      </Button>
    </Stack>
  );
}
