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

  const postHogCookieMatch = cookieHeader.match(/ph_phc_.*?_posthog=([^;]+)/);

  if (!postHogCookieMatch?.[1]) {
    return undefined;
  }

  try {
    const decodedCookie = decodeURIComponent(postHogCookieMatch[1]);
    const postHogData = JSON.parse(decodedCookie) as { distinct_id?: string };
    return postHogData.distinct_id;
  } catch (error) {
    console.error("[Calculator] Failed to parse PostHog cookie:", error);
    return undefined;
  }
}

export function register() {}

function getServerRelease() {
  return process.env.APP_RELEASE ?? process.env.NEXT_PUBLIC_APP_RELEASE;
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
    surface: "calculator",
    release: getServerRelease(),
    request_path: getRequestPath(request),
  });
}
