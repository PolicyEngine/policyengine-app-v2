import { EconomyReportOutput } from '@/api/economy';
import { HouseholdData } from '@/types/ingredients/Household';
import { CalcError } from './CalcError';
import { CalcMetadata } from './CalcMetadata';

/**
 * Union type for all possible calculation results
 */
export type CalcResult = EconomyReportOutput | HouseholdData;

/**
 * Unified calculation status interface
 * Works for both economy and household calculations
 */
export interface CalcStatus {
  /**
   * Current status of the calculation
   * - idle: Not yet started
   * - computing: In progress
   * - complete: Successfully finished
   * - error: Failed
   */
  status: 'idle' | 'computing' | 'complete' | 'error';

  /**
   * Progress percentage (0-100)
   * For household: synthetic progress based on elapsed time
   * For economy: may be provided by server or undefined
   */
  progress?: number;

  /**
   * Human-readable status message
   */
  message?: string;

  /**
   * Queue position for economy calculations
   */
  queuePosition?: number;

  /**
   * Estimated time remaining in milliseconds
   */
  estimatedTimeRemaining?: number;

  /**
   * The calculation result (only present when status is 'complete')
   */
  result?: CalcResult;

  /**
   * Error information (only present when status is 'error')
   */
  error?: CalcError;

  /**
   * Metadata about this calculation
   */
  metadata: CalcMetadata;
}
