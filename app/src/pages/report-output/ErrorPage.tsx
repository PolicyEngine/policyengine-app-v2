import { IconAlertCircle } from '@tabler/icons-react';
import { Alert, AlertDescription, AlertTitle, Button, Stack } from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';

interface ErrorPageProps {
  error?: any;
  recovery?: {
    label: string;
    description: string;
    onClick: () => void;
  };
}

/**
 * Error page component displayed when report calculation fails
 */
export default function ErrorPage({ error, recovery }: ErrorPageProps) {
  const nav = useAppNavigate();

  return (
    <Stack className="tw:gap-md">
      <Alert variant="destructive">
        <IconAlertCircle size={20} />
        <AlertTitle>Calculation failed</AlertTitle>
        <AlertDescription className="tw:whitespace-pre-wrap">
          {typeof error === 'string'
            ? error
            : error?.message || 'An unexpected error occurred during calculation.'}
        </AlertDescription>
      </Alert>

      {recovery && (
        <>
          <p className="tw:text-sm">{recovery.description}</p>
          <Button onClick={recovery.onClick} className="tw:w-full">
            {recovery.label}
          </Button>
        </>
      )}

      <Button variant="outline" onClick={() => nav.back()} className="tw:w-full">
        Go back
      </Button>
    </Stack>
  );
}
