import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure API routes run in Node.js environment (not Edge)
  serverExternalPackages: ['puppeteer'],
  turbopack: {},
};

export default nextConfig;
