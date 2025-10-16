/**
 * Error information for failed calculations
 */
export interface CalcError {
  /**
   * Error code for categorizing the error
   */
  code: string;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Whether this error is retryable
   */
  retryable: boolean;
}
