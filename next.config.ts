import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the project root so Next.js doesn't walk up to a parent directory
    // that has its own package.json and resolve modules from there.
    root: process.cwd(),
  },
};

export default nextConfig;
