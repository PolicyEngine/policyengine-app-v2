import { withPostHogConfig } from "@posthog/nextjs-config";
import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";
import { getPostHogProxyRewrites } from "./src/lib/posthogProxy";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const posthogApiKey = process.env.POSTHOG_API_KEY;
const posthogProjectId = process.env.POSTHOG_PROJECT_ID;
const posthogProxyRewrites = getPostHogProxyRewrites(
  process.env.NEXT_PUBLIC_POSTHOG_HOST,
);

const nextConfig: NextConfig = {
  // Compile TypeScript files from ../app/src/ (the shared Vite codebase)
  skipTrailingSlashRedirect: posthogProxyRewrites.length > 0,

  experimental: {
    externalDir: true,
  },

  async rewrites() {
    return posthogProxyRewrites;
  },

  webpack: (config, { dev }) => {
    // Polyfill import.meta.env for shared code written for Vite.
    // These are replaced at build time — no runtime cost.
    const webpack = require("webpack");
    config.plugins.push(
      new webpack.DefinePlugin({
        "import.meta.env.DEV": JSON.stringify(dev),
        "import.meta.env.PROD": JSON.stringify(!dev),
        "import.meta.env.BASE_URL": JSON.stringify("/"),
        "import.meta.env.MODE": JSON.stringify(
          dev ? "development" : "production",
        ),
        "import.meta.env.SSR": "false",
        "import.meta.env.VITE_APP_MODE": JSON.stringify("calculator"),
        "import.meta.env.VITE_APP_RELEASE": JSON.stringify(
          process.env.NEXT_PUBLIC_APP_RELEASE || process.env.APP_RELEASE || "",
        ),
        "import.meta.env.VITE_WEBSITE_URL": JSON.stringify(
          process.env.NEXT_PUBLIC_WEBSITE_URL || "",
        ),
        "import.meta.env.VITE_CALCULATOR_URL": JSON.stringify(
          process.env.NEXT_PUBLIC_CALCULATOR_URL || "",
        ),
        "import.meta.env.VITE_IPAPI_CO_KEY": JSON.stringify(
          process.env.NEXT_PUBLIC_IPAPI_CO_KEY || "",
        ),
      }),
    );

    // Resolve @/* imports to ../app/src/*
    config.resolve.modules = [
      path.resolve(__dirname, "../app/src"),
      "node_modules",
      ...(config.resolve.modules || []),
    ];

    return config;
  },
};

export default posthogApiKey && posthogProjectId
  ? withPostHogConfig(nextConfig, {
      personalApiKey: posthogApiKey,
      projectId: posthogProjectId,
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      sourcemaps: {
        enabled: true,
        releaseName: "policyengine-calculator",
        releaseVersion:
          process.env.APP_RELEASE ?? process.env.NEXT_PUBLIC_APP_RELEASE,
        deleteAfterUpload: true,
      },
    })
  : nextConfig;
