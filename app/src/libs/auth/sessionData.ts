import {
  clearAllDraftReforms,
  dropHeldDraftReforms,
  holdAllDraftReforms,
  restoreHeldDraftReforms,
} from '@/libs/draftReform';
import { forgetAccountReportMeta } from '@/libs/flagship/runReport';

/**
 * What a signed-in session leaves in this browser beyond its account, and
 * when it is cleared, so the next person on a shared browser neither sees
 * nor inherits it:
 *
 * - The report provenance stash from signed-in runs (kept in memory only).
 * - The draft reform, which may hold an account reform loaded for editing,
 *   and any draft set aside for another country. A fingerprint of the
 *   account that last had them signed in marks whose drafts they are.
 *
 * Signed in, v3 writes nothing else to this browser: reforms and reports
 * go to the account.
 */

/** Marks the draft as belonging to a signed-in account (a fingerprint, never the subject). */
const DRAFT_OWNER_KEY = 'pe-draft-reform-owner';

/** A short FNV-1a fingerprint of an Auth0 subject: enough to tell accounts apart. */
function subjectFingerprint(subject: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < subject.length; index++) {
    hash ^= subject.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

function readDraftOwner(): string | null {
  try {
    return localStorage.getItem(DRAFT_OWNER_KEY);
  } catch {
    return null;
  }
}

function writeDraftOwner(owner: string | null): void {
  try {
    if (owner) {
      localStorage.setItem(DRAFT_OWNER_KEY, owner);
    } else {
      localStorage.removeItem(DRAFT_OWNER_KEY);
    }
  } catch {
    // Storage unavailable: nothing was kept either.
  }
}

/** Signing out: everything the session left goes, held drafts too. */
export function clearSignedInSessionData(): void {
  forgetAccountReportMeta();
  clearAllDraftReforms();
  dropHeldDraftReforms();
  writeDraftOwner(null);
}

/**
 * A session that ended in this page (its token could not be renewed):
 * the same person is still here, so their draft stays for them to save
 * or to keep once they sign in again. It is dropped when the page next
 * loads signed out, or when another account signs in.
 */
export function endSignedInSession(): void {
  forgetAccountReportMeta();
}

/**
 * Settles whose draft this browser holds once the session is known:
 * after it is restored on load, and whenever someone signs in.
 *
 * - Signed in: a draft left by another account is dropped; drafts held for
 *   this account come back; the draft, if any, is now this account's (a
 *   signed-out draft comes along with it).
 * - Signed out on load: drafts left by a signed-in session are held out of
 *   sight for that account, not deleted. Its session may have expired
 *   between visits, or only failed to restore (a timeout, a lost
 *   connection), in which case the next load signs it back in.
 */
export function settleDraftOwner(subject: string | null): void {
  const owner = readDraftOwner();
  if (!subject) {
    if (owner) {
      holdAllDraftReforms(owner);
      writeDraftOwner(null);
    } else {
      dropHeldDraftReforms({ expiredOnly: true });
    }
    return;
  }
  const fingerprint = subjectFingerprint(subject);
  if (owner && owner !== fingerprint) {
    clearAllDraftReforms();
  }
  restoreHeldDraftReforms(fingerprint);
  writeDraftOwner(fingerprint);
}
