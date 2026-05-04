import type { NextConfig } from "next";

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
    ];
  },

  async rewrites() {
    return {
      // beforeFiles: checked BEFORE filesystem routes (pages).
      // External Next.js apps that serve full pages must go here
      // so they take priority over the dynamic [slug] route.
      beforeFiles: [
        // State legislative tracker (Modal) — served directly so deep links work
        { source: "/:countryId/state-legislative-tracker", destination: "https://policyengine--state-legislative-tracker.modal.run/" },
        { source: "/:countryId/state-legislative-tracker/:path*", destination: "https://policyengine--state-legislative-tracker.modal.run/:path*" },
        // Working Americans Tax Cut Act (Vercel)
        { source: "/us/watca", destination: "https://working-americans-tax-cut-act-one.vercel.app/us/watca" },
        { source: "/us/watca/:path*", destination: "https://working-americans-tax-cut-act-one.vercel.app/us/watca/:path*" },
        // Keep Your Pay Act (Vercel)
        { source: "/us/keep-your-pay-act", destination: "https://keep-your-pay-act.vercel.app/us/keep-your-pay-act" },
        { source: "/us/keep-your-pay-act/:path*", destination: "https://keep-your-pay-act.vercel.app/us/keep-your-pay-act/:path*" },
        // Oregon Kicker Refund calculator (Vercel)
        { source: "/us/oregon-kicker-refund", destination: "https://oregon-kicker-refund.vercel.app/us/oregon-kicker-refund" },
        { source: "/us/oregon-kicker-refund/:path*", destination: "https://oregon-kicker-refund.vercel.app/us/oregon-kicker-refund/:path*" },
        // SPM threshold calculator (Vercel) — PolicyEngine/spm-calculator
        { source: "/us/spm-calculator", destination: "https://spm-calculator.vercel.app/us/spm-calculator" },
        { source: "/us/spm-calculator/:path*", destination: "https://spm-calculator.vercel.app/us/spm-calculator/:path*" },
        // Marriage calculator (Vercel) — US variant at the zone's basePath;
        // UK variant reuses the same origin with ?country=uk. Rewrites are
        // server-side, so the query only reaches the zone's Node runtime;
        // the zone's server component reads searchParams.country and seeds
        // the client with an initialCountry prop (PolicyEngine/marriage#113).
        { source: "/us/marriage", destination: "https://marriage-zeta-beryl.vercel.app/us/marriage" },
        { source: "/us/marriage/:path*", destination: "https://marriage-zeta-beryl.vercel.app/us/marriage/:path*" },
        { source: "/uk/marriage", destination: "https://marriage-zeta-beryl.vercel.app/us/marriage?country=uk" },
        { source: "/uk/marriage/:path*", destination: "https://marriage-zeta-beryl.vercel.app/us/marriage/:path*?country=uk" },
        // Working Parents Tax Relief Act calculator (Vercel)
        { source: "/us/working-parents-tax-relief-act", destination: "https://wptra.vercel.app/us/working-parents-tax-relief-act" },
        { source: "/us/working-parents-tax-relief-act/:path*", destination: "https://wptra.vercel.app/us/working-parents-tax-relief-act/:path*" },
        // Utah 2026 tax changes calculator (Vercel)
        { source: "/us/utah-2026-tax-changes", destination: "https://policyengine-utah-2026-tax-changes.vercel.app/us/utah-2026-tax-changes" },
        { source: "/us/utah-2026-tax-changes/:path*", destination: "https://policyengine-utah-2026-tax-changes.vercel.app/us/utah-2026-tax-changes/:path*" },
        // West Virginia SB 392 income tax cut calculator (Vercel)
        { source: "/us/wv-sb392-tax-cut", destination: "https://wv-sb392-tax-cut.vercel.app/us/wv-sb392-tax-cut" },
        { source: "/us/wv-sb392-tax-cut/:path*", destination: "https://wv-sb392-tax-cut.vercel.app/us/wv-sb392-tax-cut/:path*" },
        // Household API docs (Vercel) — beforeFiles so it intercepts before Next.js trailing slash redirect
        { source: "/us/api", destination: "https://household-api-docs-policy-engine.vercel.app/us/api/" },
        { source: "/us/api/:path*", destination: "https://household-api-docs-policy-engine.vercel.app/us/api/:path*" },
        // Python client docs — same household-api-docs deployment, served at top-level /us/python
        { source: "/us/python", destination: "https://household-api-docs-policy-engine.vercel.app/us/python" },
        { source: "/us/python/:path*", destination: "https://household-api-docs-policy-engine.vercel.app/us/python/:path*" },
        // Zone asset proxy — API docs uses assetPrefix: '/_zones/household-api-docs'
        { source: "/_zones/household-api-docs/:path*", destination: "https://household-api-docs-policy-engine.vercel.app/_zones/household-api-docs/:path*" },
      ],
      // afterFiles: checked after pages/public files but before dynamic routes.
      afterFiles: [
        // PostHog analytics proxy — first-party path bypasses ad blockers that
        // filter *.i.posthog.com. Static rule must come first.
        { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
        { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
        // State legislative tracker (Modal)
        { source: "/_tracker/:path*", destination: "https://policyengine--state-legislative-tracker.modal.run/_tracker/:path*" },
        // Tracker assets at root paths — temporary until tracker repo updates to use absolute URLs
        { source: "/policyengine-favicon.svg", destination: "https://policyengine--state-legislative-tracker.modal.run/policyengine-favicon.svg" },
        { source: "/policyengine-logo.svg", destination: "https://policyengine--state-legislative-tracker.modal.run/policyengine-logo.svg" },
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

export default nextConfig;
