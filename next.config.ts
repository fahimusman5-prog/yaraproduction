import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/shop",
        destination: "/en/shop",
        permanent: true,
      },
    ];
  },
  experimental: {
    // Review forms allow up to five 5 MB photos plus multipart overhead.
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
