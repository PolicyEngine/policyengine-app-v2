import { PostHog } from "posthog-node";

let posthogInstance: PostHog | null = null;

function getPostHogToken() {
  return (
    process.env.POSTHOG_PROJECT_TOKEN ??
    process.env.NEXT_PUBLIC_POSTHOG_TOKEN ??
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  );
}

function getPostHogHost() {
  return process.env.POSTHOG_HOST ?? process.env.NEXT_PUBLIC_POSTHOG_HOST;
}

export function getPostHogServer() {
  const token = getPostHogToken();
  const host = getPostHogHost();

  if (!token || !host) {
    return null;
  }

  if (!posthogInstance) {
    posthogInstance = new PostHog(token, {
      host,
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return posthogInstance;
}
