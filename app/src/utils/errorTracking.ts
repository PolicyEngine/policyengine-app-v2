'use client';

import type { ErrorInfo } from 'react';
import { getPostHogClient } from '@/utils/posthogClient';

type ErrorContext = Record<string, unknown>;

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(typeof error === 'string' ? error : 'Unknown calculator error');
}

export function captureCalculatorException(
  error: unknown,
  context: ErrorContext = {},
) {
  const posthog = getPostHogClient();

  if (!posthog) {
    return;
  }

  posthog.captureException(normalizeError(error), {
    surface: 'calculator',
    ...context,
  });
}

export function captureCalculationException(
  error: unknown,
  context: ErrorContext = {},
) {
  captureCalculatorException(error, {
    source: 'calculation',
    ...context,
  });
}

export function captureApiException(error: unknown, context: ErrorContext = {}) {
  captureCalculatorException(error, {
    source: 'api',
    ...context,
  });
}

export function captureRouteException(error: unknown, context: ErrorContext = {}) {
  captureCalculatorException(error, {
    source: 'route',
    ...context,
  });
}

export function captureReactBoundaryException(
  error: unknown,
  errorInfo?: ErrorInfo,
  context: ErrorContext = {},
) {
  captureCalculatorException(error, {
    source: 'react_error_boundary',
    component_stack: errorInfo?.componentStack,
    ...context,
  });
}
