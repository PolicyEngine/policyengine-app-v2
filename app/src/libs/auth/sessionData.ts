import { clearDraftReform } from '@/libs/draftReform';
import { forgetAccountReportMeta } from '@/libs/flagship/runReport';

/**
 * What a signed-in session leaves in this browser beyond its account, and
 * how signing out clears it, so the next person on a shared browser
 * neither sees nor inherits it:
 *
 * - The report provenance stash from signed-in runs (kept in memory only).
 * - The draft reform, which may hold an account reform loaded for editing.
 *
 * Signed in, v3 writes nothing else to this browser: reforms and reports
 * go to the account, and the browser's signed-out copies are untouched.
 */
export function clearSignedInSessionData(): void {
  forgetAccountReportMeta();
  clearDraftReform();
}
