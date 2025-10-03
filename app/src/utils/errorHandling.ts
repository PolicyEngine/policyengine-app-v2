/**
 * Error handling utilities
 */

import { notifications } from '@mantine/notifications';

export interface ApiError {
  response?: {
    data?: {
      detail?: string | { msg: string; type: string }[];
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

/**
 * Extract a clean error message from an API error
 */
export function getErrorMessage(error: ApiError): string {
  // Try to get detail from response
  const detail = error.response?.data?.detail;

  if (typeof detail === 'string') {
    return detail;
  }

  // Handle FastAPI validation errors (array of errors)
  if (Array.isArray(detail)) {
    return detail
      .map(err => `${err.msg}`)
      .join('; ');
  }

  // Try message from response data
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Fallback to error message
  return error.message || 'An unknown error occurred';
}

/**
 * Show an error notification to the user
 */
export function showErrorNotification(error: ApiError, title: string = 'Error') {
  const message = getErrorMessage(error);

  notifications.show({
    title,
    message,
    color: 'red',
    autoClose: 8000,
  });
}
