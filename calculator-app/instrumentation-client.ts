import posthog from "posthog-js";

type PolicyEngineWindow = Window & {
  __policyenginePostHogInitialized?: boolean;
};

const posthogToken =
  process.env.NEXT_PUBLIC_POSTHOG_TOKEN ??
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const release = process.env.NEXT_PUBLIC_APP_RELEASE;

if (posthogToken && posthogHost) {
  posthog.init(posthogToken, {
    api_host: posthogHost,
    defaults: "2026-01-30",
    loaded: (client) => {
      client.register({
        release,
        surface: "calculator",
      });

      if (process.env.NODE_ENV === "development") {
        client.debug();
      }
    },
  });

  if (typeof window !== "undefined") {
    (window as PolicyEngineWindow).__policyenginePostHogInitialized = true;
  }
}
