/**
 * What the reader is told while the account is unavailable and reforms
 * wait on this device for it (see api/resilientReformStore).
 */

/** A save that went to this device instead of the account. */
export const SAVED_ON_DEVICE_NOTE =
  "Saved on this device. Your account is unavailable right now; we'll add this reform to it when it's back.";

/** A reform in the library that waits on this device. */
export const SAVED_ON_DEVICE_BADGE = 'Saved on this device';

/** The library, read while the account is unavailable. */
export const LIBRARY_INCOMPLETE_NOTE =
  "Your account is unavailable right now, so this list may be incomplete. It shows the reforms saved on this device; we'll add them to your account when it's back.";

/** A run whose report could not be added to the unavailable account. */
export const RUN_ACCOUNT_UNAVAILABLE_ERROR =
  'Could not start the report: your account is unavailable right now, so the report cannot be saved to it. Try again later.';

/** The query flag the library reads after a save that went to this device. */
export const SAVED_ON_DEVICE_PARAM = 'saved';
export const SAVED_ON_DEVICE_VALUE = 'device';
