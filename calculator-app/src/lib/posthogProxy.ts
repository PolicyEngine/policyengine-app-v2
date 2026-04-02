const POSTHOG_PROXY_PATH = "/_euclid";

type CloudRegion = "us" | "eu";

type PostHogProxyConfig = {
  apiHost: string;
  apiDestination: string;
  assetDestination: string;
  uiHost: string;
};

const CLOUD_REGION_HOSTS: Record<
  string,
  {
    region: CloudRegion;
    uiHost: string;
    assetDestination: string;
  }
> = {
  "us.i.posthog.com": {
    region: "us",
    uiHost: "https://us.posthog.com",
    assetDestination: "https://us-assets.i.posthog.com",
  },
  "eu.i.posthog.com": {
    region: "eu",
    uiHost: "https://eu.posthog.com",
    assetDestination: "https://eu-assets.i.posthog.com",
  },
};

function normalizeHost(host: string | null | undefined): URL | null {
  if (!host) {
    return null;
  }

  try {
    return new URL(host);
  } catch {
    return null;
  }
}

export function getPostHogProxyConfig(
  host: string | null | undefined
): PostHogProxyConfig | null {
  const normalizedHost = normalizeHost(host);

  if (!normalizedHost) {
    return null;
  }

  const cloudHost = CLOUD_REGION_HOSTS[normalizedHost.hostname];

  if (!cloudHost) {
    return null;
  }

  return {
    apiHost: POSTHOG_PROXY_PATH,
    apiDestination: normalizedHost.origin,
    assetDestination: cloudHost.assetDestination,
    uiHost: cloudHost.uiHost,
  };
}

export function getPostHogProxyRewrites(
  host: string | null | undefined
): Array<{ source: string; destination: string }> {
  const proxyConfig = getPostHogProxyConfig(host);

  if (!proxyConfig) {
    return [];
  }

  return [
    {
      source: `${POSTHOG_PROXY_PATH}/static/:path*`,
      destination: `${proxyConfig.assetDestination}/static/:path*`,
    },
    {
      source: `${POSTHOG_PROXY_PATH}/array/:path*`,
      destination: `${proxyConfig.assetDestination}/array/:path*`,
    },
    {
      source: `${POSTHOG_PROXY_PATH}/:path*`,
      destination: `${proxyConfig.apiDestination}/:path*`,
    },
  ];
}

