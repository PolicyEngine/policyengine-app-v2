import type { NextConfig } from "next";
import { appZoneRewrites } from "./src/data/appZoneRoutes";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Root → /us (temporary — will be replaced with geolocation)
      {
        source: "/",
        destination: "/us",
        permanent: false,
      },
      // Legacy /blog → /research
      {
        source: "/:countryId/blog/:slug",
        destination: "/:countryId/research/:slug",
        permanent: true,
      },
      {
        source: "/:countryId/blog",
        destination: "/:countryId/research",
        permanent: true,
      },
      {
        source: "/us/obbba-household-by-household",
        destination: "/us/obbba-household-explorer",
        permanent: true,
      },
      {
        source: "/us/obbba-household-by-household/:path*",
        destination: "/us/obbba-household-explorer/:path*",
        permanent: true,
      },
      {
        source: "/us/aca-reforms-calculator",
        destination: "/us/aca-calc",
        permanent: true,
      },
      {
        source: "/us/aca-reforms-calculator/:path*",
        destination: "/us/aca-calc/:path*",
        permanent: true,
      },
      {
        source: "/pe84",
        destination: "/us/pe84",
        permanent: true,
      },
      {
        source: "/uk/ads-dashboard",
        destination: "/us/ads-dashboard",
        permanent: true,
      },
      {
        source: "/us/obbba-scatter",
        destination: "/us/obbba-household-explorer",
        permanent: true,
      },
      {
        source: "/us/california-wealth-tax/embed",
        destination: "/us/california-wealth-tax",
        permanent: true,
      },
      {
        source: "/us/california-wealth-tax/embed/:path*",
        destination: "/us/california-wealth-tax/:path*",
        permanent: true,
      },
      // CliffWatch renamed from cliff-watch → cliffwatch
      {
        source: "/:countryId/cliff-watch",
        destination: "/:countryId/cliffwatch",
        permanent: true,
      },
      {
        source: "/:countryId/cliff-watch/:path*",
        destination: "/:countryId/cliffwatch/:path*",
        permanent: true,
      },
    ];
  },

  async rewrites() {
    return {
      // beforeFiles: checked BEFORE filesystem routes (pages).
      // External Next.js apps that serve full pages must go here
      // so they take priority over the dynamic [slug] route.
      beforeFiles: [
        ...appZoneRewrites,
        // Household API docs (Vercel) — beforeFiles so it intercepts before Next.js trailing slash redirect
        {
          source: "/us/api",
          destination:
            "https://household-api-docs-policy-engine.vercel.app/us/api/",
        },
        {
          source: "/us/api/:path*",
          destination:
            "https://household-api-docs-policy-engine.vercel.app/us/api/:path*",
        },
        // Python client docs — same household-api-docs deployment, served at top-level /us/python
        {
          source: "/us/python",
          destination:
            "https://household-api-docs-policy-engine.vercel.app/us/python",
        },
        {
          source: "/us/python/:path*",
          destination:
            "https://household-api-docs-policy-engine.vercel.app/us/python/:path*",
        },
        // Zone asset proxy — API docs uses assetPrefix: '/_zones/household-api-docs'
        {
          source: "/_zones/household-api-docs/:path*",
          destination:
            "https://household-api-docs-policy-engine.vercel.app/_zones/household-api-docs/:path*",
        },
      ],
      // afterFiles: checked after pages/public files but before dynamic routes.
      afterFiles: [
        // Student loan visualisation: the source HTML at student-loan-visualisation.vercel.app
        // does `fetch('./data.json')`. Under the multizone rewrite at /uk/student-loan-visualisation
        // (no trailing slash), the relative URL resolves to /uk/data.json. Proxy it so the
        // figures and table render. Remove once the source repo uses an absolute path or basePath.
        {
          source: "/uk/data.json",
          destination:
            "https://student-loan-visualisation.vercel.app/data.json",
        },
        // PostHog analytics proxy — first-party path bypasses ad blockers that
        // filter *.i.posthog.com. Static rule must come first.
        {
          source: "/ingest/static/:path*",
          destination: "https://us-assets.i.posthog.com/static/:path*",
        },
        {
          source: "/ingest/:path*",
          destination: "https://us.i.posthog.com/:path*",
        },
        // State legislative tracker (Modal)
        {
          source: "/_tracker/:path*",
          destination:
            "https://policyengine--state-legislative-tracker.modal.run/_tracker/:path*",
        },
        // Tracker assets at root paths — temporary until tracker repo updates to use absolute URLs
        {
          source: "/policyengine-favicon.svg",
          destination:
            "https://policyengine--state-legislative-tracker.modal.run/policyengine-favicon.svg",
        },
        {
          source: "/policyengine-logo.svg",
          destination:
            "https://policyengine--state-legislative-tracker.modal.run/policyengine-logo.svg",
        },
        // Slides (Vercel)
        {
          source: "/slides",
          destination: "https://policyengine-slides.vercel.app/slides",
        },
        {
          source: "/slides/:path*",
          destination: "https://policyengine-slides.vercel.app/slides/:path*",
        },
        // Plugin blog (GitHub Pages)
        {
          source: "/plugin-blog",
          destination: "https://policyengine.github.io/plugin-blog/",
        },
        {
          source: "/plugin-blog/:path*",
          destination: "https://policyengine.github.io/plugin-blog/:path*",
        },
        // TAXSIM (Vercel)
        {
          source: "/us/taxsim",
          destination:
            "https://policyengine-taxsim-policy-engine.vercel.app/us/taxsim",
        },
        {
          source: "/us/taxsim/:path*",
          destination:
            "https://policyengine-taxsim-policy-engine.vercel.app/us/taxsim/:path*",
        },
        // Model documentation (Vercel)
        {
          source: "/:countryId/model",
          destination:
            "https://policyengine-model-phi.vercel.app/?country=:countryId",
        },
        {
          source: "/:countryId/model/:path*",
          destination:
            "https://policyengine-model-phi.vercel.app/:path*?country=:countryId",
        },
      ],
    };
  },

  async headers() {
    return [
      {
        source: "/assets/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
