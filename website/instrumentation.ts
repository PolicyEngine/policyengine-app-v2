type RequestLike = {
  headers?: Headers | { cookie?: string | string[] | undefined };
  url?: string;
};

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(typeof error === "string" ? error : "Unknown request error");
}

function getCookieHeader(request: RequestLike): string | undefined {
  const headers = request.headers;

  if (!headers) {
    return undefined;
  }

  if (headers instanceof Headers) {
    return headers.get("cookie") ?? undefined;
  }

  const cookie = headers.cookie;
  return Array.isArray(cookie) ? cookie.join("; ") : cookie;
}

function getDistinctIdFromCookie(cookieHeader?: string): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  const posthogCookieMatch = cookieHeader.match(/ph_phc_.*?_posthog=([^;]+)/);

  if (!posthogCookieMatch?.[1]) {
    return undefined;
  }

  try {
    const decodedCookie = decodeURIComponent(posthogCookieMatch[1]);
    const posthogData = JSON.parse(decodedCookie) as { distinct_id?: string };
    return posthogData.distinct_id;
  } catch (error) {
    console.error("[Website] Failed to parse PostHog cookie:", error);
    return undefined;
  }
}

function getRequestPath(request: RequestLike): string | undefined {
  if (!request.url) {
    return undefined;
  }

  try {
    return new URL(request.url).pathname;
  } catch {
    return undefined;
  }
}

function getServerRelease() {
  return process.env.APP_RELEASE ?? process.env.NEXT_PUBLIC_APP_RELEASE;
}

export function register() {}

export async function onRequestError(
  error: unknown,
  request: RequestLike,
  _context: unknown,
) {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { getPostHogServer } = await import("./src/lib/posthog-server");
  const posthog = getPostHogServer();

  if (!posthog) {
    return;
  }

  const distinctId = getDistinctIdFromCookie(getCookieHeader(request));
  await posthog.captureException(normalizeError(error), distinctId, {
    surface: "website",
    release: getServerRelease(),
    request_path: getRequestPath(request),
  });
}
