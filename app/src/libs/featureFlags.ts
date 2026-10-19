/**
 * Feature flags for in-progress product work.
 *
 * The flagship shell (Ask / Tracker / Build / Library navigation) is the
 * US app's default: on unless the build sets the flag to "false"
 * (NEXT_PUBLIC_FLAGSHIP_SHELL=false, or VITE_FLAGSHIP_SHELL=false), which
 * brings back the v2 app. The UK stays on v2 until its own flag is "true"
 * (NEXT_PUBLIC_FLAGSHIP_SHELL_UK=true, or VITE_FLAGSHIP_SHELL_UK=true).
 * The v2 code stays in place until it is removed.
 */

const FLAGSHIP_SHELL_STORAGE_KEY = 'pe-flagship-shell';
/** The UK's own override, so each country can be previewed on its own. */
const FLAGSHIP_SHELL_UK_STORAGE_KEY = 'pe-flagship-shell-uk';

const storageKeyFor = (countryId?: string) =>
  countryId === 'uk' ? FLAGSHIP_SHELL_UK_STORAGE_KEY : FLAGSHIP_SHELL_STORAGE_KEY;

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
export function isFlagshipShellEnvEnabled(countryId?: string): boolean {
  if (countryId === 'uk') {
    return isUkFlagshipEnvEnabled();
  }
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

/** The UK's own switch: v2 until it is "true". */
function isUkFlagshipEnvEnabled(): boolean {
  const viteValue =
    typeof import.meta !== 'undefined'
      ? (import.meta.env?.VITE_FLAGSHIP_SHELL_UK as string | undefined)
      : undefined;
  if (viteValue === 'true') {
    return true;
  }
  return typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FLAGSHIP_SHELL_UK === 'true';
}

/**
 * Whether a country's app is the flagship shell. Without a country, the
 * US rule applies.
 */
export function isFlagshipShellEnabled(countryId?: string): boolean {
  if (isFlagshipShellEnvEnabled(countryId)) {
    return true;
  }
  if (!isOverrideAllowed()) {
    return false;
  }

  try {
    return localStorage.getItem(storageKeyFor(countryId)) === 'on';
  } catch {
    // localStorage unavailable (SSR, privacy mode) — flag stays off
    return false;
  }
}

/** Turns the override on or off for a country; without one, the US. */
export function setFlagshipShellEnabled(enabled: boolean, countryId?: string): void {
  try {
    if (enabled) {
      localStorage.setItem(storageKeyFor(countryId), 'on');
    } else {
      localStorage.removeItem(storageKeyFor(countryId));
    }
  } catch {
    // localStorage unavailable — nothing to persist
  }
}
