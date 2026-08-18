/**
 * Feature flags for in-progress product work.
 *
 * The flagship shell (Ask / Tracker / Build / Library navigation) ships
 * dark: off unless enabled by environment variable at build time or by a
 * localStorage override at runtime, so production behavior is unchanged
 * until the shell is ready.
 *
 * Enable locally either way:
 * - env: VITE_FLAGSHIP_SHELL=true
 * - console: localStorage.setItem('pe-flagship-shell', 'on') and reload
 */

const FLAGSHIP_SHELL_STORAGE_KEY = 'pe-flagship-shell';

/**
 * Environment-only check. Stable between server and client renders in
 * Next.js (NEXT_PUBLIC_* is inlined into both bundles), so SSR-safe
 * code paths can rely on it without hydration mismatches.
 */
export function isFlagshipShellEnvEnabled(): boolean {
  const viteValue =
    typeof import.meta !== 'undefined'
      ? (import.meta.env?.VITE_FLAGSHIP_SHELL as string | undefined)
      : undefined;
  if (viteValue === 'true') {
    return true;
  }

  // Next.js statically inlines NEXT_PUBLIC_* in server and client builds
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FLAGSHIP_SHELL === 'true') {
    return true;
  }

  return false;
}

export function isFlagshipShellEnabled(): boolean {
  if (isFlagshipShellEnvEnabled()) {
    return true;
  }

  try {
    return localStorage.getItem(FLAGSHIP_SHELL_STORAGE_KEY) === 'on';
  } catch {
    // localStorage unavailable (SSR, privacy mode) — flag stays off
    return false;
  }
}

export function setFlagshipShellEnabled(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(FLAGSHIP_SHELL_STORAGE_KEY, 'on');
    } else {
      localStorage.removeItem(FLAGSHIP_SHELL_STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable — nothing to persist
  }
}
