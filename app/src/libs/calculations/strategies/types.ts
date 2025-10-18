import { Query } from '@tanstack/react-query';
import { CalcMetadata, CalcParams, CalcStatus } from '@/types/calculation';

/**
 * Configuration for TanStack Query refetch behavior
 */
export interface RefetchConfig {
  /**
   * How often to refetch the query
   * - number: refetch interval in milliseconds
   * - false: don't refetch
   * - function: dynamic interval based on query state
   */
  refetchInterval: number | false | ((query: Query) => number | false);

  /**
   * How long data stays fresh before being considered stale
   */
  staleTime: number;
}

/**
 * Progress information for in-progress calculations
 */
export interface ProgressInfo {
  /**
   * Progress percentage (0-100)
   */
  progress: number;

  /**
   * Human-readable status message
   */
  message: string;

  /**
   * Estimated time remaining in milliseconds
   */
  estimatedTimeRemaining: number;
}

/**
 * Strategy interface for executing calculations
 * Each calculation type (economy, household) implements this interface
 */
export interface CalcExecutionStrategy {
  /**
   * Execute a calculation with the given parameters
   * @param params - Calculation parameters
   * @param metadata - Calculation metadata (includes reportId for household sim-level calcs)
   * @returns Promise resolving to calculation status
   */
  execute(params: CalcParams, metadata: CalcMetadata): Promise<CalcStatus>;

  /**
   * Get the refetch configuration for this strategy
   * Different strategies may poll at different intervals or not at all
   * @returns Refetch configuration for TanStack Query
   */
  getRefetchConfig(): RefetchConfig;

  /**
   * Transform API-specific response to unified CalcStatus
   * @param apiResponse - Raw API response
   * @returns Unified calculation status
   */
  transformResponse(apiResponse: unknown): CalcStatus;
}
