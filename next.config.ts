import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // The admin product form accepts image files up to 5 MB. Leave room for
    // multipart boundaries and form fields so valid uploads reach the action.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
