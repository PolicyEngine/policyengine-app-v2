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
    return [
      // State legislative tracker (Modal)
      {
        source: "/_tracker/:path*",
        destination:
          "https://policyengine--state-legislative-tracker.modal.run/_tracker/:path*",
      },
      // Slides (Vercel)
      { source: "/slides", destination: "https://policyengine-slides.vercel.app/slides" },
      { source: "/slides/:path*", destination: "https://policyengine-slides.vercel.app/slides/:path*" },
      // Plugin blog (GitHub Pages)
      { source: "/plugin-blog", destination: "https://policyengine.github.io/plugin-blog/" },
      { source: "/plugin-blog/:path*", destination: "https://policyengine.github.io/plugin-blog/:path*" },
      // Working Americans Tax Cut Act (Vercel)
      { source: "/us/watca", destination: "https://working-americans-tax-cut-act-one.vercel.app/us/watca" },
      { source: "/us/watca/:path*", destination: "https://working-americans-tax-cut-act-one.vercel.app/us/watca/:path*" },
      // Keep Your Pay Act (Vercel)
      { source: "/us/keep-your-pay-act", destination: "https://keep-your-pay-act.vercel.app/us/keep-your-pay-act" },
      { source: "/us/keep-your-pay-act/:path*", destination: "https://keep-your-pay-act.vercel.app/us/keep-your-pay-act/:path*" },
      // TAXSIM (Vercel)
      { source: "/us/taxsim", destination: "https://policyengine-taxsim-policy-engine.vercel.app/us/taxsim" },
      { source: "/us/taxsim/:path*", destination: "https://policyengine-taxsim-policy-engine.vercel.app/us/taxsim/:path*" },
      // Model documentation (Vercel)
      { source: "/:countryId/model", destination: "https://policyengine-model-phi.vercel.app/?country=:countryId" },
      { source: "/:countryId/model/:path*", destination: "https://policyengine-model-phi.vercel.app/:path*?country=:countryId" },
      // Household API docs (Vercel)
      { source: "/us/api", destination: "https://household-api-docs-policy-engine.vercel.app/us/api" },
      { source: "/us/api/:path*", destination: "https://household-api-docs-policy-engine.vercel.app/us/api/:path*" },
    ];
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
