/**
 * Performance instrumentation harness for navigation testing.
 *
 * Logs component lifecycle, navigation timing, and render metrics
 * to the browser console. All output is prefixed with [PERF] for
 * easy filtering in DevTools.
 *
 * Remove this file before merging the winning approach.
 */

/* eslint-disable no-console */

const ENABLED = typeof window !== 'undefined';

// Stable reference time for the session
const sessionStart = ENABLED ? performance.now() : 0;

function ts(): string {
  return `+${(performance.now() - sessionStart).toFixed(1)}ms`;
}

// ── Component lifecycle ─────────────────────────────────────────

/**
 * Call inside useEffect(() => { ... return cleanup }, []) to log
 * mount and unmount of a component with timing.
 *
 * Usage:
 *   useEffect(() => perfMount("StandardLayout"), []);
 */
export function perfMount(name: string): () => void {
  if (!ENABLED) {
    return () => {};
  }

  const mountTime = performance.now();
  performance.mark(`${name}-mount`);
  console.log(`[PERF] ${ts()} MOUNT   ${name}`);

  return () => {
    const lifetime = performance.now() - mountTime;
    performance.mark(`${name}-unmount`);
    try {
      performance.measure(`${name}-lifetime`, `${name}-mount`, `${name}-unmount`);
    } catch {
      // marks may have been cleared
    }
    console.log(`[PERF] ${ts()} UNMOUNT ${name} (alive ${lifetime.toFixed(1)}ms)`);
  };
}

// ── Navigation timing ─────���─────────────────────────────────────

let lastPathname: string | null = null;
let navStartTime: number | null = null;

/**
 * Call on every pathname change to track navigation duration.
 * Logs the time between consecutive pathname changes and the
 * gap between nav-start and next StandardLayout mount.
 *
 * Usage (in layout.tsx):
 *   useEffect(() => { perfNavChange(pathname); }, [pathname]);
 */
export function perfNavChange(pathname: string): void {
  if (!ENABLED) {
    return;
  }

  const now = performance.now();

  if (lastPathname !== null && lastPathname !== pathname) {
    performance.mark('nav-start');
    navStartTime = now;
    console.log(`[PERF] ${ts()} NAV     ${lastPathname} → ${pathname}`);
  }

  lastPathname = pathname;
}

/**
 * Call when the destination content is visible (e.g. in the page
 * component's useEffect). Measures nav-start → content-visible.
 */
export function perfContentVisible(pageName: string): void {
  if (!ENABLED || navStartTime === null) {
    return;
  }

  const elapsed = performance.now() - navStartTime;
  performance.mark('content-visible');
  try {
    performance.measure('nav→content', 'nav-start', 'content-visible');
  } catch {
    // marks may have been cleared
  }
  console.log(`[PERF] ${ts()} VISIBLE ${pageName} (${elapsed.toFixed(1)}ms after nav)`);
  navStartTime = null;
}

// ── React Profiler callback ─────────────────────────────────────

/**
 * Pass as the onRender prop of <React.Profiler>.
 *
 * Usage:
 *   <Profiler id="StandardLayout" onRender={perfProfilerCallback}>
 */
export function perfProfilerCallback(
  id: string,
  phase: 'mount' | 'update' | 'nested-update',
  actualDuration: number,
  baseDuration: number,
  _startTime: number,
  _commitTime: number
): void {
  if (!ENABLED) {
    return;
  }

  console.log(
    `[PERF] ${ts()} RENDER  ${id} phase=${phase} actual=${actualDuration.toFixed(1)}ms base=${baseDuration.toFixed(1)}ms`
  );
}

// ─��� Pathway mode change ───���────────────────────────��────────────

/**
 * Log pathway view mode transitions (e.g. LABEL → PARAMETER_SELECTOR).
 */
export function perfModeChange(wrapper: string, from: string, to: string): void {
  if (!ENABLED) {
    return;
  }

  performance.mark(`${wrapper}-mode-${to}`);
  console.log(`[PERF] ${ts()} MODE    ${wrapper}: ${from} → ${to}`);
}
