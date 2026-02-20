/**
 * Journey Profiler Utility
 *
 * Provides comprehensive timing instrumentation for the complete user journey
 * from app load to report output. Uses the browser Performance API to generate
 * marks visible in Chrome DevTools Performance panel (Timings lane).
 *
 * Dev-only tool: disabled in production builds via import.meta.env.DEV.
 */

import { BASE_URL } from '@/constants';

/** Category of a profiled entry */
type ProfileCategory = 'user-interaction' | 'api-call' | 'render';

/** A single entry in the journey timeline */
interface JourneyEntry {
  /** Human-readable name of this segment */
  name: string;
  /** What kind of activity this represents */
  category: ProfileCategory;
  /** Absolute start time (ms since performance.timeOrigin) */
  startTime: number;
  /** Duration in milliseconds (0 for point-in-time events) */
  duration: number;
  /** Additional context (e.g., URL for api-call, mode name for user-interaction) */
  detail?: string;
}

/** Configuration for the JourneyProfiler */
interface JourneyProfilerConfig {
  /** Master enable flag. When false, all methods are no-ops. */
  enabled: boolean;
  /** Whether to intercept window.fetch for API call instrumentation */
  interceptFetch: boolean;
  /** Whether to log step transitions to console */
  logTransitions: boolean;
}

const defaultConfig: JourneyProfilerConfig = {
  enabled: true,
  interceptFetch: true,
  logTransitions: false,
};

class JourneyProfiler {
  private config: JourneyProfilerConfig;
  private entries: JourneyEntry[] = [];
  private activeStepName: string | null = null;
  private activeStepStart: number | null = null;
  private pendingMarks = new Map<string, { startTime: number; category: ProfileCategory }>();
  private originalFetch: typeof window.fetch | null = null;
  private initialized = false;

  constructor(config: Partial<JourneyProfilerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Initialize the journey profiler.
   * Installs the global fetch interceptor and marks app initialization.
   * Should be called once at app startup (module level in CalculatorApp.tsx).
   */
  init(): void {
    if (!this.config.enabled || this.initialized) {
      return;
    }
    this.initialized = true;

    performance.mark('journey:app-init');
    this.recordEntry({
      name: 'App init',
      category: 'render',
      startTime: performance.now(),
      duration: 0,
    });

    if (this.config.interceptFetch) {
      this.installFetchInterceptor();
    }
  }

  /**
   * Mark a pathway step transition.
   * Closes the previous step (recording its duration as user-interaction)
   * and opens a new one.
   *
   * @param stepName - The name of the step being entered (e.g., ReportViewMode value)
   */
  markStep(stepName: string): void {
    if (!this.config.enabled) {
      return;
    }

    const now = performance.now();

    // Close previous step
    if (this.activeStepName !== null && this.activeStepStart !== null) {
      const duration = now - this.activeStepStart;
      const prevMarkName = `journey:step:${this.activeStepName}`;

      performance.mark(`${prevMarkName}:end`);
      try {
        performance.measure(prevMarkName, `${prevMarkName}:start`, `${prevMarkName}:end`);
      } catch {
        // Measure can fail if marks were cleared; ignore
      }

      this.recordEntry({
        name: `Step: ${this.activeStepName}`,
        category: 'user-interaction',
        startTime: this.activeStepStart,
        duration,
      });
    }

    // Open new step
    this.activeStepName = stepName;
    this.activeStepStart = now;
    performance.mark(`journey:step:${stepName}:start`);

    if (this.config.logTransitions) {
      // eslint-disable-next-line no-console
      console.log(`[JourneyProfiler] → ${stepName}`);
    }
  }

  /**
   * Mark a point-in-time event (not a duration).
   * Use for milestones like "metadata loaded" or "report output rendered".
   *
   * @param eventName - Descriptive name for the event
   * @param category - Category of the event (defaults to 'render')
   */
  markEvent(eventName: string, category: ProfileCategory = 'render'): void {
    if (!this.config.enabled) {
      return;
    }

    const now = performance.now();
    performance.mark(`journey:event:${eventName}`);

    this.recordEntry({
      name: eventName,
      category,
      startTime: now,
      duration: 0,
    });
  }

  /**
   * Begin a timed span. Call markEnd() with the same name to close it.
   *
   * @param name - Identifier for this span
   * @param category - Category (defaults to 'render')
   */
  markStart(name: string, category: ProfileCategory = 'render'): void {
    if (!this.config.enabled) {
      return;
    }

    performance.mark(`journey:span:${name}:start`);
    this.pendingMarks.set(name, { startTime: performance.now(), category });
  }

  /**
   * End a timed span previously started with markStart().
   *
   * @param name - Identifier matching a previous markStart() call
   * @param category - Category override (defaults to the category from markStart)
   */
  markEnd(name: string, category?: ProfileCategory): void {
    if (!this.config.enabled) {
      return;
    }

    const pending = this.pendingMarks.get(name);
    if (!pending) {
      return;
    }

    const now = performance.now();
    const duration = now - pending.startTime;

    performance.mark(`journey:span:${name}:end`);
    try {
      performance.measure(
        `journey:span:${name}`,
        `journey:span:${name}:start`,
        `journey:span:${name}:end`
      );
    } catch {
      // Measure can fail if marks were cleared; ignore
    }

    this.recordEntry({
      name,
      category: category ?? pending.category,
      startTime: pending.startTime,
      duration,
    });

    this.pendingMarks.delete(name);
  }

  /**
   * Get structured summary of the full journey timeline.
   * Entries are sorted chronologically by start time.
   *
   * @returns Array of journey entries with cumulative active times
   */
  getSummary(): Array<JourneyEntry & { cumulativeTime: number }> {
    const sorted = [...this.entries].sort((a, b) => a.startTime - b.startTime);
    let cumulative = 0;

    return sorted.map((entry) => {
      cumulative += entry.duration;
      return { ...entry, cumulativeTime: cumulative };
    });
  }

  /**
   * Print a formatted summary table to the console.
   * Shows each segment with category, duration, and cumulative time.
   */
  printSummary(): void {
    if (!this.config.enabled) {
      return;
    }

    // Close the active step so it appears in the summary
    if (this.activeStepName !== null && this.activeStepStart !== null) {
      const now = performance.now();
      const duration = now - this.activeStepStart;

      this.recordEntry({
        name: `Step: ${this.activeStepName}`,
        category: 'user-interaction',
        startTime: this.activeStepStart,
        duration,
      });

      this.activeStepName = null;
      this.activeStepStart = null;
    }

    const summary = this.getSummary();
    const baseTime = summary[0]?.startTime ?? 0;

    const tableData = summary.map((entry) => ({
      Event: entry.name,
      Category: entry.category,
      Start: `+${((entry.startTime - baseTime) / 1000).toFixed(2)}s`,
      Duration: entry.duration > 0 ? `${entry.duration.toFixed(0)}ms` : '-',
      Cumulative: `${(entry.cumulativeTime / 1000).toFixed(2)}s`,
      Detail: entry.detail ?? '',
    }));

    /* eslint-disable no-console */
    console.log('%c[JourneyProfiler] Journey Summary', 'font-weight: bold; color: #319795;');
    console.table(tableData);

    const byCategory = this.getCategoryTotals();
    console.log('%c[JourneyProfiler] Time by Category', 'font-weight: bold; color: #319795;');
    console.table(byCategory);
    /* eslint-enable no-console */
  }

  /**
   * Clear all recorded marks, measures, and entries.
   */
  reset(): void {
    this.entries = [];
    this.activeStepName = null;
    this.activeStepStart = null;
    this.pendingMarks.clear();

    performance
      .getEntriesByType('mark')
      .filter((m) => m.name.startsWith('journey:'))
      .forEach((m) => performance.clearMarks(m.name));

    performance
      .getEntriesByType('measure')
      .filter((m) => m.name.startsWith('journey:'))
      .forEach((m) => performance.clearMeasures(m.name));
  }

  /**
   * Restore the original fetch function and clear all state.
   */
  destroy(): void {
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }
    this.reset();
    this.initialized = false;
  }

