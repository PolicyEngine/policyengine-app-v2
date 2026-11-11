/**
 * Server-side gate for flagship API routes. They are on with the flagship
 * shell, the default; a deployment that sets the flag to "false" (back to
 * the v2 app) exposes none of them.
 */
export function isFlagshipApiEnabled(): boolean {
  return typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FLAGSHIP_SHELL !== 'false';
}

/** 404 response for flagship routes on flag-off deployments. */
export function flagshipApiDisabledResponse(): Response {
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Whether a country's Ask chat is switched on. The chat is paused: it is
 * off unless its flag is "on", and its routes return 404 while off, so no
 * model endpoint is reachable. Reads are static so Next.js can inline them.
 */
export function isAskChatEnabled(country: 'us' | 'uk'): boolean {
  if (typeof process === 'undefined') {
    return false;
  }
  return country === 'us'
    ? process.env.NEXT_PUBLIC_US_ASK === 'on'
    : process.env.NEXT_PUBLIC_UK_CHAT === 'on';
}
