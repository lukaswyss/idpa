import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Allow production builds to succeed even if there are ESLint errors.
    ignoreDuringBuilds: true,
  },
} as any;

// Ensure Turbopack uses the correct project root (avoid picking parent lockfiles)
(nextConfig as any).turbopack = { root: __dirname };

export default nextConfig;
