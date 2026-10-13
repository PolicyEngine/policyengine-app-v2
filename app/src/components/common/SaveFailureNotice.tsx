import { dismissSaveFailure, useSaveFailure } from '@/libs/saveFailureNotice';
import { FloatingAlert } from './FloatingAlert';

/**
 * Tells the user when something they created could not be added to their
 * account (see useAccountSaveFailure). Mounted once per app shell, so it
 * stays up after the dialog that started the save has closed.
 */
export default function SaveFailureNotice() {
  const failure = useSaveFailure();
  if (!failure) {
    return null;
  }
  return (
    <FloatingAlert key={failure.id} type="error" onClose={dismissSaveFailure}>
      {failure.message}
    </FloatingAlert>
  );
}
