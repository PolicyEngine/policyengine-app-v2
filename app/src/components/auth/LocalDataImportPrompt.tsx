import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
  Stack,
  Text,
} from '@/components/ui';
import { colors } from '@/designTokens';
import { useLocalDataImport } from '@/hooks/useLocalDataImport';
import { importSummaryLines } from './importSummaryText';

/**
 * Offered once per account after signing in (US/UK), when this browser
 * holds saved work the account does not have yet. Saving copies it to
 * the account; nothing is deleted from the device. Closing the prompt,
 * with "Not now" or after an import, is remembered; the account page can
 * still save what is left.
 */
export default function LocalDataImportPrompt() {
  const localImport = useLocalDataImport();
  const [open, setOpen] = useState(false);

  const shouldOffer =
    localImport.available && localImport.pendingCount > 0 && !localImport.declined;

  useEffect(() => {
    if (shouldOffer) {
      setOpen(true);
    }
  }, [shouldOffer]);

  if (!localImport.available) {
    return null;
  }

  const running = localImport.state === 'running';
  const finished = localImport.state === 'done' && localImport.summary;

  // Closing — "Not now", or after an import ran, whatever its outcome —
  // stops the prompt for this account; the account page offers the rest.
  const close = () => {
    if (running) {
      return;
    }
    localImport.decline();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent showCloseButton={!running}>
        <DialogHeader>
          <DialogTitle>
            {finished
              ? 'Your work is saved to your account'
              : 'Save the work on this device to your account?'}
          </DialogTitle>
          <DialogDescription>
            {finished
              ? 'It now appears wherever you sign in.'
              : `This browser has ${localImport.pendingCount} saved item${
                  localImport.pendingCount === 1 ? '' : 's'
                } — policies, households, simulations, reports and reforms. Saving copies them to your account so they are available on any device. Nothing is removed from this device.`}
          </DialogDescription>
        </DialogHeader>

        {finished && localImport.summary && (
          <Stack gap="xs">
            {importSummaryLines(localImport.summary).map((line) => (
              <Text key={line} size="sm" style={{ margin: 0 }}>
                {line}
              </Text>
            ))}
          </Stack>
        )}

        {localImport.state === 'error' && (
          <Text size="sm" style={{ margin: 0, color: colors.error }}>
            {localImport.error ?? 'The import did not complete.'} Try again, or choose not now.
          </Text>
        )}

        <DialogFooter>
          {finished ? (
            <Button onClick={close}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={close} disabled={running}>
                Not now
              </Button>
              <Button onClick={() => localImport.run()} disabled={running}>
                {running && <Spinner size="sm" />}
                Save to my account
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
