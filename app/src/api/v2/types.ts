/**
 * Shared types for the v2 API module.
 *
 * Types that appear in multiple endpoint files are defined here
 * to avoid duplication and ensure consistency.
 */

/** Policy ID input: UUID string, "current_law", or undefined (omit). */
export type PolicyIdInput = string | 'current_law' | undefined;

/**
 * Report status values returned by the v2 API.
 * Used by both economy and household analysis endpoints.
 */
export type ReportStatus = 'pending' | 'execution_deferred' | 'running' | 'completed' | 'failed';

/**
 * Simulation info nested in analysis responses.
 * Shared by both economy and household analysis endpoints.
 */
export interface SimulationInfo {
  id: string;
  status: string;
  error_message: string | null;
}
