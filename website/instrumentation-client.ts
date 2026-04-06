import posthog from "posthog-js";
import { getPostHogProxyConfig } from "./src/lib/posthogProxy";

type PolicyEngineWindow = Window & {
  __policyenginePostHogInitialized?: boolean;
};

const posthogToken =
  process.env.NEXT_PUBLIC_POSTHOG_TOKEN ??
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const release = process.env.NEXT_PUBLIC_APP_RELEASE;
const posthogProxy = getPostHogProxyConfig(posthogHost);

if (posthogToken && posthogHost) {
  posthog.init(posthogToken, {
    api_host: posthogProxy?.apiHost ?? posthogHost,
    ui_host: posthogProxy?.uiHost,
    defaults: "2026-01-30",
    loaded: (client) => {
      client.register({
        release,
        surface: "website",
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
