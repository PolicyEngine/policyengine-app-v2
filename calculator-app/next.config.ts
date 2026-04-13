import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootNodeModules = path.resolve(__dirname, "../node_modules");

const nextConfig: NextConfig = {
  // Compile TypeScript files from ../app/src/ (the shared Vite codebase)
  experimental: {
    externalDir: true,
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

    // Shared app code under ../app/src can otherwise resolve a second copy of
    // React / React Query / Redux from app/node_modules. That breaks context
    // singletons in Next, e.g. QueryClientProvider vs useQueryClient().
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      react: path.join(rootNodeModules, "react"),
      "react-dom": path.join(rootNodeModules, "react-dom"),
      "react/jsx-runtime": path.join(rootNodeModules, "react/jsx-runtime.js"),
      "react/jsx-dev-runtime": path.join(
        rootNodeModules,
        "react/jsx-dev-runtime.js",
      ),
      "react-redux": path.join(rootNodeModules, "react-redux"),
      "@reduxjs/toolkit": path.join(rootNodeModules, "@reduxjs/toolkit"),
      "@tanstack/query-core": path.join(
        rootNodeModules,
        "@tanstack/query-core",
      ),
      "@tanstack/react-query": path.join(
        rootNodeModules,
        "@tanstack/react-query",
      ),
      "@tanstack/react-query-devtools": path.join(
        rootNodeModules,
        "@tanstack/react-query-devtools",
      ),
    };

    return config;
  },
};

export default nextConfig;