  /**
   * Get total time spent in each category
   */
  private getCategoryTotals(): Record<string, { count: number; totalMs: number; total: string }> {
    const totals: Record<string, { count: number; totalMs: number; total: string }> = {};

    for (const entry of this.entries) {
      if (!totals[entry.category]) {
        totals[entry.category] = { count: 0, totalMs: 0, total: '0.00s' };
      }
      totals[entry.category].count++;
      totals[entry.category].totalMs += entry.duration;
      totals[entry.category].total = `${(totals[entry.category].totalMs / 1000).toFixed(2)}s`;
    }

    return totals;
  }

  /**
   * Record an entry in the internal timeline
   */
  private recordEntry(entry: JourneyEntry): void {
    this.entries.push(entry);
  }

  /**
   * Install a global fetch interceptor that wraps calls to api.policyengine.org
   * with performance marks. Non-API calls pass through unmodified.
   */
  private installFetchInterceptor(): void {
    const origFetch = window.fetch.bind(window);
    this.originalFetch = origFetch;

    // Use arrow function to capture class methods without aliasing `this`
    const recordEntry = (entry: JourneyEntry) => this.recordEntry(entry);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      if (!url.startsWith(BASE_URL)) {
        return origFetch(input, init);
      }

      const urlPath = new URL(url).pathname;
      const method = init?.method?.toUpperCase() || 'GET';
      const markName = `journey:api:${method}:${urlPath}`;
      const startTime = performance.now();

      performance.mark(`${markName}:start`);

      try {
        const response = await origFetch(input, init);
        const duration = performance.now() - startTime;

        performance.mark(`${markName}:end`);
        try {
          performance.measure(markName, `${markName}:start`, `${markName}:end`);
        } catch {
          // ignore
        }

        recordEntry({
          name: `${method} ${urlPath}`,
          category: 'api-call',
          startTime,
          duration,
          detail: url,
        });

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;

        performance.mark(`${markName}:error`);
        try {
          performance.measure(`${markName} (failed)`, `${markName}:start`, `${markName}:error`);
        } catch {
          // ignore
        }

        recordEntry({
          name: `${method} ${urlPath} (FAILED)`,
          category: 'api-call',
          startTime,
          duration,
          detail: url,
        });

        throw error;
      }
    };
  }
}

// Export singleton instance
export const journeyProfiler = new JourneyProfiler({
  enabled: import.meta.env.DEV,
});

/**
 * Hook to use journey profiler in components
 */
export function useJourneyProfiler() {
  return {
    markStep: (stepName: string) => journeyProfiler.markStep(stepName),
    markEvent: (eventName: string, category?: ProfileCategory) =>
      journeyProfiler.markEvent(eventName, category),
    markStart: (name: string, category?: ProfileCategory) =>
      journeyProfiler.markStart(name, category),
    markEnd: (name: string, category?: ProfileCategory) => journeyProfiler.markEnd(name, category),
    printSummary: () => journeyProfiler.printSummary(),
    getSummary: () => journeyProfiler.getSummary(),
    reset: () => journeyProfiler.reset(),
  };
}

// Expose on window for console access in dev mode
if (import.meta.env.DEV) {
  (window as any).__journeyProfiler = journeyProfiler;
}
