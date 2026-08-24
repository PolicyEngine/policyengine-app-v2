/**
 * Server-side gate for flagship API routes. The flagship shell ships
 * dark; its routes must not exist on deployments where the flag is off,
 * so production exposes no new surface until go-live flips the env.
 */
export function isFlagshipApiEnabled(): boolean {
  return typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FLAGSHIP_SHELL === 'true';
}

/** 404 response for flagship routes on flag-off deployments. */
export function flagshipApiDisabledResponse(): Response {
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}
