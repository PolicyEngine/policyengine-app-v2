import type { ErrorInfo } from 'react';

export interface ReportErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
}
