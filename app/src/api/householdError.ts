/** Preserve the API's validation message and code, with legacy response support. */
export async function householdAPIError(response: Response, fallback: string): Promise<Error> {
  try {
    const body = await response.json();
    const detail = Array.isArray(body.errors)
      ? body.errors.find((error: { message?: unknown }) => typeof error.message === 'string')
      : undefined;
    const message = detail?.message ?? (typeof body.message === 'string' ? body.message : fallback);
    return Object.assign(new Error(message), { code: detail?.code });
  } catch {
    return new Error(fallback);
  }
}
