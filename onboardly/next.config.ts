import type { NextConfig } from "next";

// Next.js configuration for the Onboardly full-stack app.
const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
