import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Where the canonical /api/geolocate Vercel Function lives (deployed as part
// of the Next.js website at policyengine.org). Calculator-app rewrites to the
// website origin so IPAPI_CO_KEY is configured in a single Vercel project.
const WEBSITE_ORIGIN =
  process.env.NEXT_PUBLIC_WEBSITE_URL || "https://policyengine.org";

const nextConfig: NextConfig = {
  // Compile TypeScript files from ../app/src/ (the shared Vite codebase)
  experimental: {
    externalDir: true,
  },

  async rewrites() {
    return [
      // Proxy geolocation lookups to the website so the ipapi.co API key
      // stays on a single Vercel project. Client code still calls
      // `/api/geolocate` on whatever origin it is running on.
      {
        source: "/api/geolocate",
        destination: `${WEBSITE_ORIGIN}/api/geolocate`,
      },
    ];
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
        "import.meta.env.VITE_WEBSITE_URL": JSON.stringify(
          process.env.NEXT_PUBLIC_WEBSITE_URL || "",
        ),
        "import.meta.env.VITE_CALCULATOR_URL": JSON.stringify(
          process.env.NEXT_PUBLIC_CALCULATOR_URL || "",
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

export default nextConfig;
