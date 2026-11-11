import { isCorrectiveSPMError } from '@/utils/householdCalculationError';

export interface HouseholdAPIError extends Error {
  code?: string;
  retryable: boolean;
}

/** Parse the same API envelope for both HTTP errors and legacy status:error responses. */
export function householdAPIErrorFromBody(body: unknown, fallback: string): HouseholdAPIError {
  const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const detail = Array.isArray(payload.errors)
    ? payload.errors.find(
        (error): error is { message: string; code?: unknown } =>
          !!error && typeof error === 'object' && typeof error.message === 'string'
      )
    : undefined;
  const message =
    detail?.message ??
    (typeof payload.message === 'string'
      ? payload.message
      : typeof payload.error === 'string'
        ? payload.error
        : fallback);
  const code = typeof detail?.code === 'string' ? detail.code : undefined;
  return Object.assign(new Error(message), { code, retryable: !isCorrectiveSPMError(code) });
}

/** Preserve the API's validation message and code, with legacy response support. */
export async function householdAPIError(
  response: Response,
  fallback: string
): Promise<HouseholdAPIError> {
  try {
    return householdAPIErrorFromBody(await response.json(), fallback);
  } catch {
    return householdAPIErrorFromBody(null, fallback);
  }
}
