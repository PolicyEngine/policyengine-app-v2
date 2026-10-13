import { useCallback } from 'react';
import { useAssociationBackendResolver } from '@/libs/auth/useAssociationBackend';
import { reportSaveFailure } from '@/libs/saveFailureNotice';

/**
 * Reports that a created item could not be added to saved work, when the
 * save went to the account (signed in, or signed in with the account
 * unavailable). Signed-out saves to this browser keep their previous,
 * console-only failure handling.
 */
export function useAccountSaveFailure(): (what: string, error: unknown) => Promise<void> {
  const resolveBackend = useAssociationBackendResolver();
  return useCallback(
    async (what: string, error: unknown) => {
      try {
        const backend = await resolveBackend();
        if (backend.mode !== 'localStorage') {
          reportSaveFailure(what, error);
        }
      } catch {
        // The session went away; nothing is left on screen to tell.
      }
    },
    [resolveBackend]
  );
}
