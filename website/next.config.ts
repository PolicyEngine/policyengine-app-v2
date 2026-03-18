import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Redirect root to /us (temporary — will be replaced with geolocation)
  async redirects() {
    return [
      {
        source: "/",
        destination: "/us",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
