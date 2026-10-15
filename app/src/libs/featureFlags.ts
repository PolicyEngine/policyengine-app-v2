/**
 * Feature flags for in-progress product work.
 *
 * The flagship shell (Ask / Tracker / Build / Library navigation) is the
 * app's default: on unless the build sets the flag to "false"
 * (NEXT_PUBLIC_FLAGSHIP_SHELL=false, or VITE_FLAGSHIP_SHELL=false), which
 * brings back the v2 app. The v2 code stays in place until it is removed.
 */

const FLAGSHIP_SHELL_STORAGE_KEY = 'pe-flagship-shell';

/**
 * Whether the localStorage override may activate the shell. Off unless
 * the deployment opts in (or in dev), so production builds have no
 * runtime activation path — the env flag is the only switch.
 */
function isOverrideAllowed(): boolean {
  const viteValue =
    typeof import.meta !== 'undefined'
      ? ((import.meta.env?.VITE_FLAGSHIP_OVERRIDE ?? import.meta.env?.DEV) as
          | string
          | boolean
          | undefined)
      : undefined;
  if (viteValue === 'allow' || viteValue === true) {
    return true;
  }
  if (typeof process !== 'undefined') {
    if (process.env?.NEXT_PUBLIC_FLAGSHIP_OVERRIDE === 'allow') {
      return true;
    }
    if (process.env?.NODE_ENV === 'development') {
      return true;
    }
  }
  return false;
}

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
  if (viteValue === 'false') {
    return false;
  }

  // Next.js statically inlines NEXT_PUBLIC_* in server and client builds
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FLAGSHIP_SHELL === 'false') {
    return false;
  }

  return true;
}

export function isFlagshipShellEnabled(): boolean {
  if (isFlagshipShellEnvEnabled()) {
    return true;
  }
  if (!isOverrideAllowed()) {
    return false;
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
