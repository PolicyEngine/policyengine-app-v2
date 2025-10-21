import { useEffect, useState } from 'react';

/**
 * Server progress data for blending with synthetic progress
 */
interface ServerProgress {
  queuePosition?: number;
  estimatedTimeRemaining?: number;
}

/**
 * Synthetic progress result
 */
interface SyntheticProgress {
  progress: number;
  message: string;
}

/**
 * Configuration constants for synthetic progress
 */
const SYNTHETIC_PROGRESS_CONFIG = {
  HOUSEHOLD_DURATION_MS: 45000, // 45 seconds
  ECONOMY_DURATION_MS: 720000,  // 12 minutes
  UPDATE_INTERVAL_MS: 500,      // Update every 500ms
  MAX_PROGRESS: 95,             // Cap at 95% (never show 100% until actually complete)
  SERVER_WEIGHT: 0.7,           // 70% server data when blending
  SYNTHETIC_WEIGHT: 0.3,        // 30% synthetic when blending
} as const;

/**
 * Get contextual message based on progress and calculation type
 */
function getProgressMessage(
  progress: number,
  calcType: 'household' | 'economy',
  serverProgress?: ServerProgress
): string {
  // If in queue, show queue message
  if (serverProgress?.queuePosition !== undefined && serverProgress.queuePosition > 0) {
    return `In queue (position ${serverProgress.queuePosition})...`;
  }

  // Household-specific messages
  if (calcType === 'household') {
    if (progress < 10) return 'Initializing calculation...';
    if (progress < 30) return 'Loading household data...';
    if (progress < 60) return 'Running policy simulation...';
    if (progress < 80) return 'Calculating impacts...';
    return 'Finalizing results...';
  }

  // Economy-specific messages
  if (progress < 10) return 'Initializing economy-wide calculation...';
  if (progress < 25) return 'Loading population data...';
  if (progress < 50) return 'Simulating baseline scenario...';
  if (progress < 75) return 'Simulating reform scenario...';
  if (progress < 90) return 'Computing distributional impacts...';
  return 'Finalizing economy-wide results...';
}

/**
 * Custom hook for client-side synthetic progress
 *
 * Runs a local timer while query is pending or computing.
 * Provides smooth progress feedback without API polling.
 *
 * For household calculations: Pure time-based synthetic progress
 * For economy calculations: Blends server data with synthetic smoothing
 *
 * @param isActive - Whether to run synthetic progress (true while loading/computing)
 * @param calcType - Type of calculation (affects duration estimate and messages)
 * @param serverProgress - Optional server-provided progress data (for economy calcs)
 * @returns Synthetic progress object with progress percentage and message
 *
 * @example
 * // Household calculation (pure synthetic)
 * const synthetic = useSyntheticProgress(isLoading, 'household');
 *
 * @example
 * // Economy calculation (blended with server data)
 * const synthetic = useSyntheticProgress(
 *   isPending,
 *   'economy',
 *   { queuePosition: 3, estimatedTimeRemaining: 120000 }
 * );
 */
export function useSyntheticProgress(
  isActive: boolean,
  calcType: 'household' | 'economy',
  serverProgress?: ServerProgress
): SyntheticProgress {
  const [synthetic, setSynthetic] = useState<SyntheticProgress>({
    progress: 0,
    message: '',
  });

  useEffect(() => {
    if (!isActive) {
      setSynthetic({ progress: 0, message: '' });
      return;
    }

    const startTime = Date.now();
    const estimatedDuration = calcType === 'household'
      ? SYNTHETIC_PROGRESS_CONFIG.HOUSEHOLD_DURATION_MS
      : SYNTHETIC_PROGRESS_CONFIG.ECONOMY_DURATION_MS;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;

      // Calculate progress differently based on type
      let progress: number;

      if (calcType === 'household') {
        // Pure time-based synthetic progress for household
        progress = Math.min(
          (elapsed / estimatedDuration) * 100,
          SYNTHETIC_PROGRESS_CONFIG.MAX_PROGRESS
        );
      } else {
        // For economy: blend server data with synthetic smoothing
        if (serverProgress?.estimatedTimeRemaining) {
          // Use server's estimate, but smooth it with synthetic progress
          const serverProgressPct = 100 - ((serverProgress.estimatedTimeRemaining / estimatedDuration) * 100);
          const syntheticProgressPct = Math.min(
            (elapsed / estimatedDuration) * 100,
            SYNTHETIC_PROGRESS_CONFIG.MAX_PROGRESS
          );
          // Weighted blend: keeps bar moving even if server estimate stalls
          progress = (serverProgressPct * SYNTHETIC_PROGRESS_CONFIG.SERVER_WEIGHT) +
                     (syntheticProgressPct * SYNTHETIC_PROGRESS_CONFIG.SYNTHETIC_WEIGHT);
        } else if (serverProgress?.queuePosition !== undefined) {
          // In queue: show minimal progress
          progress = Math.max(5, 20 - (serverProgress.queuePosition * 2));
        } else {
          // Fallback to pure synthetic
          progress = Math.min(
            (elapsed / estimatedDuration) * 100,
            SYNTHETIC_PROGRESS_CONFIG.MAX_PROGRESS
          );
        }
      }

      setSynthetic({
        progress: Math.min(progress, SYNTHETIC_PROGRESS_CONFIG.MAX_PROGRESS),
        message: getProgressMessage(progress, calcType, serverProgress),
      });
    }, SYNTHETIC_PROGRESS_CONFIG.UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isActive, calcType, serverProgress?.queuePosition, serverProgress?.estimatedTimeRemaining]);

  return synthetic;
}

// Export for testing
export { getProgressMessage, SYNTHETIC_PROGRESS_CONFIG };
