import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Fix workspace root detection warning
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
