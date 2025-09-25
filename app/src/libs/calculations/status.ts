export type CalculationStatus = 'computing' | 'ok' | 'error';

export interface CalculationStatusResponse {
  status: CalculationStatus;
  progress?: number; // 0-100 for synthetic progress
  message?: string; // User-friendly status message
  queuePosition?: number; // Real queue position (economy only)
  averageTime?: number; // Average completion time
  estimatedTimeRemaining?: number; // Milliseconds
  result?: any; // The actual calculation result
  error?: string; // Error message if status is 'error'
}
