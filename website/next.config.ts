import { withPostHogConfig } from "@posthog/nextjs-config";
import type { NextConfig } from "next";
import { getPostHogProxyRewrites } from "./src/lib/posthogProxy";

const posthogApiKey = process.env.POSTHOG_API_KEY;
const posthogProjectId = process.env.POSTHOG_PROJECT_ID;
const posthogProxyRewrites = getPostHogProxyRewrites(
  process.env.NEXT_PUBLIC_POSTHOG_HOST
);

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: posthogProxyRewrites.length > 0,

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
    ];
  },

  async rewrites() {
    return {
      // beforeFiles: checked BEFORE filesystem routes (pages).
      // External Next.js apps that serve full pages must go here
      // so they take priority over the dynamic [slug] route.
      beforeFiles: [
        ...posthogProxyRewrites,
        // Working Americans Tax Cut Act (Vercel)
        { source: "/us/watca", destination: "https://working-americans-tax-cut-act-one.vercel.app/us/watca" },
        { source: "/us/watca/:path*", destination: "https://working-americans-tax-cut-act-one.vercel.app/us/watca/:path*" },
        // Keep Your Pay Act (Vercel)
        { source: "/us/keep-your-pay-act", destination: "https://keep-your-pay-act.vercel.app/us/keep-your-pay-act" },
        { source: "/us/keep-your-pay-act/:path*", destination: "https://keep-your-pay-act.vercel.app/us/keep-your-pay-act/:path*" },
        // Oregon Kicker Refund calculator (Vercel)
        { source: "/us/oregon-kicker-refund", destination: "https://oregon-kicker-refund.vercel.app/us/oregon-kicker-refund" },
        { source: "/us/oregon-kicker-refund/:path*", destination: "https://oregon-kicker-refund.vercel.app/us/oregon-kicker-refund/:path*" },
        // Household API docs (Vercel) — beforeFiles so it intercepts before Next.js trailing slash redirect
        { source: "/us/api", destination: "https://household-api-docs-policy-engine.vercel.app/us/api/" },
        { source: "/us/api/:path*", destination: "https://household-api-docs-policy-engine.vercel.app/us/api/:path*" },
        // Zone asset proxy — API docs uses assetPrefix: '/_zones/household-api-docs'
        { source: "/_zones/household-api-docs/:path*", destination: "https://household-api-docs-policy-engine.vercel.app/_zones/household-api-docs/:path*" },
      ],
      // afterFiles: checked after pages/public files but before dynamic routes.
      afterFiles: [
        // State legislative tracker (Modal)
        { source: "/_tracker/:path*", destination: "https://policyengine--state-legislative-tracker.modal.run/_tracker/:path*" },
        // Slides (Vercel)
        { source: "/slides", destination: "https://policyengine-slides.vercel.app/slides" },
        { source: "/slides/:path*", destination: "https://policyengine-slides.vercel.app/slides/:path*" },
        // Plugin blog (GitHub Pages)
        { source: "/plugin-blog", destination: "https://policyengine.github.io/plugin-blog/" },
        { source: "/plugin-blog/:path*", destination: "https://policyengine.github.io/plugin-blog/:path*" },
        // TAXSIM (Vercel)
        { source: "/us/taxsim", destination: "https://policyengine-taxsim-policy-engine.vercel.app/us/taxsim" },
        { source: "/us/taxsim/:path*", destination: "https://policyengine-taxsim-policy-engine.vercel.app/us/taxsim/:path*" },
        // Model documentation (Vercel)
        { source: "/:countryId/model", destination: "https://policyengine-model-phi.vercel.app/?country=:countryId" },
        { source: "/:countryId/model/:path*", destination: "https://policyengine-model-phi.vercel.app/:path*?country=:countryId" },
        // California wealth tax calculator embed (Vercel)
        { source: "/us/california-wealth-tax/embed", destination: "https://california-wealth-tax.vercel.app/us/california-wealth-tax/embed" },
        { source: "/us/california-wealth-tax/embed/:path*", destination: "https://california-wealth-tax.vercel.app/us/california-wealth-tax/embed/:path*" },
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

export default posthogApiKey && posthogProjectId
  ? withPostHogConfig(nextConfig, {
      personalApiKey: posthogApiKey,
      projectId: posthogProjectId,
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      sourcemaps: {
        enabled: true,
        releaseName: "policyengine-website",
        releaseVersion:
          process.env.APP_RELEASE ?? process.env.NEXT_PUBLIC_APP_RELEASE,
        deleteAfterUpload: true,
      },
    })
  : nextConfig;
