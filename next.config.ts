import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  poweredByHeader: false,
  experimental: { cpus: 2 },
};

export default nextConfig;
