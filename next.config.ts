import type { NextConfig } from "next";

/**
 * Performance-focused config.
 * - No transpilePackages (was forcing slow full-package recompiles)
 * - No custom webpack aliases
 * - optimizePackageImports for heavy icon libs
 * - serverExternalPackages keeps firebase-admin out of client bundles
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
  // Keep compiled pages warm longer during local testing
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000, // 1 hour
    pagesBufferLength: 8,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  serverExternalPackages: ["firebase-admin", "@google-cloud/firestore"],
};

export default nextConfig;
