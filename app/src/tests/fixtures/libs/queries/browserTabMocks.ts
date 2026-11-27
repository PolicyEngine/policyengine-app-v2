import { focusManager } from '@tanstack/react-query';

/**
 * The browser tab hidden, as after the user switches to another tab:
 * React Query then treats the page as unfocused. Undo with
 * `restoreBrowserTabTracking()` after the test.
 */
export function hideBrowserTab() {
  focusManager.setFocused(false);
}

/** Hands focus tracking back to the browser's own events. */
export function restoreBrowserTabTracking() {
  focusManager.setFocused(undefined);
}
