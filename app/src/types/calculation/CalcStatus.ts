import { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { EconomicImpactResponse } from '@/api/v2/economyAnalysis';
import { Household } from '@/types/ingredients/Household';
import { CalcError } from './CalcError';
import { CalcMetadata } from './CalcMetadata';

/**
 * Union type for all possible calculation results
 *
 * - SocietyWideReportOutput: v1 economy calculation result (legacy)
 * - EconomicImpactResponse: v2 economy calculation result
 * - Household: household calculation result
 */
export type CalcResult = SocietyWideReportOutput | EconomicImpactResponse | Household;

/**
 * Calculation status values
 *
 * State lifecycle and purposes:
 *
 * 1. **initializing**: We don't know the calculation state yet
 *    - Purpose: Prevent premature "No output found" UI while determining actual state
 *    - When: Cache hasn't hydrated yet, or query is fetching for the first time
 *    - Why needed: Avoids race condition where hook renders before cache hydration completes,
 *      which would incorrectly show "No output found" for completed reports
 *    - UI: Show loading spinner (not "No output found")
 *    - Transitions to: Any other state once data is available
 *    - Example: User loads /report/123/overview → hook renders → cache hydrates → transitions to 'complete'
 *
 * 2. **idle**: We know for certain that no calculation has been started
 *    - Purpose: Indicate a calculation truly hasn't been initiated (not just "we don't know yet")
 *    - When: Page has loaded, data is available, but CalcOrchestrator was never called
 *    - Why different from initializing: This is a KNOWN state (we checked and found nothing),
 *      whereas initializing means we haven't checked yet
 *    - UI: Show "No output found" or "Start calculation" button
 *    - Transitions to: pending (when calculation starts)
 *    - Example: User creates a new report but doesn't trigger calculation yet
 *
 * 3. **pending**: Calculation is actively running or queued
 *    - Purpose: Show progress and prevent duplicate calculation requests
 *    - When: API is processing the calculation
 *    - UI: Show progress bar, queue position, estimated time
 *    - Transitions to: complete, error
 *    - Note: Matches Simulation.status='pending' and API status values
 *
 * 4. **complete**: Calculation finished successfully
 *    - Purpose: Display results to user
 *    - When: API returns results, or results are loaded from cache
 *    - UI: Show charts, tables, analysis
 *    - Transitions to: (terminal state - no further transitions)
 *
 * 5. **error**: Calculation failed
 *    - Purpose: Show error message and allow retry
 *    - When: API returns error, network failure, validation error
 *    - UI: Show error message, retry button
 *    - Transitions to: pending (on retry)
 */
export type CalcStatusValue = 'initializing' | 'idle' | 'pending' | 'complete' | 'error';

/**
 * Unified calculation status interface
 * Works for both economy and household calculations
 */
export interface CalcStatus {
  /**
   * Current status of the calculation
   * See CalcStatusValue type documentation for detailed state descriptions
   */
  status: CalcStatusValue;

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
