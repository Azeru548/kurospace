import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
  transpilePackages: ["firebase", "@firebase/firestore", "@firebase/auth"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@firebase/firestore$": path.resolve(
        rootDir,
        "node_modules/@firebase/firestore/dist/index.esm.js"
      ),
    };
    return config;
  },
};

export default nextConfig;
