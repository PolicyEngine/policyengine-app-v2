import { Household } from '@/types/ingredients/Household';
import { ProgressInfo } from './strategies/types';

/**
 * Active calculation tracking
 */
interface ActiveCalc {
  /**
   * The promise for the ongoing calculation
   */
  promise: Promise<Household>;

  /**
   * When the calculation started (milliseconds since epoch)
   */
  startTime: number;

  /**
   * Estimated duration in milliseconds
   */
  estimatedDuration: number;

  /**
   * Whether the calculation has completed
   */
  completed: boolean;

  /**
   * Result if successfully completed
   */
  result?: Household;

  /**
   * Error if failed
   */
  error?: Error;
}

/**
 * Progress Tracker for long-running household calculations
 * Manages synthetic progress indicators based on elapsed time
 */
export class ProgressTracker {
  private active = new Map<string, ActiveCalc>();

  /**
   * Register a new calculation for progress tracking
   * @param calcId - Unique identifier for the calculation
   * @param promise - The promise representing the calculation
   * @param estimatedDuration - Estimated time to completion in milliseconds (default: 60000)
   */
  register(calcId: string, promise: Promise<Household>, estimatedDuration = 60000): void {
    const tracking: ActiveCalc = {
      promise,
      startTime: Date.now(),
      estimatedDuration,
      completed: false,
    };

    this.active.set(calcId, tracking);

    // Auto-update on completion
    promise
      .then((result) => {
        this.complete(calcId, result);
      })
      .catch((error) => {
        this.fail(calcId, error);
      });
  }

  /**
   * Get current progress for a calculation
   * @param calcId - The calculation ID
   * @returns Progress information or null if not found
   */
  getProgress(calcId: string): ProgressInfo | null {
    const tracking = this.active.get(calcId);

    if (!tracking) {
      return null;
    }

    // If completed, return 100%
    if (tracking.completed) {
      if (tracking.error) {
        return null; // Let error handling take over
      }
      return {
        progress: 100,
        message: 'Complete!',
        estimatedTimeRemaining: 0,
      };
    }

    // Calculate synthetic progress
    const elapsed = Date.now() - tracking.startTime;
    const progress = Math.min((elapsed / tracking.estimatedDuration) * 100, 95); // Cap at 95%
    const remaining = Math.max(0, tracking.estimatedDuration - elapsed);

    return {
      progress,
      message: this.getProgressMessage(progress),
      estimatedTimeRemaining: remaining,
    };
  }

  /**
   * Mark a calculation as successfully completed
   * @param calcId - The calculation ID
   * @param result - The calculation result
   */
  complete(calcId: string, result: Household): void {
    const tracking = this.active.get(calcId);
    if (tracking) {
      tracking.completed = true;
      tracking.result = result;

      // Clean up after a delay
      setTimeout(() => {
        this.active.delete(calcId);
      }, 5000);
    }
  }

  /**
   * Mark a calculation as failed
   * @param calcId - The calculation ID
   * @param error - The error that occurred
   */
  fail(calcId: string, error: Error): void {
    const tracking = this.active.get(calcId);
    if (tracking) {
      tracking.completed = true;
      tracking.error = error;

      // Clean up after a delay
      setTimeout(() => {
        this.active.delete(calcId);
      }, 5000);
    }
  }

  /**
   * Check if a calculation is currently active
   * @param calcId - The calculation ID
   * @returns True if active, false otherwise
   */
  isActive(calcId: string): boolean {
    const tracking = this.active.get(calcId);
    return tracking !== undefined && !tracking.completed;
  }

  /**
   * Get human-readable progress message based on percentage
   * @param progress - Progress percentage (0-100)
   * @returns Contextual status message
   */
  private getProgressMessage(progress: number): string {
    if (progress < 10) {
      return 'Initializing calculation...';
    }
    if (progress < 30) {
      return 'Loading household data...';
    }
    if (progress < 60) {
      return 'Running policy simulation...';
    }
    if (progress < 80) {
      return 'Calculating impacts...';
    }
    return 'Finalizing results...';
  }
}
